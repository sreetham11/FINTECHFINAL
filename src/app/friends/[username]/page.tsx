'use client';

import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Sparkles, CheckCircle2, Wallet, TrendingUp, Calendar, Users, Receipt, Check,
} from 'lucide-react';
import { getFriendByUsername } from '@/data/friends';
import { useApp } from '@/context/AppContext';
import { computeFriendStats, outstandingLabel } from '@/lib/friend-stats';
import FriendAvatar from '@/components/friends/FriendAvatar';

function StatTile({
  icon, label, value, tone = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'default' | 'good' | 'warn';
}) {
  const valueColor =
    tone === 'good' ? 'text-emerald-600' : tone === 'warn' ? 'text-red-600' : 'text-neutral-900';
  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-neutral-500">
        {icon}
        {label}
      </div>
      <div className={`mt-1.5 text-[20px] font-bold tracking-tight ${valueColor}`}>{value}</div>
    </div>
  );
}

export default function FriendProfilePage({ params }: { params: { username: string } }) {
  const router = useRouter();
  const { allTransactions } = useApp();
  const friend = getFriendByUsername(params.username);

  if (!friend) {
    return (
      <div className="min-h-[100dvh] bg-white pt-[120px] text-center">
        <p className="text-[15px] text-neutral-500">Friend not found.</p>
        <button onClick={() => router.push('/friends')} className="mt-4 text-[14px] font-semibold text-[#0033A0] underline">
          Back to Friends
        </button>
      </div>
    );
  }

  const stats = computeFriendStats(friend, allTransactions);
  const balance = outstandingLabel(stats.outstanding);

  return (
    <div className="min-h-[100dvh] bg-white pt-[56px] pb-28 lg:pt-0">
      {/* Top app bar */}
      <div className="sticky top-[56px] z-30 flex h-14 items-center border-b border-neutral-100 bg-white/90 px-2 backdrop-blur lg:top-0">
        <button
          type="button"
          onClick={() => router.push('/friends')}
          aria-label="Back to friends"
          className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-100 active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 truncate text-center text-[15px] font-semibold text-neutral-900">{friend.name}</h1>
        <span className="h-10 w-10" aria-hidden />
      </div>

      <div className="mx-auto w-full max-w-md space-y-5 px-5 pt-5 lg:max-w-2xl lg:pt-8">
        {/* Profile header */}
        <section className="flex flex-col items-center rounded-3xl border border-neutral-200/70 bg-gradient-to-b from-neutral-50 to-white p-6 text-center shadow-sm">
          <FriendAvatar friend={friend} size="lg" />
          <h2 className="mt-3 text-[22px] font-bold tracking-tight text-neutral-900">{friend.name}</h2>
          <p className="text-[13px] text-neutral-400">{friend.username}</p>
          {friend.memberSince && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-[12px] font-medium text-neutral-500">
              <Calendar size={13} /> Member since {friend.memberSince}
            </p>
          )}
        </section>

        {/* Statistics */}
        <section className="grid grid-cols-2 gap-3">
          <StatTile icon={<Sparkles size={13} className="text-[#FF2D87]" />} label="Shared Memories" value={String(stats.sharedMemories)} />
          <StatTile icon={<CheckCircle2 size={13} className="text-[#0033A0]" />} label="Completed Vaults" value={String(stats.completedVaults)} />
          <StatTile icon={<TrendingUp size={13} className="text-[#0033A0]" />} label="Lifetime Split" value={`SGD ${stats.lifetimeSplit.toLocaleString()}`} />
          <StatTile
            icon={<Wallet size={13} className="text-neutral-400" />}
            label="Outstanding"
            value={balance.tone === 'neutral' ? 'Settled' : `SGD ${Math.abs(stats.outstanding).toFixed(2)}`}
            tone={balance.tone === 'owe' ? 'warn' : 'good'}
          />
        </section>

        {/* Achievements Together */}
        <section>
          <h3 className="mb-2.5 text-[13px] font-semibold uppercase tracking-wide text-neutral-500">Achievements Together</h3>
          <div className="space-y-2.5">
            {stats.achievements.map((a) => (
              <div
                key={a.id}
                className={
                  'flex items-center gap-3 rounded-2xl border p-3.5 transition ' +
                  (a.unlocked
                    ? 'border-neutral-200/70 bg-white shadow-sm'
                    : 'border-dashed border-neutral-200 bg-neutral-50')
                }
              >
                <span className={'flex h-11 w-11 items-center justify-center rounded-2xl text-xl ' + (a.unlocked ? 'bg-neutral-100' : 'bg-neutral-100 grayscale opacity-50')}>
                  {a.emoji}
                </span>
                <div className="flex-1">
                  <p className={'text-[14px] font-semibold ' + (a.unlocked ? 'text-neutral-900' : 'text-neutral-400')}>{a.title}</p>
                  <p className="text-[12px] text-neutral-400">{a.description}</p>
                </div>
                {a.unlocked && <Check size={18} className="text-emerald-500" />}
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section>
          <h3 className="mb-2.5 text-[13px] font-semibold uppercase tracking-wide text-neutral-500">Recent Shared Activity</h3>
          {stats.sharedActivity.length > 0 ? (
            <ul className="overflow-hidden rounded-3xl border border-neutral-200/70 bg-white shadow-sm">
              {stats.sharedActivity.slice(0, 8).map((t, i) => (
                <li
                  key={t.id}
                  className={'flex items-center gap-3 px-4 py-3.5 ' + (i > 0 ? 'border-t border-neutral-100' : '')}
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                    <Check size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-neutral-900">{t.merchant}</p>
                    <p className="text-[12px] text-neutral-400">
                      {t.location || t.area} · {new Date(t.date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-[13px] font-semibold text-neutral-700">
                    {t.currency} {(t.splitAmount ?? t.amount).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-8 text-center text-[13px] text-neutral-400">
              No shared activity yet — start a vault or split a bill together.
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="space-y-3 pt-1">
          <button
            onClick={() => router.push('/vault/create')}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0033A0] to-[#C0001F] py-4 text-[15px] font-semibold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          >
            <Users size={18} /> Invite to Vault
          </button>
          <button
            onClick={() => router.push('/scanner')}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-300 bg-white py-4 text-[15px] font-semibold text-neutral-800 transition duration-200 hover:bg-neutral-50 active:scale-[0.99]"
          >
            <Receipt size={18} /> Split Payment
          </button>
        </div>
      </div>
    </div>
  );
}
