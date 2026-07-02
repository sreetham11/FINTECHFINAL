/**
 * Demo switcher profiles.
 *
 * Pre-crafted personas that overwrite the client-side (Zustand) transaction +
 * personality state so the whole app — Home, Personality, Memories, stats —
 * previews a different Singaporean lifestyle instantly. No Supabase, no login.
 *
 * Each profile carries a rich personality (mascot, tagline, strength, traits,
 * tips) plus a hand-built transaction history that the charts read from.
 */

import type { Transaction } from '@/data/transactions';

export interface DemoProfile {
  id: string;
  name: string;
  mascot: string; // emoji badge
  mascotName: string; // e.g. "Bear"
  personaTitle: string; // e.g. "Spontaneous Hawker Explorer"
  personalityEnum: string; // e.g. "THE_EXPLORER"
  lifestyle: string; // Singapore lifestyle match label
  tagline: string; // the quote on the Wrapped card
  strength: number; // 1–5 stars
  traits: string[];
  story: string; // Gen-Z AI narrative
  tips: string[];
  frequentMerchant: string;
  /** Accent colours applied to the first three trait pills. */
  traitColors?: string[];
  transactions: Transaction[];
}

// ── Sree — Spontaneous Hawker Explorer (🐻 Bear) ────────────────────────────────
const sreeTxns: Transaction[] = [
  { id: 'sree-1', merchant: 'Tian Tian Chicken Rice', category: 'hawker', amount: 5.5, currency: 'SGD', location: 'Maxwell Food Centre', area: 'Chinatown', date: '2026-06-29', time: '12:34', friendIds: ['kai'], mood: 'satisfied', moodEmoji: '😋', memoryLine: 'you and Kai crushed chicken rice at Maxwell — 4th run this month', isOverseas: false, isMemory: true },
  { id: 'sree-2', merchant: 'Maxwell Fuzhou Oyster Cake', category: 'hawker', amount: 3.0, currency: 'SGD', location: 'Maxwell Food Centre', area: 'Chinatown', date: '2026-06-27', time: '13:10', friendIds: [], mood: 'happy', moodEmoji: '😊', memoryLine: 'solo oyster cake pit stop, iconic', isOverseas: false, isMemory: true },
  { id: 'sree-3', merchant: 'Ya Kun Kaya Toast', category: 'cafe', amount: 6.4, currency: 'SGD', location: 'Far East Square', area: 'Telok Ayer', date: '2026-06-25', time: '09:05', friendIds: [], mood: 'chill', moodEmoji: '😌', memoryLine: 'kaya toast + kopi to start the day right', isOverseas: false, isMemory: false },
  { id: 'sree-4', merchant: 'Chatuchak Weekend Market', category: 'overseas', amount: 24.0, currency: 'THB', foreignAmount: 640, foreignCurrency: 'THB', location: 'Chatuchak', area: 'Bangkok', date: '2026-06-15', time: '15:20', friendIds: ['kai', 'priya'], mood: 'excited', moodEmoji: '🤩', memoryLine: 'you paid for the group again in Bangkok, classic', isOverseas: true, isMemory: true },
  { id: 'sree-5', merchant: 'Boat Noodle Alley', category: 'overseas', amount: 12.5, currency: 'THB', foreignAmount: 330, foreignCurrency: 'THB', location: 'Victory Monument', area: 'Bangkok', date: '2026-06-16', time: '19:40', friendIds: ['kai'], mood: 'happy', moodEmoji: '😋', memoryLine: 'boat noodles until you lost count of the bowls', isOverseas: true, isMemory: true },
  { id: 'sree-6', merchant: 'Grab', category: 'transport', amount: 9.5, currency: 'SGD', location: 'Chinatown → Home', area: 'Chinatown', date: '2026-06-24', time: '22:15', friendIds: [], mood: 'chill', moodEmoji: '😌', memoryLine: 'late Grab home after supper', isOverseas: false, isMemory: false },
];

// ── Kai — The CBD Commuter (🦊 Fox) ─────────────────────────────────────────────
const kaiTxns: Transaction[] = [
  { id: 'kai-1', merchant: 'Starbucks Marina One', category: 'cafe', amount: 7.8, currency: 'SGD', location: 'Marina One', area: 'Marina Bay', date: '2026-06-30', time: '08:12', friendIds: [], mood: 'confident', moodEmoji: '😎', memoryLine: 'oat flat white before the 9am standup', isOverseas: false, isMemory: false },
  { id: 'kai-2', merchant: 'EZ-Link Top Up', category: 'transport', amount: 20.0, currency: 'SGD', location: 'Downtown MRT', area: 'Marina Bay', date: '2026-06-30', time: '08:40', friendIds: [], mood: 'neutral', moodEmoji: '😐', memoryLine: 'topping up for another week of the Downtown Line grind', isOverseas: false, isMemory: false },
  { id: 'kai-3', merchant: 'A-One Claypot House', category: 'restaurant', amount: 9.2, currency: 'SGD', location: 'Amoy Street Food Centre', area: 'Tanjong Pagar', date: '2026-06-29', time: '12:50', friendIds: ['manoj'], mood: 'satisfied', moodEmoji: '😋', memoryLine: 'lunch split with Manoj between meetings', isOverseas: false, isMemory: true },
  { id: 'kai-4', merchant: 'Toast Box', category: 'cafe', amount: 5.6, currency: 'SGD', location: 'Raffles Place', area: 'Raffles Place', date: '2026-06-27', time: '08:05', friendIds: [], mood: 'chill', moodEmoji: '😌', memoryLine: 'kopi-C and a quick scroll before the desk', isOverseas: false, isMemory: false },
  { id: 'kai-5', merchant: 'Grab', category: 'transport', amount: 11.3, currency: 'SGD', location: 'CBD → Home', area: 'Marina Bay', date: '2026-06-26', time: '19:30', friendIds: [], mood: 'neutral', moodEmoji: '😐', memoryLine: 'OT Grab home, expensing the vibes', isOverseas: false, isMemory: false },
  { id: 'kai-6', merchant: 'Common Man Coffee', category: 'cafe', amount: 8.5, currency: 'SGD', location: 'Martin Road', area: 'Robertson Quay', date: '2026-06-28', time: '10:30', friendIds: ['manoj'], mood: 'happy', moodEmoji: '😊', memoryLine: 'weekend cafe catch-up with Manoj', isOverseas: false, isMemory: true },
];

// ── Priya — The Overseas Regular (🐼 Panda) ─────────────────────────────────────
const priyaTxns: Transaction[] = [
  { id: 'priya-1', merchant: 'Ichiran Ramen Shibuya', category: 'overseas', amount: 15.2, currency: 'JPY', foreignAmount: 1690, foreignCurrency: 'JPY', location: 'Shibuya', area: 'Tokyo', date: '2026-06-20', time: '13:15', friendIds: [], mood: 'excited', moodEmoji: '🤩', memoryLine: 'solo Ichiran booth, peak main character', isOverseas: true, isMemory: true },
  { id: 'priya-2', merchant: 'Don Quijote Shinjuku', category: 'overseas', amount: 42.0, currency: 'JPY', foreignAmount: 4680, foreignCurrency: 'JPY', location: 'Shinjuku', area: 'Tokyo', date: '2026-06-21', time: '20:45', friendIds: [], mood: 'happy', moodEmoji: '😊', memoryLine: 'Donki haul at midnight, no regrets', isOverseas: true, isMemory: true },
  { id: 'priya-3', merchant: 'JR East IC Charge', category: 'overseas', amount: 18.0, currency: 'JPY', foreignAmount: 2000, foreignCurrency: 'JPY', location: 'Shinjuku Station', area: 'Tokyo', date: '2026-06-21', time: '09:10', friendIds: [], mood: 'neutral', moodEmoji: '😐', memoryLine: 'Suica top-up for the Yamanote loop', isOverseas: true, isMemory: false },
  { id: 'priya-4', merchant: 'Chatuchak Weekend Market', category: 'overseas', amount: 21.5, currency: 'THB', foreignAmount: 570, foreignCurrency: 'THB', location: 'Chatuchak', area: 'Bangkok', date: '2026-05-30', time: '15:40', friendIds: ['sree'], mood: 'excited', moodEmoji: '🤩', memoryLine: 'thrifting through Chatuchak with the squad', isOverseas: true, isMemory: true },
  { id: 'priya-5', merchant: 'After You Dessert', category: 'overseas', amount: 9.8, currency: 'THB', foreignAmount: 260, foreignCurrency: 'THB', location: 'Siam Paragon', area: 'Bangkok', date: '2026-05-31', time: '16:20', friendIds: ['sree'], mood: 'happy', moodEmoji: '😋', memoryLine: 'shibuya toast in Bangkok, full circle', isOverseas: true, isMemory: true },
  { id: 'priya-6', merchant: 'Changi Airport FairPrice', category: 'shopping', amount: 12.4, currency: 'SGD', location: 'Changi T3', area: 'Changi', date: '2026-06-22', time: '23:05', friendIds: [], mood: 'chill', moodEmoji: '😌', memoryLine: 'restocking snacks the second you landed', isOverseas: false, isMemory: false },
];

// ── Wei — The Late Night Snacker (🦁 Lion) ──────────────────────────────────────
const weiTxns: Transaction[] = [
  { id: 'wei-1', merchant: 'Al-Azhar Restaurant', category: 'restaurant', amount: 14.5, currency: 'SGD', location: 'Bukit Timah', area: 'Bukit Timah', date: '2026-06-30', time: '01:20', friendIds: ['manoj'], mood: 'happy', moodEmoji: '😋', memoryLine: 'cheese prata run at 1am with Manoj, elite', isOverseas: false, isMemory: true },
  { id: 'wei-2', merchant: 'Cheers 24hr', category: 'shopping', amount: 6.8, currency: 'SGD', location: 'Ang Mo Kio', area: 'Ang Mo Kio', date: '2026-06-29', time: '23:50', friendIds: [], mood: 'chill', moodEmoji: '😌', memoryLine: 'midnight ice cream + chips raid', isOverseas: false, isMemory: false },
  { id: 'wei-3', merchant: 'Grab', category: 'transport', amount: 13.2, currency: 'SGD', location: 'Town → AMK', area: 'Ang Mo Kio', date: '2026-06-28', time: '02:10', friendIds: [], mood: 'chill', moodEmoji: '😌', memoryLine: 'the classic 2am Grab of shame', isOverseas: false, isMemory: false },
  { id: 'wei-4', merchant: 'Spize River Valley', category: 'restaurant', amount: 11.0, currency: 'SGD', location: 'River Valley', area: 'River Valley', date: '2026-06-27', time: '00:35', friendIds: ['manoj'], mood: 'excited', moodEmoji: '🤩', memoryLine: 'murtabak after the movie, worth losing sleep', isOverseas: false, isMemory: true },
  { id: 'wei-5', merchant: '7-Eleven', category: 'shopping', amount: 4.2, currency: 'SGD', location: 'Orchard', area: 'Orchard', date: '2026-06-26', time: '23:15', friendIds: [], mood: 'neutral', moodEmoji: '😐', memoryLine: 'slurpee emergency, handled', isOverseas: false, isMemory: false },
  { id: 'wei-6', merchant: 'Swee Choon Dim Sum', category: 'restaurant', amount: 18.5, currency: 'SGD', location: 'Jalan Besar', area: 'Jalan Besar', date: '2026-06-24', time: '01:05', friendIds: ['manoj', 'kai'], mood: 'happy', moodEmoji: '😋', memoryLine: 'supper dim sum with the whole crew, chaotic good', isOverseas: false, isMemory: true },
];

export const DEMO_PROFILES: DemoProfile[] = [
  {
    id: 'sree',
    name: 'Sree',
    mascot: '🐻',
    mascotName: 'Bear',
    personaTitle: 'Spontaneous Hawker Explorer',
    personalityEnum: 'THE_EXPLORER',
    lifestyle: '🍜 Hawker Hunter · 🌴 Weekend Adventurer',
    tagline: 'You know the best hawker stall within a 5-minute walk — and you dragged the squad to Bangkok anyway.',
    strength: 4,
    traits: ['Hawker Hero', 'Group Trip Organiser', 'Late Night Snacker'],
    traitColors: ['#C0001F', '#0033A0', '#FF2D87'],
    story:
      "you're the friend who always knows where to eat. 40% hawker, a Bangkok trip you basically funded, and somehow the vault stayed organised. main character energy, but make it practical.",
    tips: [
      'Set a monthly hawker budget — you eat out most days, small taps add up.',
      'You front group trips a lot; use a Vault so friends settle before you forget.',
      'Convert THB in-app next trip instead of airport counters.',
    ],
    frequentMerchant: 'Maxwell Food Centre',
    transactions: sreeTxns,
  },
  {
    id: 'kai',
    name: 'Kai',
    mascot: '🦊',
    mascotName: 'Fox',
    personaTitle: 'The CBD Commuter',
    personalityEnum: 'THE_PLANNER',
    lifestyle: '🚇 MRT Commuter · ☕ Café Hopper',
    tagline: 'Oat flat white by 8, Downtown Line by 8:40. Your spending runs on a schedule.',
    strength: 5,
    traits: ['Routine Master', 'Café Regular', 'Transit Pro'],
    traitColors: ['#0033A0', '#F5C800', '#C0001F'],
    story:
      'clockwork energy. mornings mean Marina One coffee, weekdays mean the MRT, lunch gets split with the desk crew. predictable in the most respectable way.',
    tips: [
      'Your daily café habit is ~$150/month — a home brew 2x a week claws some back.',
      'Auto top-up your EZ-Link so you never queue at the gantry.',
      'Split lunches through the app so you stop being the one who pays first.',
    ],
    frequentMerchant: 'Starbucks Marina One',
    transactions: kaiTxns,
  },
  {
    id: 'priya',
    name: 'Priya',
    mascot: '🐼',
    mascotName: 'Panda',
    personaTitle: 'The Overseas Regular',
    personalityEnum: 'THE_EXPLORER',
    lifestyle: '🌏 Overseas Regular · 🛍️ Mall Explorer',
    tagline: 'Your card has more air miles than most people. JPY on Monday, THB by the weekend.',
    strength: 4,
    traits: ['Multi-Currency', 'Frequent Flyer', 'Confident Abroad'],
    traitColors: ['#FF2D87', '#0033A0', '#C0001F'],
    story:
      'passport-core spending. Tokyo ramen, Shinjuku Donki runs, Bangkok thrifting — you tap in any currency without blinking. the second you land back home you restock snacks. iconic.',
    tips: [
      'Enable Overseas Mode before you fly so every foreign tap auto-tags.',
      'Watches those JPY/THB FX spreads — in-app conversion beats dynamic currency conversion at terminals.',
      'Your overseas ratio is high; set a per-trip cap so souvenirs don’t snowball.',
    ],
    frequentMerchant: 'Shibuya',
    transactions: priyaTxns,
  },
  {
    id: 'wei',
    name: 'Wei',
    mascot: '🦁',
    mascotName: 'Lion',
    personaTitle: 'The Late Night Snacker',
    personalityEnum: 'THE_SOCIAL_SPENDER',
    lifestyle: '🌃 Night Owl · Supper Squad',
    tagline: 'Nothing good happens before 11pm. Prata at 1, Grab at 2, zero regrets.',
    strength: 3,
    traits: ['Supper Legend', 'Night Owl', 'Squad Feeder'],
    traitColors: ['#4A1D6E', '#FF2D87', '#F5C800'],
    story:
      'peak activity: after dark. cheese prata at Al-Azhar, Cheers raids at midnight, dim sum at 1am with the crew. your Grab history reads like a supper crawl map. legend behaviour.',
    tips: [
      'Late-night Grabs are your biggest silent spend — pre-book or share rides home.',
      'Supper adds up fast; a weekly cap keeps the 1am prata guilt-free.',
      'Log supper runs as memories — your squad owes you more than you think.',
    ],
    frequentMerchant: 'Al-Azhar Restaurant',
    transactions: weiTxns,
  },
];

export function getDemoProfile(id: string): DemoProfile | undefined {
  return DEMO_PROFILES.find((p) => p.id === id);
}
