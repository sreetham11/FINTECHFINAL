/**
 * Group Vault perks — a *group-level* progression, separate from personal NETS
 * Miles. A vault "levels up" from how much the squad actually engages with it
 * (expenses logged, debts settled, members, notes, memories) — never from the
 * dollar value moving through it. Pure/deterministic so it can run client or
 * server side.
 */

export type VaultLevelId = 'starter' | 'active' | 'legendary';

export interface VaultLevel {
  id: VaultLevelId;
  label: string;
  min: number; // inclusive lower bound of the engagement score band
  color: string;
  perk: string; // the headline perk unlocked at this level
}

export const VAULT_LEVELS: VaultLevel[] = [
  { id: 'starter', label: 'Starter Vault', min: 0, color: '#2A2A2A', perk: 'Split bills & track balances' },
  { id: 'active', label: 'Active Vault', min: 30, color: '#0033A0', perk: 'Live currency conversion' },
  { id: 'legendary', label: 'Legendary Vault', min: 70, color: '#F5C800', perk: 'A second vault + shared timeline' },
];

export interface VaultStats {
  members: number;
  expenses: number;
  settlements: number;
  notes: number;
  memories: number;
}

/** Weighted engagement score, capped at 100. Deliberately ignores amounts. */
export function vaultEngagementScore(s: VaultStats): number {
  const raw =
    s.expenses * 8 +
    s.settlements * 15 +
    s.members * 5 +
    s.notes * 4 +
    s.memories * 10;
  return Math.min(100, raw);
}

export function getVaultLevel(score: number): VaultLevel {
  const s = Math.max(0, Math.min(100, score));
  // highest band whose min is satisfied
  return [...VAULT_LEVELS].reverse().find((l) => s >= l.min) ?? VAULT_LEVELS[0];
}

export interface VaultPerks {
  score: number;
  level: VaultLevel;
  nextLevel: VaultLevel | null;
  toNext: number; // score points to the next level (0 at top)
  fraction: number; // 0–1 progress within current band
  unlocks: {
    currencyConversion: boolean;
    secondVault: boolean;
    sharedTimeline: boolean;
  };
}

export function getVaultPerks(stats: VaultStats): VaultPerks {
  const score = vaultEngagementScore(stats);
  const level = getVaultLevel(score);
  const index = VAULT_LEVELS.findIndex((l) => l.id === level.id);
  const nextLevel = index < VAULT_LEVELS.length - 1 ? VAULT_LEVELS[index + 1] : null;

  const bandStart = level.min;
  const bandEnd = nextLevel ? nextLevel.min : 100;
  const fraction = bandEnd > bandStart ? Math.min(1, (score - bandStart) / (bandEnd - bandStart)) : 1;
  const toNext = nextLevel ? Math.max(0, nextLevel.min - score) : 0;

  return {
    score,
    level,
    nextLevel,
    toNext,
    fraction,
    unlocks: {
      currencyConversion: score >= 30,
      secondVault: score >= 70,
      sharedTimeline: score >= 70,
    },
  };
}

/** Best-effort stats extraction from whatever a group object happens to carry
 *  (the list endpoint and the detail endpoint expose different shapes). */
export function vaultStatsFromGroup(group: {
  members?: unknown[];
  expenses?: { notes?: unknown[] }[];
  settlements?: unknown[];
  _count?: { expenses?: number };
} | null | undefined, memoriesCount = 0): VaultStats {
  if (!group) return { members: 0, expenses: 0, settlements: 0, notes: 0, memories: 0 };
  const expensesArr = group.expenses ?? [];
  const notes = expensesArr.reduce((sum, e) => sum + (e.notes?.length ?? 0), 0);
  return {
    members: group.members?.length ?? 0,
    expenses: group._count?.expenses ?? expensesArr.length,
    settlements: group.settlements?.length ?? 0,
    notes,
    memories: memoriesCount,
  };
}
