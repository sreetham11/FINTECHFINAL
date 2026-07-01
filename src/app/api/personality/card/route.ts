import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { PaymentPersonality } from '@prisma/client';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const PERSONALITY_DETAILS: Record<PaymentPersonality, { title: string; traits: string[]; story: string }> = {
  THE_PLANNER: {
    title: 'The Budget Planner',
    traits: ['Forward Thinker', 'Receipt Tracker', 'Discipline Master'],
    story: 'You map out every dollar and know exactly where your cash goes. You are the friend who splits the bill instantly and has spreadsheets for group trips.',
  },
  THE_IMPULSIVE: {
    title: 'The Spontaneous Spender',
    traits: ['Late Night Snacker', 'Impulsive Buyer', 'FOMO Driven'],
    story: 'You live in the moment and buy that iced matcha latte or midnight supper without a second thought. Savings are a future problem.',
  },
  THE_SOCIAL_SPENDER: {
    title: 'The Cafe Crawler',
    traits: ['Aesthetic Lover', 'Cafe Hopper', 'Social Magnet'],
    story: 'Your spending is centered around dining out, meeting friends, and trying the latest aesthetic spots. Good vibes and memories are worth every cent to you.',
  },
  THE_SAVER: {
    title: 'The Budget Ninja',
    traits: ['Hawker Hero', 'Deals Hunter', 'Frugal King/Queen'],
    story: 'You know all the best $3.50 chicken rice spots and rarely pay full price for anything. Tapping for transport and cheap eats is your lifestyle.',
  },
  THE_EXPLORER: {
    title: 'The Overseas Adventurer',
    traits: ['Frequent Flyer', 'Multi-Currency User', 'Adventure Seeker'],
    story: 'Your spending is full of plane tickets, hostel bookings, and overseas scan-to-pay. You are rarely in Singapore and love discovering new cities.',
  },
  UNCLASSIFIED: {
    title: 'The Undefined Spender',
    traits: ['Mystery Spender', 'Just Starting Out', 'Silent Observer'],
    story: 'You haven\'t logged enough transactions for us to pinpoint your financial vibe yet. Keep spending with NETS to unlock your personality!',
  },
};

// GET /api/personality/card — reads the saved personality from DB and returns the full card data
export async function GET() {
  try {
    const user = await getAuthUser();

    // Get current transaction count
    const totalTransactionsCount = await prisma.transaction.count({
      where: { userId: user.id },
    });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        paymentPersonality: true,
        paymentPersonalityDescription: true,
        paymentPersonalityTips: true,
        lastClassifiedTxCount: true,
      },
    });

    const personality = dbUser?.paymentPersonality ?? PaymentPersonality.UNCLASSIFIED;
    const lastCount = dbUser?.lastClassifiedTxCount ?? 0;
    const diff = totalTransactionsCount - lastCount;

    const shouldRecalculate = personality === PaymentPersonality.UNCLASSIFIED || diff > 20;

    // If we have enough transactions but haven't classified or have > 20 new ones, recalculate!
    if (shouldRecalculate && totalTransactionsCount >= 3) {
      try {
        const transactions = await prisma.transaction.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });

        const categories = Array.from(new Set(transactions.map(t => t.category))).join(', ');
        const maxTxn = transactions.reduce((prev, curr) => (prev.amount > curr.amount ? prev : curr));
        const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
        const overseasCount = transactions.filter(t => t.countryCode && t.countryCode !== 'SG').length;

        // Top merchants
        const merchantCounts: Record<string, number> = {};
        transactions.forEach(t => merchantCounts[t.merchant] = (merchantCounts[t.merchant] ?? 0) + 1);
        const topMerchants = Object.entries(merchantCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([m]) => m)
          .join(', ');

        // Time patterns
        let morning = 0, afternoon = 0, evening = 0, night = 0;
        transactions.forEach(t => {
          const hr = new Date(t.createdAt).getHours();
          if (hr >= 6 && hr < 12) morning++;
          else if (hr >= 12 && hr < 17) afternoon++;
          else if (hr >= 17 && hr < 21) evening++;
          else night++;
        });
        const timePattern = `Morning: ${morning}, Afternoon: ${afternoon}, Evening: ${evening}, Night: ${night}`;

        let newPersonality: PaymentPersonality = PaymentPersonality.UNCLASSIFIED;
        let description = '';
        let tips: string[] = [];

        const { text } = await generateText({
          model: anthropic('claude-3-5-sonnet-20241022'),
          system: `You are a financial classification model. Analyze the transaction stats for a user in Singapore and classify them into exactly ONE of the keys.
Return ONLY valid JSON in format:
{
  "personality": "THE_PLANNER | THE_IMPULSIVE | THE_SOCIAL_SPENDER | THE_SAVER | THE_EXPLORER",
  "description": "Customized 3-sentence Gen Z-toned summary.",
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}`,
          prompt: `User's transaction profile:
- Total Transactions: ${transactions.length}
- Total Spent: SGD ${totalSpent.toFixed(2)}
- Average Spend: SGD ${(totalSpent / transactions.length).toFixed(2)}
- Categories: ${categories}
- Most frequent merchants: ${topMerchants}
- Time-of-day: ${timePattern}
- Largest transaction: SGD ${maxTxn.amount.toFixed(2)} at ${maxTxn.merchant}
- Overseas transactions: ${overseasCount} out of ${transactions.length}`,
        });

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.personality && Object.values(PaymentPersonality).includes(parsed.personality as PaymentPersonality)) {
            newPersonality = parsed.personality as PaymentPersonality;
            description = parsed.description;
            tips = parsed.tips;
          }
        }

        // Fallbacks
        if (newPersonality === PaymentPersonality.UNCLASSIFIED) {
          if (overseasCount > 0) newPersonality = PaymentPersonality.THE_EXPLORER;
          else if (totalSpent / transactions.length < 6) newPersonality = PaymentPersonality.THE_SAVER;
          else if (categories.includes('Cafe') || categories.includes('Dining')) newPersonality = PaymentPersonality.THE_SOCIAL_SPENDER;
          else newPersonality = PaymentPersonality.THE_PLANNER;
          description = PERSONALITY_DETAILS[newPersonality].story;
        }

        // Save
        await prisma.user.update({
          where: { id: user.id },
          data: {
            paymentPersonality: newPersonality,
            paymentPersonalityDescription: description,
            paymentPersonalityTips: JSON.stringify(tips),
            lastClassifiedTxCount: totalTransactionsCount,
          },
        });

        return NextResponse.json({
          personality: newPersonality,
          title: PERSONALITY_DETAILS[newPersonality].title,
          traits: PERSONALITY_DETAILS[newPersonality].traits,
          description,
          tips,
          recalculated: true,
          stats: {
            totalSpent: Math.round(totalSpent * 100) / 100,
            transactionCount: totalTransactionsCount,
          },
        });
      } catch (err) {
        console.error('Auto recalculation error in card route:', err);
      }
    }

    // Return the cached details
    const details = PERSONALITY_DETAILS[personality];
    let tips: string[] = [];
    if (dbUser?.paymentPersonalityTips) {
      try {
        tips = JSON.parse(dbUser.paymentPersonalityTips as string);
      } catch {
        tips = [];
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      select: { amount: true },
    });
    const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    return NextResponse.json({
      personality,
      title: details.title,
      traits: details.traits,
      description: dbUser?.paymentPersonalityDescription || details.story,
      tips: tips.length > 0 ? tips : ['Log more transactions to reveal customized tips'],
      recalculated: false,
      stats: {
        totalSpent: Math.round(totalSpent * 100) / 100,
        transactionCount: totalTransactionsCount,
      },
    });

  } catch (e) {
    if (e instanceof NextResponse) return e;
    console.error('GET /api/personality/card error:', e);
    return NextResponse.json({ error: 'Failed to fetch personality card' }, { status: 500 });
  }
}
