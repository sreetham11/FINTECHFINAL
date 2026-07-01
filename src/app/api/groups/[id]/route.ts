import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET /api/groups/[id] — fetch single group with full details
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();

    // Verify user is a member
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.id, userId: user.id } },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Group not found or access denied' }, { status: 404 });
    }

    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        expenses: {
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
        },
        settlements: {
          include: {
            from: { select: { id: true, name: true } },
            to: { select: { id: true, name: true } },
          },
          orderBy: { settledAt: 'desc' },
        },
      },
    });

    return NextResponse.json({ group });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    console.error('GET /api/groups/[id] error:', e);
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}
