import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

const NoteSchema = z.object({
  note: z.string().min(1).max(500),
});

// POST /api/expenses/[id]/note
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();

    // Verify the expense exists and user is in the group
    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      select: { groupId: true },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: expense.groupId, userId: user.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await req.json();
    const { note } = NoteSchema.parse(body);

    const expenseNote = await prisma.expenseNote.create({
      data: {
        expenseId: params.id,
        userId: user.id,
        note,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({ note: expenseNote }, { status: 201 });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: e.issues }, { status: 400 });
    }
    console.error('POST /api/expenses/[id]/note error:', e);
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }
}

// GET /api/expenses/[id]/note — list all notes for an expense
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();

    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      select: { groupId: true },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: expense.groupId, userId: user.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const notes = await prisma.expenseNote.findMany({
      where: { expenseId: params.id },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ notes });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    console.error('GET /api/expenses/[id]/note error:', e);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}
