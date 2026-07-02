'use client';

import React, { useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { transactions as baseTransactions, Transaction } from '@/data/transactions';
import {
  calculateMemoryMiles,
  calculateTopUpMiles,
  getTier,
  type MilesLineItem,
  type MilesResult,
  type Tier,
  type TierId,
} from '@/lib/miles';
import { qualifiesAsMemory, toMemoryCategory, type MemoryContext } from '@/lib/memory';
import type { DemoProfile } from '@/data/demo-profiles';

// ── Miles helpers ─────────────────────────────────────────────────────────────
const DAY_MS = 86_400_000;

/** Returns a YYYY-MM-DD string offset by `deltaDays` from `date`. */
function shiftDate(date: string, deltaDays: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().split('T')[0];
}

/** Whole days from `earlier` to `later` (negative if `later` precedes it). */
function daysApart(earlier: string, later: string): number {
  return Math.round((new Date(later).getTime() - new Date(earlier).getTime()) / DAY_MS);
}

export interface MilesHistoryEntry {
  paymentId: string;
  date: string;
  milesEarned: number;
  breakdown: MilesLineItem[];
  timestamp: string;
}

export interface RecordMemoryResult {
  /** Whether the payment is saved as a memory card. */
  qualifies: boolean;
  /** Miles awarded (0 if it didn't qualify). */
  miles: MilesResult;
  /** The new tier if this payment crossed a threshold, else null. */
  tierUp: Tier | null;
}

// ===== Types =====
export type Language = 'en' | 'zh' | 'ms' | 'ta';
export type Theme = 'light' | 'dark';

export interface PersonalityData {
  title: string;
  traits: { label: string; color: string }[];
  story: string;
  isLoading: boolean;
}

export interface CategoryBreakdown {
  label: string;
  percent: number;
  color: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _AppContextType {
  // Transactions
  simulatedTransactions: Transaction[];
  allTransactions: Transaction[];
  addTransaction: (txn: Transaction) => void;

  // Personality
  personality: PersonalityData;
  categories: CategoryBreakdown[];
  peakTime: string;
  moodPattern: { primary: string; secondary: string };
  refreshPersonality: () => void;

  // Language
  language: Language;
  setLanguage: (lang: Language) => void;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const defaultPersonality: PersonalityData = {
  title: 'Spontaneous Hawker Explorer',
  traits: [
    { label: 'Hawker Hero', color: '#C0001F' },
    { label: 'Late Night Snacker', color: '#FF2D87' },
    { label: 'Group Trip Organiser', color: '#0033A0' },
  ],
  story: "You're the friend who always knows the best hawker stall within a 5-minute walk. This month, 42% of your spending went to hawker centres — and honestly, we respect it. Your Thursday evenings are peak spend time (sus but valid), and your mood literally lights up after food. You dragged the squad to Bangkok and somehow kept the vault organised. Main character energy, but make it practical.",
  isLoading: false,
};

export interface Notification {
  id: string;
  message: string;
  time: string;
  read: boolean;
}

interface AppState {
  hasOnboarded: boolean;
  setHasOnboarded: (val: boolean) => void;
  userName: string;
  setUserName: (name: string) => void;
  frequentMerchant: string;
  setFrequentMerchant: (merchant: string) => void;
  simulatedTransactions: Transaction[];
  addTransaction: (txn: Transaction) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  notifications: Notification[];
  addNotification: (notif: Notification) => void;
  markNotificationsRead: () => void;
  personality: PersonalityData;
  setPersonality: (p: PersonalityData) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // ── NETS Miles (running totals + audit trail) ──
  totalMiles: number;
  lifetimeMiles: number;
  currentTier: TierId;
  milesHistory: MilesHistoryEntry[];
  recordMemory: (ctx: MemoryContext) => RecordMemoryResult;
  recordTopUp: (paymentId: string, date: string) => { miles: MilesResult; tierUp: Tier | null };
  /** Reconcile with the DB-backed miles total (source of truth). Merges upward so
   *  live mock activity in the session isn't lost. Returns the new tier if this
   *  bump crossed a threshold. */
  syncMilesFromServer: (serverTotal: number) => { tierUp: Tier | null };

  // ── Demo switcher ──
  /** The active demo persona (overrides transactions + personality), or null. */
  activeDemoProfile: DemoProfile | null;
  applyDemoProfile: (profile: DemoProfile) => void;
  clearDemoProfile: () => void;
}

const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasOnboarded: false,
      setHasOnboarded: (val) => set({ hasOnboarded: val }),
      userName: 'Sree',
      setUserName: (name) => set({ userName: name }),
      frequentMerchant: 'Maxwell Food Centre',
      setFrequentMerchant: (merchant) => set({ frequentMerchant: merchant }),
      simulatedTransactions: [],
      addTransaction: (txn) => set((state) => {
        // Anomaly Detection Logic
        const newNotifs = [...state.notifications];
        if (txn.category === 'hawker' && txn.amount > 30) {
          newNotifs.unshift({
            id: `alert-${Date.now()}`,
            message: `That's your biggest hawker spend this month 👀 (${txn.amount} SGD)`,
            time: 'Just now',
            read: false
          });
        } else if (txn.amount > 100) {
          newNotifs.unshift({
            id: `alert-${Date.now()}`,
            message: `Unusually large transaction detected at ${txn.merchant}.`,
            time: 'Just now',
            read: false
          });
        }
        return { 
          simulatedTransactions: [txn, ...state.simulatedTransactions],
          notifications: newNotifs
        };
      }),
      updateTransaction: (id, patch) =>
        set((state) => ({
          simulatedTransactions: state.simulatedTransactions.map((txn) =>
            txn.id === id ? { ...txn, ...patch } : txn
          ),
        })),
      notifications: [],
      addNotification: (notif) => set((state) => ({ notifications: [notif, ...state.notifications] })),
      markNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      })),
      personality: defaultPersonality,
      setPersonality: (p) => set({ personality: p }),

      // ── NETS Miles ──
      totalMiles: 0,
      lifetimeMiles: 0,
      currentTier: 'explorer',
      milesHistory: [],

      recordMemory: (ctx) => {
        const state = get();
        const qualifies = qualifiesAsMemory(ctx);

        // Signal: first payment in this category within the last 7 days of
        // live activity (base seed data is excluded — it's static).
        const isNewCategoryThisWeek = !state.simulatedTransactions.some((txn) => {
          const diff = daysApart(txn.date, ctx.date);
          if (diff < 0 || diff > 7) return false;
          return toMemoryCategory(txn.category, txn.isOverseas) === ctx.category;
        });

        // Signal: 3rd+ consecutive day with a memory — awarded once per day.
        const memoryDates = new Set(state.milesHistory.map((h) => h.date));
        const firstMemoryToday = !memoryDates.has(ctx.date);
        const isThirdConsecutiveDay =
          qualifies &&
          firstMemoryToday &&
          memoryDates.has(shiftDate(ctx.date, -1)) &&
          memoryDates.has(shiftDate(ctx.date, -2));

        const miles = calculateMemoryMiles(ctx, {
          isNewCategoryThisWeek,
          isThirdConsecutiveDay,
        });

        const previousTier = getTier(state.totalMiles);
        let tierUp: Tier | null = null;

        if (miles.total > 0) {
          const newTotal = state.totalMiles + miles.total;
          const newTier = getTier(newTotal);
          tierUp = newTier.id !== previousTier.id ? newTier : null;
          set({
            totalMiles: newTotal,
            lifetimeMiles: state.lifetimeMiles + miles.total,
            currentTier: newTier.id,
            milesHistory: [
              {
                paymentId: ctx.paymentId,
                date: ctx.date,
                milesEarned: miles.total,
                breakdown: miles.breakdown,
                timestamp: new Date().toISOString(),
              },
              ...state.milesHistory,
            ],
          });
        }

        return { qualifies, miles, tierUp };
      },

      recordTopUp: (paymentId, date) => {
        const state = get();
        const miles = calculateTopUpMiles();
        const previousTier = getTier(state.totalMiles);
        const newTotal = state.totalMiles + miles.total;
        const newTier = getTier(newTotal);
        const tierUp = newTier.id !== previousTier.id ? newTier : null;
        set({
          totalMiles: newTotal,
          lifetimeMiles: state.lifetimeMiles + miles.total,
          currentTier: newTier.id,
          milesHistory: [
            {
              paymentId,
              date,
              milesEarned: miles.total,
              breakdown: miles.breakdown,
              timestamp: new Date().toISOString(),
            },
            ...state.milesHistory,
          ],
        });
        return { miles, tierUp };
      },

      activeDemoProfile: null,
      applyDemoProfile: (profile) =>
        set({
          activeDemoProfile: profile,
          simulatedTransactions: [], // demo profile replaces the whole ledger
          userName: profile.name,
          frequentMerchant: profile.frequentMerchant,
          hasOnboarded: true,
          personality: {
            title: profile.personaTitle,
            traits: profile.traits.map((label, i) => ({
              label,
              color: profile.traitColors?.[i] ?? (i === 0 ? '#C0001F' : i === 1 ? '#FF2D87' : '#0033A0'),
            })),
            story: profile.story,
            isLoading: false,
          },
        }),
      clearDemoProfile: () =>
        set({
          activeDemoProfile: null,
          simulatedTransactions: [],
          userName: 'Sree',
          frequentMerchant: 'Maxwell Food Centre',
          personality: defaultPersonality,
        }),

      syncMilesFromServer: (serverTotal) => {
        const state = get();
        const previousTier = getTier(state.totalMiles);
        const newTotal = Math.max(state.totalMiles, serverTotal);
        const newLifetime = Math.max(state.lifetimeMiles, serverTotal);
        const newTier = getTier(newTotal);
        const tierUp = newTier.id !== previousTier.id ? newTier : null;
        if (newTotal !== state.totalMiles || newLifetime !== state.lifetimeMiles) {
          set({ totalMiles: newTotal, lifetimeMiles: newLifetime, currentTier: newTier.id });
        }
        return { tierUp };
      },

      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      theme: 'light',
      setTheme: (theme) => {
        if (typeof document !== 'undefined') {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          localStorage.setItem('nets-quest-theme', theme);
        }
        set({ theme });
      },
    }),
    { name: 'nets-quest-storage' }
  )
);

// ===== Helpers =====
function computeCategories(txns: Transaction[]): CategoryBreakdown[] {
  const categoryMap: Record<string, { count: number; color: string; label: string }> = {
    hawker: { count: 0, color: '#C0001F', label: 'Hawkers' },
    cafe: { count: 0, color: '#F5C800', label: 'Cafés' },
    transport: { count: 0, color: '#0033A0', label: 'Transport' },
    overseas: { count: 0, color: '#FF2D87', label: 'Overseas' },
    restaurant: { count: 0, color: '#C0001F', label: 'Restaurant' },
    shopping: { count: 0, color: '#0033A0', label: 'Shopping' },
  };

  txns.forEach((t) => {
    if (categoryMap[t.category]) {
      categoryMap[t.category].count++;
    }
  });

  const total = txns.length || 1;
  const cats = Object.values(categoryMap)
    .map((c) => ({ label: c.label, percent: Math.round((c.count / total) * 100), color: c.color }))
    .filter((c) => c.percent > 0)
    .sort((a, b) => b.percent - a.percent);

  // Ensure they sum close to 100 — give remainder to "Other"
  const sum = cats.reduce((s, c) => s + c.percent, 0);
  if (sum < 100) {
    cats.push({ label: 'Other', percent: 100 - sum, color: '#999' });
  }

  return cats;
}

function computePeakTime(txns: Transaction[]): string {
  const dayCounts: Record<string, number> = {};
  const timeBuckets: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };

  txns.forEach((t) => {
    const d = new Date(t.date);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;

    const hour = parseInt(t.time.split(':')[0]);
    if (hour >= 6 && hour < 12) timeBuckets.morning++;
    else if (hour >= 12 && hour < 17) timeBuckets.afternoon++;
    else if (hour >= 17 && hour < 21) timeBuckets.evening++;
    else timeBuckets.night++;
  });

  const topDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Thursday';
  const topTime = Object.entries(timeBuckets).sort((a, b) => b[1] - a[1])[0]?.[0] || 'evenings';

  return `${topDay} ${topTime}`;
}

function computeMoodPattern(txns: Transaction[]): { primary: string; secondary: string } {
  const moodCounts: Record<string, { count: number; emoji: string }> = {};
  txns.forEach((t) => {
    if (!moodCounts[t.mood]) moodCounts[t.mood] = { count: 0, emoji: t.moodEmoji };
    moodCounts[t.mood].count++;
  });

  const sorted = Object.entries(moodCounts).sort((a, b) => b[1].count - a[1].count);
  const primary = sorted[0] ? `${sorted[0][1].emoji} after food` : '😋 after food';
  const secondary = sorted[1] ? `${sorted[1][1].emoji} after shopping` : '😅 after shopping';

  return { primary, secondary };
}

export function useApp() {
  const store = useStore();

  // Sync dark mode class when Zustand hydrates with persisted theme
  useEffect(() => {
    if (store.theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nets-quest-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nets-quest-theme', 'light');
    }
  }, [store.theme]);

  // A demo persona replaces the entire ledger; otherwise live sims sit on top of
  // the base seed data.
  const allTransactions = store.activeDemoProfile
    ? store.activeDemoProfile.transactions
    : [...store.simulatedTransactions, ...baseTransactions];

  const refreshPersonality = useCallback(async () => {
    store.setPersonality({ ...store.personality, isLoading: true });
    try {
      const response = await fetch('/api/generate-personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: allTransactions.slice(0, 10),
          language: store.language !== 'en' ? store.language : '',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.title && data.title.trim()) {
          store.setPersonality({
            title: data.title,
            traits: (data.traits || []).map((t: string, i: number) => ({
              label: t,
              color: i === 0 ? '#C0001F' : i === 1 ? '#FF2D87' : '#0033A0',
            })),
            story: data.story,
            isLoading: false,
          });
          return;
        }
      }
    } catch {}

    store.setPersonality({ ...defaultPersonality, isLoading: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.language, store.simulatedTransactions.length]);

  return {
    hasOnboarded: store.hasOnboarded,
    setHasOnboarded: store.setHasOnboarded,
    userName: store.userName,
    setUserName: store.setUserName,
    frequentMerchant: store.frequentMerchant,
    setFrequentMerchant: store.setFrequentMerchant,
    simulatedTransactions: store.simulatedTransactions,
    allTransactions,
    addTransaction: (txn: Transaction) => {
      store.addTransaction(txn);
      setTimeout(() => refreshPersonality(), 100);
    },
    updateTransaction: store.updateTransaction,
    notifications: store.notifications,
    addNotification: store.addNotification,
    markNotificationsRead: store.markNotificationsRead,
    // NETS Miles
    totalMiles: store.totalMiles,
    lifetimeMiles: store.lifetimeMiles,
    currentTier: store.currentTier,
    milesHistory: store.milesHistory,
    recordMemory: store.recordMemory,
    recordTopUp: store.recordTopUp,
    syncMilesFromServer: store.syncMilesFromServer,
    activeDemoProfile: store.activeDemoProfile,
    applyDemoProfile: store.applyDemoProfile,
    clearDemoProfile: store.clearDemoProfile,
    personality: store.personality,
    categories: computeCategories(allTransactions),
    peakTime: computePeakTime(allTransactions),
    moodPattern: computeMoodPattern(allTransactions),
    refreshPersonality,
    language: store.language,
    setLanguage: store.setLanguage,
    theme: store.theme,
    setTheme: store.setTheme,
    vaults: [
      { id: 'v1', name: 'Bangkok Trip', progress: 42, color: '#FF2D87', members: ['sree', 'kai', 'priya'], target: 450, current: 189 },
      { id: 'v2', name: 'Jay Chou Tickets', progress: 85, color: '#0033A0', members: ['sree', 'wei'], target: 350, current: 297.5 }
    ]
  };
}

// Dummy provider to not break layout.tsx imports
export function AppProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
