import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are NETS Quest's AI Budget Coach — a smart, friendly financial assistant specifically for Singapore users. You only answer questions related to: personal budgeting, spending habits, savings goals, bill splitting, overseas spending, financial planning, and NETS payment features. If the user asks about anything unrelated to finance or payments (e.g. drugs, relationships, coding, general knowledge), respond with: "I'm your budget coach — I can only help with spending, saving, and financial questions. Try asking me something like how much you should budget for a trip to Bangkok!" Always be direct, warm, and slightly Gen Z in tone. Reference Singapore-specific context where relevant — hawker budgets, MRT costs, grabfood spending etc. When the user shares transaction data, analyse it and give specific actionable advice.`;

const TRANSACTION_CONTEXT = `User transaction context: Total spent this month: $247.80. Top categories: Hawkers 42% ($104), Cafés 22% ($54), Transport 15% ($37), Overseas 14% ($35), Other 7% ($17). Current vault: Bangkok Trip, $312 of $400 collected. Personality type: Spontaneous Hawker Explorer.`;

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    if (message.trim().length < 2) {
      return NextResponse.json({ answer: "say a bit more so I can help you 👀" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.log('No Anthropic API key, using mock response.');
      await new Promise(r => setTimeout(r, 800));
      return NextResponse.json({ 
        answer: "Budget coach is taking a break — try again in a sec 😅" 
      });
    }

    // Build messages array: prepend transaction context to first user message
    const messages: { role: 'user' | 'assistant'; content: string }[] = [];
    
    // Add history (prior turns)
    if (Array.isArray(history)) {
      for (const turn of history) {
        if (turn.role === 'user' || turn.role === 'assistant') {
          messages.push({ role: turn.role, content: turn.content });
        }
      }
    }

    // Current user message (prepend context for the first message or always for fresh context)
    const contextualMessage = messages.length === 0 
      ? `${TRANSACTION_CONTEXT}\n\n${message}`
      : message;

    messages.push({ role: 'user', content: contextualMessage });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return NextResponse.json({ 
        answer: "Budget coach is taking a break — try again in a sec 😅" 
      });
    }

    const data = await response.json();
    const answer = data.content?.[0]?.text;

    if (!answer) {
      return NextResponse.json({ 
        answer: "Budget coach is taking a break — try again in a sec 😅" 
      });
    }

    return NextResponse.json({ answer });

  } catch (error) {
    console.error('Error in AI Chat Coach:', error);
    return NextResponse.json({ 
      answer: "Budget coach is taking a break — try again in a sec 😅" 
    });
  }
}
