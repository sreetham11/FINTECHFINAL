import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

const MoodSchema = z.object({
  mood: z.enum(['STRESSED', 'NEUTRAL', 'CONFIDENT', 'EXCITED']),
  spendingContext: z.string().max(500).optional(),
});

// POST /api/mood — submit mood check-in with AI insight (streamed)
export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    const body = await req.json();
    const { mood, spendingContext } = MoodSchema.parse(body);

    // 1. Get last 7 days of mood check-ins for trend
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentMoods = await prisma.moodCheckin.findMany({
      where: { userId: user.id, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: 'asc' },
      select: { mood: true, createdAt: true },
    });

    // 2. Get last 10 transactions for spending context
    const recentTxns = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { merchant: true, category: true, amount: true, currency: true, createdAt: true },
    });

    // 3. Compute category breakdown
    const categoryTotals: Record<string, number> = {};
    let weekTotal = 0;
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    for (const txn of recentTxns) {
      categoryTotals[txn.category] = (categoryTotals[txn.category] ?? 0) + txn.amount;
      if (new Date(txn.createdAt) >= oneWeekAgo) weekTotal += txn.amount;
    }
    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat, total]) => `${cat}: $${total.toFixed(2)}`);

    // 4. Update streak logic
    const lastCheckin = await prisma.moodCheckin.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { moodStreak: true },
    });

    let newStreak = 1;
    if (lastCheckin) {
      const lastCheckinDate = new Date(lastCheckin.createdAt);
      lastCheckinDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diffTime = Math.abs(today.getTime() - lastCheckinDate.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        newStreak = currentUser?.moodStreak ?? 1;
      } else if (diffDays === 1) {
        newStreak = (currentUser?.moodStreak ?? 0) + 1;
      } else {
        newStreak = 1;
      }
    }

    // 5. Save check-in and update streak (non-blocking — save first, stream insight after)
    const checkin = await prisma.moodCheckin.create({
      data: {
        userId: user.id,
        mood,
        spendingContext,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { moodStreak: newStreak },
    });

    // 6. Stream AI insight using Vercel AI SDK
    const moodTrend = recentMoods.map(m => m.mood).join(' → ');
    const moodEmoji: Record<string, string> = {
      STRESSED: '😰',
      NEUTRAL: '😐',
      CONFIDENT: '😎',
      EXCITED: '🤩',
    };

    const result = streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      system: `You are NETS Quest's financial wellness coach. You give honest, Gen Z-toned spending insights that are warm but direct. Never be preachy. Be conversational and specific. Keep it to 2-3 sentences max.`,
      prompt: `User just checked in feeling ${mood} ${moodEmoji[mood] ?? ''}.
 
 Context they shared: "${spendingContext || 'none'}"
 
 Their mood trend over the last 7 days: ${moodTrend || mood} → ${mood}
 
 Their top spending categories (last 10 transactions): ${topCategories.join(', ') || 'No transactions yet'}
 
 Total spent this week: SGD ${weekTotal.toFixed(2)}
 
 Generate a 2-3 sentence personalised spending insight based on this mood check-in and spending pattern. Be honest and Gen Z in tone — mention their actual spending if relevant. Reference Singapore-specific context (hawker, MRT, Grab) where natural.`,
    });

    // Attach checkin ID and streak to response headers
    const streamResponse = result.toTextStreamResponse();
    streamResponse.headers.set('X-Checkin-Id', checkin.id);
    streamResponse.headers.set('X-Mood-Streak', String(newStreak));

    return streamResponse;
  } catch (e) {
    if (e instanceof NextResponse) return e;
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: e.issues }, { status: 400 });
    }
    console.error('POST /api/mood error:', e);
    return NextResponse.json({ error: 'Failed to save mood check-in' }, { status: 500 });
  }
}
