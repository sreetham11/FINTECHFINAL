import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { merchant, location, amount, friends } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6-20250514',
          max_tokens: 100,
          messages: [
            {
              role: 'user',
              content: `Generate a short, witty one-liner memory description for this NETS payment. Gen Z tone, Singapore context, casual and fun. No quotes.

Merchant: ${merchant}
Location: ${location}
Amount: $${amount}
Friends: ${friends?.length ? friends.join(', ') : 'Solo'}

Just return the one-liner, nothing else.`
            }
          ],
        }),
      });

      const data = await response.json();
      const memoryLine = data.content?.[0]?.text || getRandomFallback();
      return NextResponse.json({ memoryLine });
    }

    return NextResponse.json({ memoryLine: getRandomFallback() });
  } catch {
    return NextResponse.json({ memoryLine: getRandomFallback() }, { status: 200 });
  }
}

function getRandomFallback(): string {
  const fallbacks = [
    "another one for the memory vault — you'll thank yourself later",
    "logged, vibed, no regrets detected",
    "your NETS card is working overtime and loving it",
    "new core memory unlocked fr",
    "this one's gonna hit different when you look back",
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
