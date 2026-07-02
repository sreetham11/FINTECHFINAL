import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';
import { OVERSEAS_COUNTRIES } from '@/lib/overseas-constants';
import { awardMiles } from '@/lib/award-miles';
import { qualifiesAsMemory, toMemoryCategory, getTimeOfDay, getDayOfWeek, type MemoryContext } from '@/lib/memory';

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

    // Is Overseas Mode active right now? Used both for country tagging and for
    // the "+20 miles while overseas" rule below.
    const activeSession = await prisma.overseasSession.findFirst({
      where: { userId: user.id, endedAt: null },
      select: { countryCode: true },
    });

    // Has this user ever paid this merchant before? (drives the new-merchant rule)
    const priorCount = await prisma.transaction.count({
      where: {
        userId: user.id,
        merchant: { equals: data.merchant, mode: 'insensitive' },
      },
    });
    const isNewMerchant = priorCount === 0;

    // Auto-tag countryCode for foreign currency transactions
    if (data.currency.toUpperCase() !== 'SGD') {
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

    // ── NETS Miles (best-effort; never blocks the transaction) ──────────────────
    const isOverseas = !!activeSession || !!transaction.countryCode;
    let milesAwarded = 0;
    try {
      // +10 first-ever payment at a new merchant (once per merchant).
      if (isNewMerchant) {
        const r = await awardMiles(user.id, 'new_merchant', data.merchant.trim().toLowerCase());
        milesAwarded += r.awarded;
      }
      // +20 any payment made while Overseas Mode is active (once per txn).
      if (isOverseas) {
        const r = await awardMiles(user.id, 'overseas_txn', transaction.id);
        milesAwarded += r.awarded;
      }
      // +15 the payment auto-flags as a memory (objective signals only — no
      // dollar multiplier). We use the neutral 'necessary' context so a plain
      // routine spend doesn't auto-qualify; overseas / new / late-night / >$20 do.
      const now = new Date();
      const ctx: MemoryContext = {
        paymentId: transaction.id,
        merchant: transaction.merchant,
        category: toMemoryCategory(transaction.category as Parameters<typeof toMemoryCategory>[0], isOverseas),
        amount: transaction.amount,
        currency: transaction.currency,
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 5),
        dayOfWeek: getDayOfWeek(now.toISOString().slice(0, 10)),
        timeOfDay: getTimeOfDay(now.toTimeString().slice(0, 5)),
        friendIds: [],
        groupSize: 'solo',
        area: '',
        isOverseas,
        isNewDiscovery: isNewMerchant,
        visitCount: priorCount + 1,
        spendContext: 'necessary',
      };
      if (qualifiesAsMemory(ctx)) {
        const r = await awardMiles(user.id, 'memory', transaction.id);
        milesAwarded += r.awarded;
      }
    } catch (e) {
      console.error('miles awarding (transactions) failed:', e);
    }

    return NextResponse.json({ transaction, milesAwarded }, { status: 201 });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: e.issues }, { status: 400 });
    }
    console.error('POST /api/transactions error:', e);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
