import { NextResponse } from 'next/server';

// Step 4 — AI one-liner generation for a saved memory.
// Uses Groq's OpenAI-compatible Chat Completions API. When GROQ_API_KEY is not
// set (or the call fails), we return the deterministic fallback caption the
// client sent, so memories always get a caption.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT =
  'You generate one-line memory captions for a Singapore payments app. Write exactly one sentence, casual and warm, slightly witty, max 15 words, no hashtags, no emojis in the text itself. Make it feel like a real memory specific to Singapore culture and the people involved.';

interface CaptionRequest {
  merchant?: string;
  category?: string;
  amount?: number;
  friends?: string[]; // resolved names, or empty for Solo
  location?: string;
  timeOfDay?: string; // "Morning" | "Afternoon" | "Evening" | "Late Night"
  day?: string; // "Thursday"
  visitCount?: number;
  spendContext?: string; // label, e.g. "Our Usual"
  note?: string;
  foreignCurrency?: string;
  fallback?: string; // deterministic template built client-side
}

export async function POST(req: Request) {
  let body: CaptionRequest = {};
  try {
    body = (await req.json()) as CaptionRequest;
  } catch {
    // ignore — treated as empty payload below
  }

  const fallback = body.fallback?.trim() || buildFallback(body);
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ caption: fallback, source: 'fallback' });
  }

  const friends = body.friends?.length ? body.friends.join(', ') : 'Solo';
  const userMessage =
    `Generate a memory caption. ` +
    `Merchant: ${body.merchant ?? 'Unknown'}. ` +
    `Category: ${body.category ?? 'n/a'}. ` +
    `Amount: $${body.amount ?? 0}. ` +
    `Friends: ${friends}. ` +
    `Location: ${body.location ?? 'Singapore'}. ` +
    `Time: ${body.timeOfDay ?? 'n/a'}. ` +
    `Day: ${body.day ?? 'n/a'}. ` +
    `Visit count: ${body.visitCount ?? 1}. ` +
    `Spend context: ${body.spendContext ?? 'Worth It'}. ` +
    `Note: ${body.note?.trim() || 'none'}. ` +
    `Foreign currency: ${body.foreignCurrency ?? 'none'}.`;

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 60,
        temperature: 0.8,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!res.ok) {
      console.error('Groq caption error:', res.status, await res.text().catch(() => ''));
      return NextResponse.json({ caption: fallback, source: 'fallback' });
    }

    const data = await res.json();
    const caption: string | undefined = data?.choices?.[0]?.message?.content;
    const cleaned = caption?.trim().replace(/^["']|["']$/g, '');
    return NextResponse.json({
      caption: cleaned && cleaned.length > 0 ? cleaned : fallback,
      source: cleaned ? 'groq' : 'fallback',
    });
  } catch (err) {
    console.error('Groq caption request failed:', err);
    return NextResponse.json({ caption: fallback, source: 'fallback' });
  }
}

function buildFallback(body: CaptionRequest): string {
  const who = body.friends?.length ? `With ${body.friends.join(' & ')}` : 'Solo';
  return `${who} · ${body.timeOfDay ?? 'Today'} · ${body.merchant ?? 'a spend'} · ${body.spendContext ?? 'Worth It'}`;
}
