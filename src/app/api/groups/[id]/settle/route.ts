import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

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
            expense: { groupId: params.id },
          },
        });

        totalSettled = splits.reduce((sum, s) => sum + s.amountOwed, 0);
        settledCount = splits.length;

        await tx.expenseSplit.updateMany({
          where: { id: { in: splitIds } },
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

    return NextResponse.json({
      settled: true,
      settledCount,
      totalSettled: Math.round(totalSettled * 100) / 100,
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
