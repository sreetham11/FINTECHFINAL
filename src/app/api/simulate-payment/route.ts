import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { merchant, amount, category } = await request.json();

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
              content: `You are a Smart Budget Coach for a Gen Z user in Singapore. They just paid $${amount} at ${merchant} (${category}). Generate a witty, casual one-liner budget insight. Be specific and fun, use emojis. Just the one-liner, nothing else.`
            }
          ],
        }),
      });

      const data = await response.json();
      const budgetLine = data.content?.[0]?.text || getRandomCoachLine();
      return NextResponse.json({ budgetLine });
    }

    return NextResponse.json({ budgetLine: getRandomCoachLine() });
  } catch {
    return NextResponse.json({ budgetLine: getRandomCoachLine() }, { status: 200 });
  }
}

function getRandomCoachLine(): string {
  const lines = [
    "you've spent $67 by Thursday — bubble tea is your weakness this week ☕",
    "3 hawker runs in 2 days, you're on a streak 🍜",
    "transport spending up 23% — those late Grabs add up 💀",
    "you're under budget this week, treat yourself fr 🎉",
    "food's taking 62% of your spend — but honestly, valid",
  ];
  return lines[Math.floor(Math.random() * lines.length)];
}
