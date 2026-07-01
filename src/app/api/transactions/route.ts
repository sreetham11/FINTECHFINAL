import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';
import { OVERSEAS_COUNTRIES } from '@/lib/overseas-constants';

const CreateTransactionSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).default('SGD'),
  merchant: z.string().min(1),
  category: z.string().min(1),
  countryCode: z.string().length(2).nullable().optional(),
});

// GET /api/transactions — fetch all transactions for auth user
export async function GET() {
  try {
    const user = await getAuthUser();

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ transactions });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    console.error('GET /api/transactions error:', e);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

// POST /api/transactions — save a simulated transaction
export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    const body = await req.json();
    const data = CreateTransactionSchema.parse(body);

    let countryCode = data.countryCode || null;

    // Auto-tag countryCode for foreign currency transactions
    if (data.currency.toUpperCase() !== 'SGD') {
      // 1. Check if there is an active overseas session
      const activeSession = await prisma.overseasSession.findFirst({
        where: {
          userId: user.id,
          endedAt: null,
        },
        select: { countryCode: true },
      });

      if (activeSession) {
        countryCode = activeSession.countryCode;
      } else {
        // 2. Lookup countryCode based on currency mappings
        const currencyUpper = data.currency.toUpperCase();
        const foundCountry = Object.entries(OVERSEAS_COUNTRIES).find(
          ([, info]) => info.currency.toUpperCase() === currencyUpper
        );
        if (foundCountry) {
          countryCode = foundCountry[0];
        }
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: data.amount,
        currency: data.currency.toUpperCase(),
        merchant: data.merchant,
        category: data.category,
        countryCode: countryCode ? countryCode.toUpperCase() : null,
      },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: e.issues }, { status: 400 });
    }
    console.error('POST /api/transactions error:', e);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
