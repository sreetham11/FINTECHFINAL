import Link from 'next/link';
import { Sparkles, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import type { Friend } from '@/data/friends';
import { computeFriendStats, outstandingLabel } from '@/lib/friend-stats';
import type { Transaction } from '@/data/transactions';
import FriendAvatar from './FriendAvatar';

export default function FriendCard({
  friend,
  transactions,
}: {
  friend: Friend;
  transactions: Transaction[];
}) {
  const stats = computeFriendStats(friend, transactions);
  const balance = outstandingLabel(stats.outstanding);
  const username = friend.username.replace(/^@/, '');

  const balanceTone =
    balance.tone === 'neutral'
      ? 'text-emerald-600'
      : balance.tone === 'owed'
        ? 'text-emerald-600'
        : 'text-red-600';

  return (
    <Link
      href={`/friends/${username}`}
      className="group flex items-center gap-4 rounded-3xl border border-neutral-200/70 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
    >
      <FriendAvatar friend={friend} size="md" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[16px] font-semibold text-neutral-900">{friend.name}</p>
          <span className={`whitespace-nowrap text-[12px] font-medium ${balanceTone}`}>{balance.text}</span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-neutral-500">
          <span className="inline-flex items-center gap-1">
            <Sparkles size={13} className="text-[#FF2D87]" /> {stats.sharedMemories} memories
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 size={13} className="text-[#0033A0]" /> {stats.completedVaults} vaults
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={13} className="text-neutral-400" /> {stats.lastActivity}
          </span>
        </div>
      </div>

      <ChevronRight size={18} className="flex-shrink-0 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-neutral-400" />
    </Link>
  );
}
