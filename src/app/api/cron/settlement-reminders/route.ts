import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

// GET /api/cron/settlement-reminders
// Call with header: x-cron-secret: <CRON_SECRET env var>
// Or set up a Vercel cron job to hit this daily
export async function GET() {
  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: 'Resend not configured' }, { status: 503 });
    }

    const resend = new Resend(resendKey);

    // Find splits that have been unpaid for more than 3 days
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const unsettledSplits = await prisma.expenseSplit.findMany({
      where: {
        isSettled: false,
        createdAt: { lt: threeDaysAgo },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        expense: {
          include: {
            group: { select: { id: true, name: true } },
            payer: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (unsettledSplits.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No unsettled splits found' });
    }

    // Group by debtor to send one email per person (not one per split)
    const byDebtor = new Map<string, typeof unsettledSplits>();
    for (const split of unsettledSplits) {
      // Skip if the debtor IS the payer (no need to remind yourself)
      if (split.userId === split.expense.paidBy) continue;

      const existing = byDebtor.get(split.userId) ?? [];
      existing.push(split);
      byDebtor.set(split.userId, existing);
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const debtorId of Array.from(byDebtor.keys())) {
      const splits = byDebtor.get(debtorId)!;
      const debtor = splits[0].user;
      if (!debtor.email) continue;

      const totalOwed = splits.reduce((sum: number, s) => sum + s.amountOwed, 0);
      const groups = Array.from(new Set(splits.map(s => s.expense.group.name))).join(', ');
      const payers = Array.from(new Set(splits.map(s => s.expense.payer.name))).join(', ');

      try {
        await resend.emails.send({
          from: 'NETS Quest <noreply@netsquest.app>',
          to: debtor.email,
          subject: `💸 Reminder: You owe SGD ${totalOwed.toFixed(2)} on NETS Quest`,
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Settlement Reminder</title></head>
<body style="font-family: 'Inter', sans-serif; background: #F7F4EF; padding: 32px; color: #1A1A1A;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border: 2.5px solid #1A1A1A; padding: 32px; box-shadow: 6px 6px 0 #1A1A1A;">
    <div style="font-size: 0.7rem; font-family: monospace; text-transform: uppercase; letter-spacing: 0.1em; color: #C0001F; margin-bottom: 8px;">NETS QUEST</div>
    <h1 style="font-size: 1.8rem; font-weight: 900; letter-spacing: -0.04em; margin: 0 0 8px;">
      Hey ${debtor.name}, <br/>you owe <span style="color: #C0001F;">SGD ${totalOwed.toFixed(2)}</span>
    </h1>
    <p style="font-size: 0.9rem; color: #555; margin-bottom: 24px;">
      You have ${splits.length} unsettled expense${splits.length > 1 ? 's' : ''} in <strong>${groups}</strong> from ${payers}. 
      These have been pending for 3+ days — settle up to keep the good vibes going fr.
    </p>
    <div style="background: #F7F4EF; border: 2px solid #1A1A1A; padding: 16px; margin-bottom: 24px;">
      ${splits.map(s => `
        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #ddd; font-size: 0.85rem;">
          <span>${s.expense.title} (${s.expense.group.name})</span>
          <strong style="color: #C0001F;">$${s.amountOwed.toFixed(2)}</strong>
        </div>
      `).join('')}
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://netsquest.app'}/vault" 
       style="display: block; background: #C0001F; color: white; text-align: center; padding: 14px; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; text-decoration: none;">
      Settle Up on NETS Quest →
    </a>
    <p style="font-size: 0.65rem; color: #999; margin-top: 16px; text-align: center;">NETS Quest · PolyFinTech100 2026</p>
  </div>
</body>
</html>`,
        });
        sentCount++;
      } catch (emailErr) {
        console.error(`Failed to send email to ${debtor.email}:`, emailErr);
        errors.push(debtor.email);
      }
    }

    return NextResponse.json({ sent: sentCount, errors });
  } catch (e) {
    console.error('Cron settlement-reminders error:', e);
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 });
  }
}
