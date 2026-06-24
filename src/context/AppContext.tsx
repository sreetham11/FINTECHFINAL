'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
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

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

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

// ===== Provider =====
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [simulatedTransactions, setSimulatedTransactions] = useState<Transaction[]>([]);
  const [personality, setPersonality] = useState<PersonalityData>(defaultPersonality);
  const [language, setLanguageState] = useState<Language>('en');
  const [theme, setThemeState] = useState<Theme>('light');

  const allTransactions = [...simulatedTransactions, ...baseTransactions];
  const categories = computeCategories(allTransactions);
  const peakTime = computePeakTime(allTransactions);
  const moodPattern = computeMoodPattern(allTransactions);

  // Load persisted settings
  useEffect(() => {
    const savedLang = localStorage.getItem('nets-quest-language') as Language | null;
    if (savedLang && ['en', 'zh', 'ms', 'ta'].includes(savedLang)) {
      setLanguageState(savedLang);
    }

    const savedTheme = localStorage.getItem('nets-quest-theme') as Theme | null;
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      setThemeState(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('nets-quest-language', lang);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem('nets-quest-theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, []);

  const refreshPersonality = useCallback(async () => {
    setPersonality((p) => ({ ...p, isLoading: true }));

    try {
      const langParam = language !== 'en' ? language : '';
      const response = await fetch('/api/generate-personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: allTransactions.slice(0, 10),
          language: langParam,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.title && data.title.trim()) {
          setPersonality({
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
    } catch {
      // Fallback on error
    }

    setPersonality({ ...defaultPersonality, isLoading: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, simulatedTransactions.length]);

  const addTransaction = useCallback((txn: Transaction) => {
    setSimulatedTransactions((prev) => [txn, ...prev]);
    // Trigger personality refresh after a brief delay to let state settle
    setTimeout(() => {
      refreshPersonality();
    }, 100);
  }, [refreshPersonality]);

  // Initial personality fetch
  useEffect(() => {
    refreshPersonality();
  }, [refreshPersonality]);

  return (
    <AppContext.Provider
      value={{
        simulatedTransactions,
        allTransactions,
        addTransaction,
        personality,
        categories,
        peakTime,
        moodPattern,
        refreshPersonality,
        language,
        setLanguage,
        theme,
        setTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
