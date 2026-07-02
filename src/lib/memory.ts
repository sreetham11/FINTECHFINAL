/**
 * Memory domain model for NETS Quest.
 *
 * Captures the rich, mostly-silent context around a payment (Step 1 of the
 * memory spec), decides whether a payment qualifies as a saved memory (Step 3),
 * and provides the spend-context chips and category theming used by the UI.
 *
 * Everything here is pure/deterministic so the same logic can later run
 * server-side (Supabase Edge Function / API route) without change.
 */

import type { Transaction } from '@/data/transactions';

// ── Spend context (the one question on the bottom sheet) ──────────────────────
export type SpendContext =
  | 'worth_it'
  | 'for_us'
  | 'a_treat'
  | 'necessary'
  | 'something_new'
  | 'our_usual';

export const DEFAULT_SPEND_CONTEXT: SpendContext = 'worth_it';

export interface SpendContextOption {
  id: SpendContext;
  label: string;
  emoji: string;
}

// Order matches the 2x3 grid in the spec.
export const SPEND_CONTEXTS: SpendContextOption[] = [
  { id: 'worth_it', label: 'Worth It', emoji: '✓' },
  { id: 'for_us', label: 'For Us', emoji: '👥' },
  { id: 'a_treat', label: 'A Treat', emoji: '🎉' },
  { id: 'necessary', label: 'Necessary', emoji: '⚡' },
  { id: 'something_new', label: 'Something New', emoji: '🌱' },
  { id: 'our_usual', label: 'Our Usual', emoji: '🔁' },
];

export function spendContextLabel(id: SpendContext): string {
  return SPEND_CONTEXTS.find((c) => c.id === id)?.label ?? 'Worth It';
}

// ── Time of day ───────────────────────────────────────────────────────────────
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'late_night';

export const TIME_OF_DAY_LABEL: Record<TimeOfDay, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  late_night: 'Late Night',
};

/** Buckets a "HH:MM" (24h) string per the spec's ranges. */
export function getTimeOfDay(time: string): TimeOfDay {
  const hour = parseInt(time.split(':')[0], 10);
  if (Number.isNaN(hour)) return 'afternoon';
  if (hour >= 6 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'late_night'; // 22:00–05:59
}

// ── Group size ────────────────────────────────────────────────────────────────
export type GroupSize = 'solo' | 'pair' | 'small' | 'squad';

export const GROUP_SIZE_LABEL: Record<GroupSize, string> = {
  solo: 'Solo',
  pair: 'With 1 person',
  small: 'Small group',
  squad: 'Full squad',
};

export function getGroupSize(friendCount: number): GroupSize {
  if (friendCount <= 0) return 'solo';
  if (friendCount === 1) return 'pair';
  if (friendCount <= 3) return 'small';
  return 'squad';
}

// ── Memory categories + theming (Step 5) ──────────────────────────────────────
export type MemoryCategory =
  | 'hawker'
  | 'cafe'
  | 'transport'
  | 'retail'
  | 'entertainment'
  | 'overseas'
  | 'supper';

export const MEMORY_CATEGORY_LABEL: Record<MemoryCategory, string> = {
  hawker: 'Hawker',
  cafe: 'Café',
  transport: 'Transport',
  retail: 'Retail',
  entertainment: 'Entertainment',
  overseas: 'Overseas',
  supper: 'Supper',
};

/** Card background colour per category, per the spec. */
export const MEMORY_CATEGORY_COLOR: Record<MemoryCategory, string> = {
  hawker: '#C0001F', // NETS red
  cafe: '#0033A0', // NETS blue
  overseas: '#0B6B3A', // deep green
  transport: '#2A2A2A', // dark grey
  retail: '#FF2D87', // hot pink
  entertainment: '#F5C800', // dirty yellow
  supper: '#4A1D6E', // deep purple
};

/**
 * Maps the existing Transaction.category union onto the richer memory
 * categories. Overseas payments always theme as overseas regardless of their
 * underlying spend category.
 */
export function toMemoryCategory(
  category: Transaction['category'],
  isOverseas = false
): MemoryCategory {
  if (isOverseas) return 'overseas';
  switch (category) {
    case 'hawker':
      return 'hawker';
    case 'cafe':
      return 'cafe';
    case 'transport':
      return 'transport';
    case 'restaurant':
      return 'supper';
    case 'shopping':
      return 'retail';
    case 'overseas':
      return 'overseas';
    default:
      return 'hawker';
  }
}

// ── The captured memory context ───────────────────────────────────────────────
export interface MemoryContext {
  paymentId: string;
  merchant: string;
  category: MemoryCategory;
  amount: number;
  currency: string;
  foreignAmount?: number;
  foreignCurrency?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h)
  dayOfWeek: string; // e.g. "Thursday"
  timeOfDay: TimeOfDay;
  friendIds: string[];
  groupSize: GroupSize;
  area: string;
  isOverseas: boolean;
  destination?: string;
  isNewDiscovery: boolean; // first visit to this merchant
  visitCount: number; // total visits incl. this one
  spendContext: SpendContext;
  note?: string;
}

export function getDayOfWeek(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Deterministic caption used before/instead of the AI one-liner:
 *   "With Kai · Evening · Tian Tian · Our Usual"  /  "Solo · ..."
 */
export function fallbackCaption(ctx: MemoryContext, friendNames: string[]): string {
  const who = friendNames.length ? `With ${friendNames.join(' & ')}` : 'Solo';
  return `${who} · ${TIME_OF_DAY_LABEL[ctx.timeOfDay]} · ${ctx.merchant} · ${spendContextLabel(ctx.spendContext)}`;
}

/**
 * Step 3 — a payment is saved to the Memory Wallet if ANY of these hold.
 * Payments that don't qualify still count toward spending/personality data;
 * they just aren't surfaced as memory cards.
 */
export function qualifiesAsMemory(ctx: MemoryContext): boolean {
  if (ctx.friendIds.length > 0) return true;
  if (ctx.isOverseas) return true;
  if (ctx.isNewDiscovery) return true;
  if (ctx.amount > 20) return true;
  if (ctx.timeOfDay === 'late_night') return true;
  if (ctx.note?.trim()) return true;
  // A non-'Necessary' context signals the spend meant something.
  if (ctx.spendContext !== 'necessary') return true;
  return false;
}
