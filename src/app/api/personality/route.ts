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

// GET /api/personality — get saved personality card data and transaction stats
export async function GET() {
  try {
    const user = await getAuthUser();

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        paymentPersonality: true,
        paymentPersonalityDescription: true,
        paymentPersonalityTips: true,
      },
    });

    const personality = dbUser?.paymentPersonality ?? PaymentPersonality.UNCLASSIFIED;
    const details = PERSONALITY_DETAILS[personality];

    // Compute simple stats for the user
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { amount: true, category: true, countryCode: true },
    });

    const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const categoryCounts: Record<string, number> = {};
    let overseasCount = 0;

    for (const tx of transactions) {
      categoryCounts[tx.category] = (categoryCounts[tx.category] ?? 0) + 1;
      if (tx.countryCode && tx.countryCode !== 'SG') {
        overseasCount++;
      }
    }

    const topCategory = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'N/A';

    let tips: string[] = [];
    if (dbUser?.paymentPersonalityTips) {
      try {
        tips = JSON.parse(dbUser.paymentPersonalityTips as string);
      } catch {
        tips = [];
      }
    }

    // Default tips if none generated
    if (tips.length === 0) {
      if (personality === PaymentPersonality.THE_PLANNER) {
        tips = ['Keep updating your spreadsheets', 'Set budget warnings', 'Celebrate your financial milestones'];
      } else if (personality === PaymentPersonality.THE_IMPULSIVE) {
        tips = ['Enable transaction alerts', 'Keep a 24h cooling off period', 'Separate fun budget from savings'];
      } else if (personality === PaymentPersonality.THE_SOCIAL_SPENDER) {
        tips = ['Compare aesthetic spot prices', 'Track group bills instantly', 'Look for group dining deals'];
      } else if (personality === PaymentPersonality.THE_SAVER) {
        tips = ['Invest your savings wisely', 'Treat yourself occasionally', 'Keep hunting deals without FOMO'];
      } else if (personality === PaymentPersonality.THE_EXPLORER) {
        tips = ['Monitor foreign exchange rates', 'Keep safety backup cash', 'Use digital cards for overseas payments'];
      } else {
        tips = ['Log transactions to unlock tips', 'Try different category payments', 'Check back soon!'];
      }
    }

    return NextResponse.json({
      personality,
      title: details.title,
      traits: details.traits,
      description: dbUser?.paymentPersonalityDescription || details.story,
      story: dbUser?.paymentPersonalityDescription || details.story,
      tips,
      stats: {
        totalSpent: Math.round(totalSpent * 100) / 100,
        transactionCount: transactions.length,
        topCategory,
        overseasRatio: transactions.length > 0 ? overseasCount / transactions.length : 0,
      },
    });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    console.error('GET /api/personality error:', e);
    return NextResponse.json({ error: 'Failed to fetch personality' }, { status: 500 });
  }
}

// POST /api/personality — analyze transactions and update payment personality
export async function POST(_req: Request) {
  try {
    const user = await getAuthUser();

    // Read last 50 transactions from DB
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (transactions.length < 3) {
      return NextResponse.json({
        error: 'Insufficient transactions',
        message: 'You need at least 3 transactions to generate a payment personality.',
      }, { status: 400 });
    }

    const categories = Array.from(new Set(transactions.map(t => t.category))).join(', ');
    const maxTxn = transactions.reduce((prev, curr) => (prev.amount > curr.amount ? prev : curr));
    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const overseasCount = transactions.filter(t => t.countryCode && t.countryCode !== 'SG').length;

    // Most frequent merchants
    const merchantCounts: Record<string, number> = {};
    transactions.forEach(t => merchantCounts[t.merchant] = (merchantCounts[t.merchant] ?? 0) + 1);
    const topMerchants = Object.entries(merchantCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([m]) => m)
      .join(', ');

    // Time-of-day spending patterns
    let morning = 0;
    let afternoon = 0;
    let evening = 0;
    let night = 0;
    transactions.forEach(t => {
      const hr = new Date(t.createdAt).getHours();
      if (hr >= 6 && hr < 12) morning++;
      else if (hr >= 12 && hr < 17) afternoon++;
      else if (hr >= 17 && hr < 21) evening++;
      else night++;
    });
    const timePattern = `Morning: ${morning}, Afternoon: ${afternoon}, Evening: ${evening}, Night: ${night}`;

    let personality: PaymentPersonality = PaymentPersonality.UNCLASSIFIED;
    let description = '';
    let tips: string[] = [];

    // Call Claude API for intelligent classification via Vercel AI SDK
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        const { text } = await generateText({
          model: anthropic('claude-3-5-sonnet-20241022'),
          system: `You are a financial classification model. Analyze the transaction stats for a user in Singapore and classify them into exactly ONE of the following keys:
- THE_PLANNER: High average transaction value, structured, balanced.
- THE_IMPULSIVE: Late night transactions, food/shopping heavy, sudden spikes in spending.
- THE_SOCIAL_SPENDER: Cafe, restaurant, entertainment, and split bill transactions.
- THE_SAVER: Low transaction values, mostly hawkers, public transit, highly cost-conscious.
- THE_EXPLORER: Has overseas transactions, multi-currency usage.

You MUST return ONLY a valid JSON object in this exact format:
{
  "personality": "THE_PLANNER | THE_IMPULSIVE | THE_SOCIAL_SPENDER | THE_SAVER | THE_EXPLORER",
  "description": "A 3-sentence Gen Z-toned summary of their spending personality based on their transaction profile. Be conversational, relatable and direct.",
  "tips": [
    "Tip 1 (specific to their transactions)",
    "Tip 2 (specific to their transactions)",
    "Tip 3 (specific to their transactions)"
  ]
}
Do not include any explanation or markdown formatting. Return only the JSON object.`,
          prompt: `User's transaction profile:
- Total Transactions analyzed: ${transactions.length}
- Total Spent: SGD ${totalSpent.toFixed(2)}
- Average Transaction Value: SGD ${(totalSpent / transactions.length).toFixed(2)}
- Categories: ${categories}
- Most frequent merchants: ${topMerchants}
- Time-of-day spending patterns: ${timePattern}
- Largest transaction: SGD ${maxTxn.amount.toFixed(2)} at ${maxTxn.merchant}
- Overseas transactions: ${overseasCount} out of ${transactions.length}

Classify the user and write a customized 3-sentence description and 3 tips.`,
        });

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.personality && Object.values(PaymentPersonality).includes(parsed.personality as PaymentPersonality)) {
            personality = parsed.personality as PaymentPersonality;
            description = parsed.description;
            tips = parsed.tips;
          }
        }
      } catch (aiErr) {
        console.error('Failed to classify personality via Claude:', aiErr);
      }
    }

    // Heuristics fallback if AI fails or isn't configured
    if (personality === PaymentPersonality.UNCLASSIFIED) {
      if (overseasCount > 0) {
        personality = PaymentPersonality.THE_EXPLORER;
      } else if (totalSpent / transactions.length < 6) {
        personality = PaymentPersonality.THE_SAVER;
      } else if (categories.includes('Cafe') || categories.includes('Dining') || categories.includes('Entertainment')) {
        personality = PaymentPersonality.THE_SOCIAL_SPENDER;
      } else if (maxTxn.amount > 100) {
        personality = PaymentPersonality.THE_IMPULSIVE;
      } else {
        personality = PaymentPersonality.THE_PLANNER;
      }
      description = PERSONALITY_DETAILS[personality].story;
    }

    // Save to user database record
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        paymentPersonality: personality,
        paymentPersonalityDescription: description || PERSONALITY_DETAILS[personality].story,
        paymentPersonalityTips: JSON.stringify(tips),
        lastClassifiedTxCount: transactions.length,
      },
    });

    const details = PERSONALITY_DETAILS[personality];

    return NextResponse.json({
      personality,
      title: details.title,
      traits: details.traits,
      description: description || details.story,
      story: description || details.story,
      tips,
    });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    console.error('POST /api/personality error:', e);
    return NextResponse.json({ error: 'Failed to generate personality' }, { status: 500 });
  }
}
