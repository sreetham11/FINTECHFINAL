'use client';

import React, { useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { transactions as baseTransactions, Transaction } from '@/data/transactions';

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

interface AppContextType {
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

interface AppState {
  simulatedTransactions: Transaction[];
  addTransaction: (txn: Transaction) => void;
  personality: PersonalityData;
  setPersonality: (p: PersonalityData) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const useStore = create<AppState>()(
  persist(
    (set) => ({
      simulatedTransactions: [],
      addTransaction: (txn) => set((state) => ({ simulatedTransactions: [txn, ...state.simulatedTransactions] })),
      personality: defaultPersonality,
      setPersonality: (p) => set({ personality: p }),
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      theme: 'light',
      setTheme: (theme) => set({ theme }),
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

export function useApp(): AppContextType {
  const store = useStore();
  const allTransactions = [...store.simulatedTransactions, ...baseTransactions];

  // Apply theme effect
  useEffect(() => {
    document.documentElement.classList.toggle('dark', store.theme === 'dark');
  }, [store.theme]);

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
              color: ['#C0001F', '#FF2D87', '#0033A0'][i % 3],
            })),
            story: data.story || defaultPersonality.story,
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
    simulatedTransactions: store.simulatedTransactions,
    allTransactions,
    addTransaction: (txn) => {
      store.addTransaction(txn);
      setTimeout(() => refreshPersonality(), 100);
    },
    personality: store.personality,
    categories: computeCategories(allTransactions),
    peakTime: computePeakTime(allTransactions),
    moodPattern: computeMoodPattern(allTransactions),
    refreshPersonality,
    language: store.language,
    setLanguage: store.setLanguage,
    theme: store.theme,
    setTheme: store.setTheme,
  };
}

// Dummy provider to not break layout.tsx imports
export function AppProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
