import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

const FlagTransactionSchema = z.object({
  transactionId: z.string(),
  countryCode: z.string().length(2).nullable(),
});

// POST /api/overseas/flag — tag a transaction with country code (e.g. MY, TH for overseas classification)
export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    const body = await req.json();
    const { transactionId, countryCode } = FlagTransactionSchema.parse(body);

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction || transaction.userId !== user.id) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        countryCode: countryCode ? countryCode.toUpperCase() : null,
      },
    });

    return NextResponse.json({ transaction: updated });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: e.issues }, { status: 400 });
    }
    console.error('POST /api/overseas/flag error:', e);
    return NextResponse.json({ error: 'Failed to flag transaction' }, { status: 500 });
  }
}
