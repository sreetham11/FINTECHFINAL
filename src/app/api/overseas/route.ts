import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';
import { getCountryInfo } from '@/lib/overseas-constants';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

const OverseasStartSchema = z.object({
  countryCode: z.string().length(2),
});

// POST /api/overseas — start a new overseas session and stream confidence briefing
export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    const body = await req.json();
    const { countryCode } = OverseasStartSchema.parse(body);

    const country = getCountryInfo(countryCode);
    if (!country) {
      return NextResponse.json({ error: 'Unsupported country code' }, { status: 400 });
    }

    // 1. End any active overseas sessions first
    await prisma.overseasSession.updateMany({
      where: {
        userId: user.id,
        endedAt: null,
      },
      data: {
        endedAt: new Date(),
      },
    });

    // 2. Create the new overseas session
    const session = await prisma.overseasSession.create({
      data: {
        userId: user.id,
        countryCode: countryCode.toUpperCase(),
        currency: country.currency,
        tipCulture: country.tipCulture,
        safetyRating: 5, // Default/placeholder safety rating
      },
    });

    // 3. Stream Claude AI confidence briefing
    const result = streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      system: `You are the NETS Quest Overseas Confidence Coach. You provide bulleted, practical, punchy, and highly localized briefings for travelers. Use a friendly, helpful Gen Z tone. Do not include introductory text like "Here is your briefing". Go straight to the points.`,
      prompt: `Generate an overseas confidence briefing for user traveling to ${country.name} (Currency: ${country.currency}, 1 SGD = ${country.sgdRate} ${country.currencySymbol ?? country.currency}).
      
Tip culture: "${country.tipCulture}"
Payment methods: "${country.paymentMethods.join(', ')}"
NETS acceptance level: "${country.netsAcceptance}"
Scam warnings: 
${country.scamWarnings.map(w => `- ${w}`).join('\n')}

Format the output strictly as markdown with three main sections:
1. **💳 Payment Playbook**: How to pay, whether NETS works, QR code instructions.
2. **💵 Tipping Rules**: A short, clear summary of tipping.
3. **⚠️ Safety & Scams**: A warning about specific local scams.

Keep each section to 2-3 short, highly actionable bullet points. Mention exchange rate: 1 SGD = ${country.sgdRate} ${country.currencySymbol ?? country.currency}.`,
    });

    const streamResponse = result.toTextStreamResponse();
    streamResponse.headers.set('X-Session-Id', session.id);

    return streamResponse;
  } catch (e) {
    if (e instanceof NextResponse) return e;
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: e.issues }, { status: 400 });
    }
    console.error('POST /api/overseas error:', e);
    return NextResponse.json({ error: 'Failed to start overseas session' }, { status: 500 });
  }
}
