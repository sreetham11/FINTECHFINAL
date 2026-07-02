'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Luggage, MapPin, Wallet, Coins, Search, CalendarDays, X, Plane, Users, Check,
} from 'lucide-react';
import { searchFriends, type Friend } from '@/data/friends';

const CURRENCIES = [
  { code: 'SGD', label: 'Singapore Dollar' },
  { code: 'MYR', label: 'Malaysian Ringgit' },
  { code: 'THB', label: 'Thai Baht' },
  { code: 'JPY', label: 'Japanese Yen' },
  { code: 'IDR', label: 'Indonesian Rupiah' },
  { code: 'VND', label: 'Vietnamese Dong' },
  { code: 'AUD', label: 'Australian Dollar' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
];

const AVATAR_COLORS = [
  'bg-blue-600', 'bg-red-600', 'bg-amber-500', 'bg-emerald-600', 'bg-violet-600',
];

// ── Small, reusable presentational pieces ───────────────────────────────────────
function FieldLabel({ htmlFor, children, optional }: { htmlFor: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-2 text-[13px] font-medium text-neutral-700">
      {children}
      {optional && <span className="text-[11px] font-normal text-neutral-400">optional</span>}
    </label>
  );
}

function IconInput({
  id, icon, prefix, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; icon: React.ReactNode; prefix?: string }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
        {icon}
      </span>
      {prefix && (
        <span className="pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 text-[15px] font-medium text-neutral-500">
          {prefix}
        </span>
      )}
      <input
        id={id}
        className={
          'w-full rounded-2xl border border-neutral-200 bg-neutral-100 py-3.5 pr-4 text-[15px] text-neutral-900 ' +
          'placeholder:text-neutral-400 outline-none transition ' +
          'focus:border-neutral-300 focus:bg-white focus:ring-2 focus:ring-blue-100 ' +
          (prefix ? 'pl-[4.25rem]' : 'pl-11')
        }
        {...props}
      />
    </div>
  );
}

export default function CreateVaultPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('SGD');
  const [memberQuery, setMemberQuery] = useState('');
  const [members, setMembers] = useState<Friend[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const results = useMemo(() => {
    if (!memberQuery.trim()) return [];
    const chosen = new Set(members.map((m) => m.id));
    return searchFriends(memberQuery).filter((f) => !chosen.has(f.id));
  }, [memberQuery, members]);

  const canSubmit = name.trim().length > 0 && !submitting;

  const addMember = (f: Friend) => {
    setMembers((prev) => [...prev, f]);
    setMemberQuery('');
  };
  const removeMember = (id: string) => setMembers((prev) => prev.filter((m) => m.id !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          destination: destination.trim() || undefined,
          targetAmount: budget ? Number(budget) : undefined,
          currency,
          // Sent for forward-compatibility; the API currently ignores unknown keys.
          memberIds: members.map((m) => m.id),
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });
      if (res.ok) {
        router.push('/vault');
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Could not create your vault. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-white pt-[56px] pb-28 lg:pt-0">
      {/* Top app bar */}
      <div className="sticky top-[56px] z-30 flex h-14 items-center border-b border-neutral-100 bg-white/90 px-2 backdrop-blur lg:top-0">
        <button
          type="button"
          onClick={() => router.push('/vault')}
          aria-label="Back to vaults"
          className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-100 active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-center text-[15px] font-semibold text-neutral-900">Create Vault</h1>
        <span className="h-10 w-10" aria-hidden />
      </div>

      <div className="mx-auto w-full max-w-md space-y-5 px-5 pt-5 lg:max-w-lg lg:pt-8">
        {/* Hero */}
        <section className="rounded-3xl border border-neutral-200/70 bg-gradient-to-br from-blue-50 via-white to-red-50 p-6 text-center shadow-sm">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="flex h-12 w-12 rotate-[-6deg] items-center justify-center rounded-2xl bg-white text-[#0033A0] shadow-sm ring-1 ring-neutral-200/70">
              <Luggage size={22} />
            </span>
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0033A0] to-[#C0001F] text-white shadow-md">
              <Plane size={26} />
            </span>
            <span className="flex h-12 w-12 rotate-[6deg] items-center justify-center rounded-2xl bg-white text-[#C0001F] shadow-sm ring-1 ring-neutral-200/70">
              <MapPin size={22} />
            </span>
          </div>
          <h2 className="text-[22px] font-bold tracking-tight text-neutral-900">Create a new Vault</h2>
          <p className="mx-auto mt-1.5 max-w-xs text-[14px] leading-relaxed text-neutral-500">
            Plan your trip, split expenses and capture memories together.
          </p>
        </section>

        {/* Form card */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-5 rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm">
            {/* Vault name */}
            <div>
              <FieldLabel htmlFor="v-name"><Luggage size={15} className="text-neutral-400" /> Vault name</FieldLabel>
              <IconInput
                id="v-name"
                icon={<Luggage size={18} />}
                placeholder="Bangkok Graduation Trip"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                required
              />
            </div>

            {/* Destination */}
            <div>
              <FieldLabel htmlFor="v-dest" optional><MapPin size={15} className="text-neutral-400" /> Destination</FieldLabel>
              <IconInput
                id="v-dest"
                icon={<MapPin size={18} />}
                placeholder="Thailand"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                autoComplete="off"
              />
            </div>

            {/* Budget + Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel htmlFor="v-budget" optional><Wallet size={15} className="text-neutral-400" /> Budget</FieldLabel>
                <IconInput
                  id="v-budget"
                  icon={<Wallet size={18} />}
                  prefix={currency}
                  type="number"
                  min="0"
                  inputMode="decimal"
                  placeholder="1500"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel htmlFor="v-currency"><Coins size={15} className="text-neutral-400" /> Currency</FieldLabel>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                    <Coins size={18} />
                  </span>
                  <select
                    id="v-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full appearance-none rounded-2xl border border-neutral-200 bg-neutral-100 py-3.5 pl-11 pr-4 text-[15px] text-neutral-900 outline-none transition focus:border-neutral-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} — {c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Members */}
            <div>
              <FieldLabel htmlFor="v-members" optional><Users size={15} className="text-neutral-400" /> Add members</FieldLabel>
              <IconInput
                id="v-members"
                icon={<Search size={18} />}
                placeholder="Search name, email or phone"
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                autoComplete="off"
              />

              {results.length > 0 && (
                <ul className="mt-2 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                  {results.map((f, i) => (
                    <li key={f.id}>
                      <button
                        type="button"
                        onClick={() => addMember(f)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-neutral-50"
                      >
                        <span className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold text-white ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                          {f.avatar}
                        </span>
                        <span className="flex-1">
                          <span className="block text-[14px] font-medium text-neutral-900">{f.name}</span>
                          <span className="block text-[12px] text-neutral-400">{f.username}</span>
                        </span>
                        <Check size={16} className="text-neutral-300" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {members.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {members.map((m, i) => (
                    <span key={m.id} className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 py-1 pl-1 pr-2">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-white ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                        {m.avatar}
                      </span>
                      <span className="text-[13px] font-medium text-neutral-700">{m.name}</span>
                      <button
                        type="button"
                        onClick={() => removeMember(m.id)}
                        aria-label={`Remove ${m.name}`}
                        className="flex h-5 w-5 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-200 hover:text-neutral-600"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel htmlFor="v-start" optional><CalendarDays size={15} className="text-neutral-400" /> Start date</FieldLabel>
                <IconInput
                  id="v-start"
                  icon={<CalendarDays size={18} />}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel htmlFor="v-end" optional><CalendarDays size={15} className="text-neutral-400" /> End date</FieldLabel>
                <IconInput
                  id="v-end"
                  icon={<CalendarDays size={18} />}
                  type="date"
                  min={startDate || undefined}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
              {error}
            </p>
          )}

          {/* CTA */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#0033A0] to-[#C0001F] py-4 text-[15px] font-semibold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-md"
          >
            {submitting ? 'Creating…' : 'Create Vault'}
          </button>
          <p className="mt-3 text-center text-[12px] text-neutral-400">
            You can add expenses and invite more friends anytime.
          </p>
        </form>
      </div>
    </div>
  );
}
