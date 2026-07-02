/**
 * Friend relationship stats.
 *
 * Friends in NETS Quest exist only to support payments, vaults and memories —
 * never chat. These helpers turn a friend + the user's transactions into the
 * payment-relationship metrics the Friends UI shows. Live shared transactions
 * (incl. demo-switcher data) are blended on top of each friend's baseline so the
 * numbers react to activity.
 */

import type { Friend } from '@/data/friends';
import type { Transaction } from '@/data/transactions';

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export interface FriendStats {
  sharedMemories: number;
  completedVaults: number;
  /** Net balance, SGD. >0 they owe you, <0 you owe them, 0 settled. */
  outstanding: number;
  lifetimeSplit: number;
  lastActivity: string;
  achievements: Achievement[];
  /** Shared transactions, newest first (for the timeline). */
  sharedActivity: Transaction[];
}

function relativeLabel(dateStr: string): string {
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return 'recently';
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'last week';
  if (days < 31) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export function computeFriendStats(friend: Friend, allTransactions: Transaction[]): FriendStats {
  const shared = allTransactions
    .filter((t) => t.friendIds.includes(friend.id))
    .slice()
    .sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime());

  const liveMemories = shared.filter((t) => t.isMemory !== false).length;
  const liveSplit = shared.reduce((sum, t) => sum + (t.splitAmount ?? t.amount), 0);
  const liveOverseas = shared.filter((t) => t.isOverseas).length;
  const liveFood = shared.filter((t) => ['hawker', 'cafe', 'restaurant'].includes(t.category)).length;

  const sharedMemories = (friend.baseMemories ?? 0) + liveMemories;
  const completedVaults = friend.completedVaults ?? 0;
  const outstanding = friend.outstanding ?? 0;
  const lifetimeSplit = Math.round((friend.lifetimeSplit ?? 0) + liveSplit);
  const lastActivity = shared[0] ? relativeLabel(shared[0].date) : friend.lastActivity ?? 'a while ago';

  const overseasVaults = (friend.overseasVaults ?? 0) + Math.floor(liveOverseas / 2);
  const restaurantsVisited = (friend.restaurantsVisited ?? 0) + liveFood;
  const successfulSplits = (friend.successfulSplits ?? 0) + shared.length;

  const achievements: Achievement[] = [
    {
      id: 'travel-buddies',
      emoji: '🌏',
      title: 'Travel Buddies',
      description: 'Completed 5 overseas vaults',
      unlocked: overseasVaults >= 5,
    },
    {
      id: 'food-explorers',
      emoji: '🍜',
      title: 'Food Explorers',
      description: 'Visited 30 restaurants together',
      unlocked: restaurantsVisited >= 30,
    },
    {
      id: 'reliable-duo',
      emoji: '🤝',
      title: 'Reliable Duo',
      description: '50 successful splits',
      unlocked: successfulSplits >= 50,
    },
  ];

  return { sharedMemories, completedVaults, outstanding, lifetimeSplit, lastActivity, achievements, sharedActivity: shared };
}

/** "No outstanding balance" / "You owe $X" / "Owes you $X". */
export function outstandingLabel(outstanding: number): { text: string; tone: 'neutral' | 'owe' | 'owed' } {
  if (Math.abs(outstanding) < 0.01) return { text: 'No outstanding balance', tone: 'neutral' };
  if (outstanding > 0) return { text: `Owes you SGD ${outstanding.toFixed(2)}`, tone: 'owed' };
  return { text: `You owe SGD ${Math.abs(outstanding).toFixed(2)}`, tone: 'owe' };
}
