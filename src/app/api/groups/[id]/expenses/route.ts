import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

const CreateExpenseSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().positive(),
  currency: z.string().length(3).default('SGD'),
  category: z.string().min(1),
  receiptUrl: z.string().url().nullable().optional(),
  // Optional: override split amounts. If not provided, splits equally.
  customSplits: z.record(z.string(), z.number()).optional(),
  extractedData: z.any().optional(),
});

// GET /api/groups/[id]/expenses
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

    const expenses = await prisma.expense.findMany({
      where: { groupId: params.id },
      include: {
        payer: { select: { id: true, name: true, avatar: true } },
        splits: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
        notes: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ expenses });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    console.error('GET /api/groups/[id]/expenses error:', e);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

// POST /api/groups/[id]/expenses — add an expense with auto-split
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
    const { title, amount, currency, category, receiptUrl, customSplits, extractedData } = CreateExpenseSchema.parse(body);

    // Get all group members for auto-splitting
    const members = await prisma.groupMember.findMany({
      where: { groupId: params.id },
      select: { userId: true },
    });
    const memberIds = members.map(m => m.userId);

    // Calculate splits
    let splits: { userId: string; amountOwed: number }[];

    if (customSplits) {
      // Validate custom splits sum to total
      const customTotal = Object.values(customSplits).reduce((a, b) => a + b, 0);
      if (Math.abs(customTotal - amount) > 0.01) {
        return NextResponse.json({ error: 'Custom splits must sum to total amount' }, { status: 400 });
      }
      splits = Object.entries(customSplits)
        .filter(([uid]) => memberIds.includes(uid))
        .map(([userId, amountOwed]) => ({ userId, amountOwed }));
    } else {
      // Equal split among all members
      const perPerson = Math.round((amount / memberIds.length) * 100) / 100;
      // Handle rounding: give remainder to payer
      const remainder = Math.round((amount - perPerson * memberIds.length) * 100) / 100;
      splits = memberIds.map((userId, i) => ({
        userId,
        amountOwed: userId === user.id && i === 0 ? perPerson + remainder : perPerson,
      }));
    }

    // Create expense + splits in a transaction
    const expense = await prisma.$transaction(async (tx) => {
      const newExpense = await tx.expense.create({
        data: {
          groupId: params.id,
          paidBy: user.id,
          title,
          amount,
          currency,
          category,
          receiptUrl: receiptUrl || null,
          extractedData: extractedData || null,
          splits: {
            create: splits,
          },
        },
        include: {
          payer: { select: { id: true, name: true, avatar: true } },
          splits: {
            include: { user: { select: { id: true, name: true, avatar: true } } },
          },
        },
      });
      return newExpense;
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: e.issues }, { status: 400 });
    }
    console.error('POST /api/groups/[id]/expenses error:', e);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
