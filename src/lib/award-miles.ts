/**
 * Server-side NETS Miles awarding.
 *
 * `awardMiles` is idempotent: each qualifying event carries a stable `eventKey`
 * (unique per user via the `MilesLog` composite unique). Awarding the same event
 * twice — e.g. two settle requests for the same vault — is a silent no-op, so the
 * "each rule fires once per qualifying event" guarantee lives in the database, not
 * in fragile call-site checks.
 *
 * Miles are flat, event-based amounts. Nothing here ever reads a dollar amount.
 */

import { prisma } from '@/lib/prisma';
import { MILES_EARN, type MilesReason } from '@/lib/miles';

export interface AwardResult {
  /** Miles actually added (0 when the event was already logged). */
  awarded: number;
  /** True when this call actually granted miles (first time for this eventKey). */
  granted: boolean;
  /** User's lifetime miles total after this call. */
  total: number;
}

/**
 * Award miles for a single qualifying event.
 *
 * @param userId       the authenticated user's id
 * @param reason       which earning rule fired
 * @param discriminator what makes this event unique for that rule, e.g. the
 *                      merchant name, an ISO date, or a group id. Combined with
 *                      `reason` to form the idempotency key.
 */
export async function awardMiles(
  userId: string,
  reason: MilesReason,
  discriminator: string
): Promise<AwardResult> {
  const { miles } = MILES_EARN[reason];
  const eventKey = `${reason}:${discriminator}`;

  try {
    // The transaction keeps the log row and the counter in sync. If the unique
    // constraint trips, the whole thing rolls back and we report "already granted".
    const [, user] = await prisma.$transaction([
      prisma.milesLog.create({
        data: { userId, reason, miles, eventKey },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { miles: { increment: miles } },
        select: { miles: true },
      }),
    ]);
    return { awarded: miles, granted: true, total: user.miles };
  } catch (e) {
    // P2002 = unique constraint violation → this event was already awarded.
    if (isUniqueViolation(e)) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { miles: true },
      });
      return { awarded: 0, granted: false, total: user?.miles ?? 0 };
    }
    // Miles are a bonus layer — never let an awarding failure break the primary
    // action (creating a transaction, settling a vault, etc.). Log and move on.
    console.error(`awardMiles(${reason}) failed for user ${userId}:`, e);
    return { awarded: 0, granted: false, total: 0 };
  }
}

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code?: string }).code === 'P2002'
  );
}
