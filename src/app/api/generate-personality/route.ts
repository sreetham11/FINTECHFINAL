import { NextResponse } from 'next/server';

// Anthropic SDK is not installed in package.json yet, so we'll use standard fetch
// If you add @anthropic-ai/sdk later, you can swap to it.
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

export async function POST(req: Request) {
  try {
    const { transactions, language } = await req.json();

    if (!transactions || transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions provided' },
        { status: 400 }
      );
    }

    // Default fallback if no API key or API fails
    const fallbackResponse = {
      title: 'Spontaneous Hawker Explorer',
      traits: ['Late Night Snacker', 'Hawker Hero', 'Transport Heavy'],
      story: "You're clearly someone who values good food over fancy dining. With a heavy focus on hawker centers and late-night eats, your spending tells a story of spontaneous suppers and catching rides home. Practical, yet you know how to enjoy the simple things.",
    };

    if (!ANTHROPIC_API_KEY) {
      // Simulate network delay for effect
      await new Promise(resolve => setTimeout(resolve, 1500));
      return NextResponse.json(fallbackResponse);
    }

    const categories = [...new Set(transactions.map((t: any) => t.category))].join(', ');
    const maxTxn = transactions.reduce((prev: any, current: any) => (prev.amount > current.amount) ? prev : current);
    
    let languageInstruction = '';
    if (language === 'zh') {
      languageInstruction = 'CRITICAL: Respond entirely in simplified Chinese (中文). The title, traits, and story must all be in Chinese.';
    } else if (language === 'ms') {
      languageInstruction = 'CRITICAL: Respond entirely in Bahasa Melayu (Malay). The title, traits, and story must all be in Malay.';
    } else if (language === 'ta') {
      languageInstruction = 'CRITICAL: Respond entirely in Tamil (தமிழ்). The title, traits, and story must all be in Tamil.';
    }

    const prompt = `
      Analyze these recent transactions for a Gen Z user in Singapore:
      Categories used: ${categories}
      Biggest spend: $${maxTxn.amount} at ${maxTxn.merchant}
      Total transactions provided: ${transactions.length}

      Based on this, map the user to ONE of these 8 exact "Payment Personality" archetypes:
      1. The Spontaneous Local Explorer (Hawker-heavy, tries new places constantly, pays across different neighbourhoods, solo and group mix)
      2. The Café Crawler (High café spend, peak mornings, usually solo, CBD or Orchard area, aesthetic-conscious spender)
      3. The Group Trip Organiser (High vault usage, overseas transactions, always splitting, the one who plans everything)
      4. The Late Night Snacker (Peak spend after 10pm, supper spots, mamak and 24hr places, impulsive small purchases)
      5. The Budget Ninja (Low average transaction value, hawker-only, rarely overseas, disciplined and consistent)
      6. The CBD Commuter (Transport-heavy, Raffles Place / Tanjong Pagar merchants, coffee every morning, weekday warrior)
      7. The Weekend Adventurer (Clusters spending on Sat/Sun, leisure and entertainment heavy, quiet weekdays)
      8. The Overseas Regular (Frequent overseas transactions, multi-currency, confident traveller, uses NETS abroad more than locally)

      Respond ONLY with a raw JSON object matching this exact schema:
      {
        "title": "EXACTLY one of the 8 titles above",
        "traits": ["Trait 1", "Trait 2", "Trait 3"],
        "story": "A short 2-3 sentence paragraph written in second person ('You...') explaining why they got this specific personality based on their spending habits. Use a fun, slightly roasty but friendly Gen Z tone. Mention specific things they bought."
      }

      ${languageInstruction}
    `;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Using haiku for speed
        max_tokens: 300,
        temperature: 0.8,
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error('Claude API Error:', await response.text());
      return NextResponse.json(fallbackResponse);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Extract JSON block
    const jsonMatch = content.match(/\\{.*?\\}/s);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        title: parsed.title || fallbackResponse.title,
        traits: parsed.traits || fallbackResponse.traits,
        story: parsed.story || fallbackResponse.story,
      });
    }

    return NextResponse.json(fallbackResponse);

  } catch (error) {
    console.error('Error generating personality:', error);
    return NextResponse.json(
      { error: 'Failed to generate personality' },
      { status: 500 }
    );
  }
}
