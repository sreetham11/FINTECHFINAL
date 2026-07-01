import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET /api/mood/history — fetch last 30 days of mood check-ins and aggregated spending
export async function GET() {
  try {
    const user = await getAuthUser();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get check-ins
    const checkins = await prisma.moodCheckin.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get transactions for the same period to calculate daily spend
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    // Group transaction amounts by day (YYYY-MM-DD)
    const dailySpend: Record<string, number> = {};
    for (const tx of transactions) {
      const dateKey = tx.createdAt.toISOString().slice(0, 10);
      dailySpend[dateKey] = (dailySpend[dateKey] ?? 0) + tx.amount;
    }

    // Attach daily spend to mood check-ins
    const history = checkins.map(ci => {
      const dateKey = ci.createdAt.toISOString().slice(0, 10);
      return {
        ...ci,
        spendOnDay: Math.round((dailySpend[dateKey] ?? 0) * 100) / 100,
      };
    });

    return NextResponse.json({ history });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    console.error('GET /api/mood/history error:', e);
    return NextResponse.json({ error: 'Failed to fetch mood history' }, { status: 500 });
  }
}
