import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';
import { getVaultPerks } from '@/lib/vault-perks';

const CreateGroupSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['TRIP', 'HOUSEHOLD', 'EVENT']).default('TRIP'),
  currency: z.string().length(3).default('SGD'),
  emoji: z.string().optional(),
  destination: z.string().optional(),
  targetAmount: z.number().positive().optional(),
});

// GET /api/groups — list all groups the auth user belongs to
export async function GET() {
  try {
    const user = await getAuthUser();

    const groups = await prisma.group.findMany({
      where: {
        members: { some: { userId: user.id } },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
        expenses: {
          select: { id: true, amount: true, currency: true, title: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: { select: { expenses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ groups });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    console.error('GET /api/groups error:', e);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

// POST /api/groups — create a new group
export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    const body = await req.json();
    const data = CreateGroupSchema.parse(body);

    // Vault perk gate: everyone gets one vault. A second concurrent vault only
    // unlocks once an existing vault becomes "Legendary" (high squad engagement).
    const existing = await prisma.group.findMany({
      where: { members: { some: { userId: user.id } } },
      select: {
        _count: { select: { expenses: true, settlements: true, members: true } },
      },
    });
    if (existing.length >= 1) {
      const anyLegendary = existing.some((g) =>
        getVaultPerks({
          members: g._count.members,
          expenses: g._count.expenses,
          settlements: g._count.settlements,
          notes: 0,
          memories: 0,
        }).unlocks.secondVault
      );
      if (!anyLegendary) {
        return NextResponse.json(
          { error: 'Level up an existing vault to Legendary to unlock a second vault.' },
          { status: 403 }
        );
      }
    }

    const group = await prisma.group.create({
      data: {
        ...data,
        createdBy: user.id,
        members: {
          create: { userId: user.id },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: e.issues }, { status: 400 });
    }
    console.error('POST /api/groups error:', e);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
