import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

interface Balance {
  fromUser: string;
  fromName: string;
  toUser: string;
  toName: string;
  amount: number;
  currency: string;
}

/**
 * Debt simplification algorithm — reduces N debts to the minimum number of
 * transactions needed to settle all balances. Uses a greedy two-pointer approach.
 */
function simplifyDebts(
  netBalances: Map<string, number>,
  userNames: Map<string, string>,
  currency: string
): Balance[] {
  // Separate creditors (positive) and debtors (negative)
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  netBalances.forEach((balance, userId) => {
    const rounded = Math.round(balance * 100) / 100;
    if (rounded > 0.005) creditors.push({ id: userId, amount: rounded });
    else if (rounded < -0.005) debtors.push({ id: userId, amount: Math.abs(rounded) });
  });

  // Sort descending for greedy matching
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions: Balance[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci];
    const debt = debtors[di];
    const settleAmount = Math.min(credit.amount, debt.amount);

    if (settleAmount > 0.005) {
      transactions.push({
        fromUser: debt.id,
        fromName: userNames.get(debt.id) ?? debt.id,
        toUser: credit.id,
        toName: userNames.get(credit.id) ?? credit.id,
        amount: Math.round(settleAmount * 100) / 100,
        currency,
      });
    }

    credit.amount -= settleAmount;
    debt.amount -= settleAmount;

    if (credit.amount < 0.005) ci++;
    if (debt.amount < 0.005) di++;
  }

  return transactions;
}

// GET /api/groups/[id]/balances — who owes whom
export async function GET(
  _req: Request,
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

    const group = await prisma.group.findUnique({
      where: { id: params.id },
      select: { currency: true },
    });

    // Get all unsettled splits
    const splits = await prisma.expenseSplit.findMany({
      where: {
        expense: { groupId: params.id },
        isSettled: false,
      },
      include: {
        expense: {
          select: { paidBy: true, amount: true, currency: true },
        },
        user: { select: { id: true, name: true } },
      },
    });

    // Get payer names
    const members = await prisma.groupMember.findMany({
      where: { groupId: params.id },
      include: { user: { select: { id: true, name: true } } },
    });
    const userNames = new Map(members.map(m => [m.userId, m.user.name]));

    // Compute net balances: payer gets +amount, splitters get -amountOwed
    const netBalances = new Map<string, number>();
    members.forEach(m => netBalances.set(m.userId, 0));

    splits.forEach(split => {
      const payerId = split.expense.paidBy;
      const splitUserId = split.userId;

      // Payer lent this money
      netBalances.set(payerId, (netBalances.get(payerId) ?? 0) + split.amountOwed);
      // Split user owes this money (but not themselves)
      if (splitUserId !== payerId) {
        netBalances.set(splitUserId, (netBalances.get(splitUserId) ?? 0) - split.amountOwed);
      }
    });

    const simplifiedDebts = simplifyDebts(netBalances, userNames, group?.currency ?? 'SGD');

    // Per-member summary
    const memberSummary = members.map(m => ({
      userId: m.userId,
      name: m.user.name,
      netBalance: Math.round((netBalances.get(m.userId) ?? 0) * 100) / 100,
    }));

    return NextResponse.json({
      debts: simplifiedDebts,
      memberSummary,
      currency: group?.currency ?? 'SGD',
    });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    console.error('GET /api/groups/[id]/balances error:', e);
    return NextResponse.json({ error: 'Failed to compute balances' }, { status: 500 });
  }
}
