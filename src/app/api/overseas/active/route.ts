import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET /api/overseas/active — fetch active overseas session for user
export async function GET() {
  try {
    const user = await getAuthUser();

    const session = await prisma.overseasSession.findFirst({
      where: {
        userId: user.id,
        endedAt: null,
      },
      orderBy: { startedAt: 'desc' },
    });

    return NextResponse.json({ session });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    console.error('GET /api/overseas/active error:', e);
    return NextResponse.json({ error: 'Failed to fetch active session' }, { status: 500 });
  }
}

// POST /api/overseas/active — end the current active session
export async function POST() {
  try {
    const user = await getAuthUser();

    const result = await prisma.overseasSession.updateMany({
      where: {
        userId: user.id,
        endedAt: null,
      },
      data: {
        endedAt: new Date(),
      },
    });

    return NextResponse.json({ ended: result.count > 0 });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    console.error('POST /api/overseas/active error:', e);
    return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
  }
}
