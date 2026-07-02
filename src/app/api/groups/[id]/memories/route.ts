import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

// GET /api/groups/[id]/memories
export async function GET(
  _req: Request,
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

    const group = await prisma.group.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        destination: true,
        currency: true,
        memoryCache: true,
        members: {
          select: { user: { select: { name: true } } },
        },
        expenses: {
          where: { splits: { some: { isSettled: true } } },
          select: {
            id: true,
            title: true,
            amount: true,
            category: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if cache is valid (we regenerate if we have more expenses than cached)
    const cachedMemories = group.memoryCache as Record<string, { summary: string; expenseCount: number }> | null;
    const totalExpenses = group.expenses.length;

    // Group expenses by month
    const byMonth: Record<string, typeof group.expenses> = {};
    for (const exp of group.expenses) {
      const monthKey = exp.createdAt.toISOString().slice(0, 7); // "2026-06"
      if (!byMonth[monthKey]) byMonth[monthKey] = [];
      byMonth[monthKey].push(exp);
    }

    const memberNames = group.members.map(m => m.user.name);
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const memories: Record<string, { summary: string; totalSpent: number; expenseCount: number }> = {};
    let needsCacheUpdate = false;

    for (const [month, expenses] of Object.entries(byMonth)) {
      const expenseCount = expenses.length;
      const cached = cachedMemories?.[month];

      // Use cache if expense count hasn't changed
      if (cached && cached.expenseCount === expenseCount) {
        memories[month] = {
          summary: cached.summary,
          totalSpent: expenses.reduce((s, e) => s + e.amount, 0),
          expenseCount,
        };
        continue;
      }

      needsCacheUpdate = true;
      const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
      const categoryList = Array.from(new Set(expenses.map(e => e.category))).join(', ');
      const merchantList = expenses.map(e => e.title).join(', ');
      const date = new Date(month + '-01').toLocaleDateString('en-SG', { month: 'long', year: 'numeric' });

      let summary = `${memberNames.join(', ')} spent ${group.currency} ${totalSpent.toFixed(2)} in ${date}.`;

      if (apiKey) {
        try {
          const { text } = await generateText({
            model: anthropic('claude-3-5-sonnet-20241022'),
            maxOutputTokens: 150,
            messages: [
              {
                role: 'user',
                content: `Generate a warm, Gen Z-toned 1-2 sentence memory summary for this group trip spending data.
Group members: ${memberNames.join(', ')}
Month: ${date}
Destination/Group: ${group.destination || group.name}
Total spent: ${group.currency} ${totalSpent.toFixed(2)}
Categories: ${categoryList}
Merchants/experiences: ${merchantList}

Write it in second person, mentioning specific things they spent on. Make it feel like a memory — not a financial report. Keep it under 60 words.`,
              },
            ],
          });

          if (text) {
            summary = text.trim();
          }
        } catch (aiErr) {
          console.error('Memory summary AI error:', aiErr);
        }
      }

      memories[month] = { summary, totalSpent, expenseCount };
    }

    // Update cache if anything changed
    if (needsCacheUpdate) {
      const newCache: Record<string, { summary: string; expenseCount: number }> = {};
      for (const [month, mem] of Object.entries(memories)) {
        newCache[month] = { summary: mem.summary, expenseCount: mem.expenseCount };
      }
      await prisma.group.update({
        where: { id: params.id },
        data: { memoryCache: newCache },
      });
    }

    return NextResponse.json({
      memories,
      totalExpenses,
      memberNames,
    });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    console.error('GET /api/groups/[id]/memories error:', e);
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 });
  }
}
