'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Users } from 'lucide-react';
import { friends } from '@/data/friends';
import { useApp } from '@/context/AppContext';
import FriendCard from '@/components/friends/FriendCard';

export default function FriendsPage() {
  const router = useRouter();
  const { allTransactions } = useApp();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((f) => f.name.toLowerCase().includes(q) || f.username.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="min-h-[100dvh] bg-white pt-[56px] pb-28 lg:pt-0">
      {/* Top app bar */}
      <div className="sticky top-[56px] z-30 flex h-14 items-center border-b border-neutral-100 bg-white/90 px-2 backdrop-blur lg:top-0">
        <button
          type="button"
          onClick={() => router.push('/profile')}
          aria-label="Back to profile"
          className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-100 active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-center text-[15px] font-semibold text-neutral-900">Friends</h1>
        <span className="h-10 w-10" aria-hidden />
      </div>

      <div className="mx-auto w-full max-w-md space-y-5 px-5 pt-5 lg:max-w-3xl lg:pt-8">
        {/* Header */}
        <header>
          <h2 className="text-[24px] font-bold tracking-tight text-neutral-900">Friends</h2>
          <p className="mt-1 text-[14px] leading-relaxed text-neutral-500">
            People you frequently split expenses and create memories with.
          </p>
        </header>

        {/* Search */}
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
            <Search size={18} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search friends"
            aria-label="Search friends"
            className="w-full rounded-2xl border border-neutral-200 bg-neutral-100 py-3.5 pl-11 pr-4 text-[15px] text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* List */}
        {filtered.length > 0 ? (
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            {filtered.map((f) => (
              <FriendCard key={f.id} friend={f} transactions={allTransactions} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
              <Users size={22} />
            </span>
            <p className="text-[14px] text-neutral-500">No friends match &ldquo;{query}&rdquo;.</p>
          </div>
        )}
      </div>
    </div>
  );
}
