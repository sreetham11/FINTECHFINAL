import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { getTier, getTierProgress } from '@/lib/miles';

// GET /api/miles — the authenticated user's miles total, tier and recent log.
export async function GET() {
  try {
    const user = await getAuthUser();

    const [record, log] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { miles: true },
      }),
      prisma.milesLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { reason: true, miles: true, createdAt: true },
      }),
    ]);

    const total = record?.miles ?? 0;
    const tier = getTier(total);
    const progress = getTierProgress(total);

    return NextResponse.json({
      total,
      tier: { id: tier.id, label: tier.label, color: tier.color, unlockLine: tier.unlockLine },
      nextTier: progress.nextTier
        ? { id: progress.nextTier.id, label: progress.nextTier.label, min: progress.nextTier.min }
        : null,
      milesToNext: progress.milesToNext,
      fraction: progress.fraction,
      log,
    });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    console.error('GET /api/miles error:', e);
    return NextResponse.json({ error: 'Failed to fetch miles' }, { status: 500 });
  }
}
