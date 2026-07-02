import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();

    // Verify membership
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.id, userId: user.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('receipt') as File | null;
    const expenseId = formData.get('expenseId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 1. Upload to Supabase Storage
    const supabase = createSupabaseServiceClient();
    const fileExt = file.name.split('.').pop() ?? 'jpg';
    const filePath = `receipts/${params.id}/${Date.now()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload receipt' }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);

    const receiptUrl = publicUrlData.publicUrl;
    const mimeType = file.type || 'image/jpeg';

    // 2. Call Claude for OCR via Vercel AI SDK
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        receiptUrl,
        extracted: null,
        warning: 'No AI key — OCR skipped',
      });
    }

    let extracted = null;
    try {
      const { text } = await generateText({
        model: anthropic('claude-3-5-sonnet-20241022'),
        system: `You are a receipt OCR system. Extract key information from receipt images and return ONLY valid JSON. No markdown, no explanation.`,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                image: buffer,
                mediaType: mimeType,
              },
              {
                type: 'text',
                text: `Extract from this receipt and return JSON with this exact structure:
{
  "merchant": "merchant name",
  "total": 12.50,
  "date": "YYYY-MM-DD or null",
  "currency": "SGD",
  "lineItems": [
    {"item": "item name", "price": 4.50}
  ]
}
If you cannot determine a field, use null. Return ONLY the JSON object.`,
              },
            ],
          },
        ],
      });

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[0]);
      }
    } catch (aiErr) {
      console.error('Vercel AI SDK OCR error:', aiErr);
    }

    // 3. If expenseId provided, update the expense with receiptUrl and extracted data
    if (expenseId) {
      await prisma.expense.update({
        where: { id: expenseId },
        data: {
          receiptUrl,
          ...(extracted?.merchant && { title: extracted.merchant }),
          ...(extracted?.total && { amount: extracted.total }),
          ...(extracted && { extractedData: extracted }),
        },
      });
    }

    return NextResponse.json({ receiptUrl, extracted });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    console.error('Receipt upload error:', e);
    return NextResponse.json({ error: 'Failed to process receipt' }, { status: 500 });
  }
}
