/**
 * NETS Miles engine.
 *
 * Miles measure the *depth* of someone's payment life, not how much they spend.
 * Routine solo payments earn nothing — that's a feature. This module is pure
 * and deterministic: the exact same calculation is intended to move server-side
 * (an API route / Edge Function) later, so it never touches storage or `window`.
 *
 * Copy rule: miles are always "earned", never "collected" or "scored".
 */

import {
  qualifiesAsMemory,
  spendContextLabel,
  type MemoryContext,
  type SpendContext,
} from '@/lib/memory';

export const BASE_MEMORY_MILES = 10;
export const MAX_MILES_PER_PAYMENT = 45;
export const TOPUP_MILES = 2;

/** Per-context bonus miles. */
const CONTEXT_BONUS: Record<SpendContext, number> = {
  for_us: 5,
  something_new: 8,
  worth_it: 3,
  a_treat: 3,
  our_usual: 2,
  necessary: 0,
};

export interface MilesLineItem {
  label: string;
  miles: number;
}

export interface MilesResult {
  /** Miles actually awarded (after the per-payment cap). */
  total: number;
  /** Raw breakdown before the cap — the audit trail. */
  breakdown: MilesLineItem[];
  /** True when the cap clipped the raw sum. */
  capped: boolean;
}

/**
 * Extra signals that depend on history and so are computed by the caller
 * (the store today, a server function later), not derivable from one payment.
 */
export interface MilesSignals {
  /** First payment in this category within the current week. */
  isNewCategoryThisWeek?: boolean;
  /** 3rd consecutive day with at least one memory ("Living Fully"). */
  isThirdConsecutiveDay?: boolean;
}

const EMPTY_RESULT: MilesResult = { total: 0, breakdown: [], capped: false };

/**
 * Calculates miles for a single payment. Non-qualifying payments earn 0.
 * The group-size bonus is tiered (a bigger group *replaces* the smaller bonus,
 * it does not stack).
 */
export function calculateMemoryMiles(
  ctx: MemoryContext,
  signals: MilesSignals = {}
): MilesResult {
  if (!qualifiesAsMemory(ctx)) return EMPTY_RESULT;

  const breakdown: MilesLineItem[] = [{ label: 'Memory', miles: BASE_MEMORY_MILES }];

  // Friends — tiered, non-additive.
  const friends = ctx.friendIds.length;
  if (friends >= 4) breakdown.push({ label: 'Full squad', miles: 12 });
  else if (friends >= 2) breakdown.push({ label: 'Friends', miles: 8 });
  else if (friends === 1) breakdown.push({ label: 'Friend', miles: 5 });

  if (ctx.isOverseas) breakdown.push({ label: 'Overseas', miles: 10 });
  if (ctx.isNewDiscovery) breakdown.push({ label: 'New Discovery', miles: 8 });
  if (ctx.timeOfDay === 'late_night') breakdown.push({ label: 'Late Night', miles: 5 });
  if (ctx.note?.trim()) breakdown.push({ label: 'Note', miles: 5 });

  const contextBonus = CONTEXT_BONUS[ctx.spendContext];
  if (contextBonus > 0) {
    breakdown.push({ label: spendContextLabel(ctx.spendContext), miles: contextBonus });
  }

  if (ctx.amount > 50) breakdown.push({ label: 'Big spend', miles: 5 });
  if (signals.isNewCategoryThisWeek) breakdown.push({ label: 'New category', miles: 5 });
  if (signals.isThirdConsecutiveDay) breakdown.push({ label: 'Living Fully', miles: 10 });

  const raw = breakdown.reduce((sum, item) => sum + item.miles, 0);
  const total = Math.min(raw, MAX_MILES_PER_PAYMENT);
  return { total, breakdown, capped: raw > MAX_MILES_PER_PAYMENT };
}

/** Top-ups aren't memories, but using the NETS ecosystem earns a little. */
export function calculateTopUpMiles(): MilesResult {
  return {
    total: TOPUP_MILES,
    breakdown: [{ label: 'PayNow top-up', miles: TOPUP_MILES }],
    capped: false,
  };
}

/** Builds the toast summary line, e.g. "✦ +23 NETS Miles — Friends + New Discovery". */
export function summarizeMiles(result: MilesResult): string {
  const bonuses = result.breakdown.filter((b) => b.label !== 'Memory').map((b) => b.label);
  const reason = bonuses.length ? ` — ${bonuses.join(' + ')}` : '';
  return `✦ +${result.total} NETS Miles${reason}`;
}

// ── Server-side earning events ──────────────────────────────────────────────────
// These are the DB-backed miles awarded once per qualifying real event. They are
// deliberately flat, event-based amounts — miles NEVER scale with dollar amount.
export type MilesReason =
  | 'new_merchant'
  | 'mood_checkin'
  | 'memory'
  | 'vault_settle'
  | 'overseas_txn';

export const MILES_EARN: Record<MilesReason, { miles: number; label: string }> = {
  new_merchant: { miles: 10, label: 'First time at a new merchant' },
  mood_checkin: { miles: 5, label: 'Daily mood check-in' },
  memory: { miles: 15, label: 'A payment became a memory' },
  vault_settle: { miles: 25, label: 'Settled a group vault' },
  overseas_txn: { miles: 20, label: 'Spent while overseas' },
};

// ── Tiers ─────────────────────────────────────────────────────────────────────
export type TierId = 'explorer' | 'adventurer' | 'legend';

export interface Tier {
  id: TierId;
  label: string;
  /** Inclusive lower bound of the tier. */
  min: number;
  /** Inclusive upper bound (Infinity for the top tier). */
  max: number;
  /** Badge accent colour. */
  color: string;
  /** One-liner shown on the tier-up overlay. */
  unlockLine: string;
}

export const TIERS: Tier[] = [
  {
    id: 'explorer',
    label: 'Explorer',
    min: 0,
    max: 100,
    color: '#1A1A1A',
    unlockLine: 'Every tap starts telling your story.',
  },
  {
    id: 'adventurer',
    label: 'Adventurer',
    min: 101,
    max: 300,
    color: '#0033A0',
    unlockLine: 'Spending Forecast + full-colour Memory Cards unlocked.',
  },
  {
    id: 'legend',
    label: 'NETS Legend',
    min: 301,
    max: Infinity,
    color: '#F5C800',
    unlockLine: 'Shareable Personality Card + your NETS Legend badge unlocked.',
  },
];

export function getTier(totalMiles: number): Tier {
  const miles = Math.max(0, totalMiles);
  return TIERS.find((t) => miles >= t.min && miles <= t.max) ?? TIERS[0];
}

export interface TierProgress {
  tier: Tier;
  nextTier: Tier | null;
  /** Miles accumulated inside the current tier band. */
  milesIntoTier: number;
  /** Total miles needed to fill the current band (Infinity at the top). */
  bandSize: number;
  /** Miles remaining to reach the next tier (0 at the top). */
  milesToNext: number;
  /** 0–1 progress through the current band (1 at the top tier). */
  fraction: number;
}

export function getTierProgress(totalMiles: number): TierProgress {
  const miles = Math.max(0, totalMiles);
  const tier = getTier(miles);
  const index = TIERS.findIndex((t) => t.id === tier.id);
  const nextTier = index < TIERS.length - 1 ? TIERS[index + 1] : null;

  if (!nextTier) {
    return { tier, nextTier: null, milesIntoTier: miles - tier.min, bandSize: Infinity, milesToNext: 0, fraction: 1 };
  }

  const bandSize = nextTier.min - tier.min;
  const milesIntoTier = miles - tier.min;
  const milesToNext = Math.max(0, nextTier.min - miles);
  const fraction = bandSize > 0 ? Math.min(1, milesIntoTier / bandSize) : 1;
  return { tier, nextTier, milesIntoTier, bandSize, milesToNext, fraction };
}

/** Plain-language earning rules for the profile "How do I earn miles?" section.
 *  Depth of engagement, never dollar amount. */
export const MILES_EARN_RULES: string[] = [
  '+10 — First-ever payment at a brand new merchant',
  '+5 — Complete your daily mood check-in',
  '+15 — A payment turns into a memory',
  '+25 — Settle up a whole group vault',
  '+20 — Any payment made while Overseas Mode is on',
];
