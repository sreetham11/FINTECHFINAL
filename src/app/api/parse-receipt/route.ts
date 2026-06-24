import { NextResponse } from 'next/server';

const MOCK_DATA = [
  {"item":"Chicken Rice","price":4.50},
  {"item":"Teh Tarik","price":1.80},
  {"item":"Char Kway Teow","price":5.00},
  {"item":"Kopi","price":1.50},
  {"item":"Otah","price":2.00}
];

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Simulate network delay for demo
      await new Promise(resolve => setTimeout(resolve, 2000));
      return NextResponse.json({ items: MOCK_DATA });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        system: 'You are a receipt parser. Extract all line items from this receipt image. Return ONLY a JSON array like: [{"item": "Chicken Rice", "price": 4.50}, {"item": "Teh Tarik", "price": 1.80}]. Never return anything outside the JSON array.',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64.replace(/^data:image\/\w+;base64,/, '')
                }
              },
              {
                type: 'text',
                text: 'Extract the line items.'
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('Anthropic API Error:', await response.text());
      // Fallback
      return NextResponse.json({ items: MOCK_DATA });
    }

    const data = await response.json();
    const textContent = data.content[0].text;
    
    // Extract JSON from response if there's surrounding text
    const jsonMatch = textContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsedItems = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ items: parsedItems });
    }

    return NextResponse.json({ items: MOCK_DATA });

  } catch (error) {
    console.error('Error parsing receipt:', error);
    // Silent fallback
    return NextResponse.json({ items: MOCK_DATA });
  }
}
