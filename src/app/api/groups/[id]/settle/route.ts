import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';
import { awardMiles } from '@/lib/award-miles';

const SettleSchema = z.object({
  // Settle specific splits (by split IDs) OR settle all debts between two users
  splitIds: z.array(z.string()).optional(),
  toUserId: z.string().optional(), // settle all splits from auth user to this user
});

// POST /api/groups/[id]/settle
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();

    // Verify membership
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.id, userId: user.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await req.json();
    const { splitIds, toUserId } = SettleSchema.parse(body);

    if (!splitIds && !toUserId) {
      return NextResponse.json({ error: 'Provide either splitIds or toUserId' }, { status: 400 });
    }

    let totalSettled = 0;
    let settledCount = 0;

    await prisma.$transaction(async (tx) => {
      if (splitIds && splitIds.length > 0) {
        // Settle specific splits
        const splits = await tx.expenseSplit.findMany({
          where: {
            id: { in: splitIds },
            userId: user.id, // can only settle your own splits
            isSettled: false, // don't re-settle / double-count
            expense: { groupId: params.id },
          },
        });

        totalSettled = splits.reduce((sum, s) => sum + s.amountOwed, 0);
        settledCount = splits.length;

        // Only settle the caller's own splits in this group — use the ids that
        // passed the ownership filter above, not the raw client-supplied ids.
        await tx.expenseSplit.updateMany({
          where: { id: { in: splits.map(s => s.id) } },
          data: { isSettled: true },
        });
      } else if (toUserId) {
        // Settle all splits the auth user owes (where payer is toUserId)
        const splits = await tx.expenseSplit.findMany({
          where: {
            userId: user.id,
            isSettled: false,
            expense: {
              groupId: params.id,
              paidBy: toUserId,
            },
          },
        });

        totalSettled = splits.reduce((sum, s) => sum + s.amountOwed, 0);
        settledCount = splits.length;

        await tx.expenseSplit.updateMany({
          where: { id: { in: splits.map(s => s.id) } },
          data: { isSettled: true },
        });
      }

      // Get group currency
      const group = await tx.group.findUnique({
        where: { id: params.id },
        select: { currency: true },
      });

      // Create settlement record
      if (totalSettled > 0 && toUserId) {
        await tx.settlement.create({
          data: {
            groupId: params.id,
            fromUser: user.id,
            toUser: toUserId,
            amount: Math.round(totalSettled * 100) / 100,
            currency: group?.currency ?? 'SGD',
          },
        });
      }
    });

    // +25 NETS Miles when this settlement clears the vault entirely (no unsettled
    // splits remain across the whole group). Once per group vault.
    let milesAwarded = 0;
    if (settledCount > 0) {
      try {
        const remaining = await prisma.expenseSplit.count({
          where: { isSettled: false, expense: { groupId: params.id } },
        });
        if (remaining === 0) {
          const r = await awardMiles(user.id, 'vault_settle', params.id);
          milesAwarded = r.awarded;
        }
      } catch (e) {
        console.error('miles awarding (settle) failed:', e);
      }
    }

    return NextResponse.json({
      settled: true,
      settledCount,
      totalSettled: Math.round(totalSettled * 100) / 100,
      milesAwarded,
    });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: e.issues }, { status: 400 });
    }
    console.error('POST /api/groups/[id]/settle error:', e);
    return NextResponse.json({ error: 'Failed to settle' }, { status: 500 });
  }
}
