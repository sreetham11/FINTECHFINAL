'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import type { Transaction } from '@/data/transactions';
import MomentCard from '@/components/MomentCard';
import CountUp from '@/components/CountUp';
import SimulatePayment, { SimulationResult } from '@/components/SimulatePayment';
import MemorySheet from '@/components/MemorySheet';
import { t } from '@/data/translations';
import { getActiveVault } from '@/data/vaults';
import { getFriendsByIds } from '@/data/friends';
import {
  fallbackCaption,
  getDayOfWeek,
  getGroupSize,
  getTimeOfDay,
  spendContextLabel,
  toMemoryCategory,
  MEMORY_CATEGORY_LABEL,
  TIME_OF_DAY_LABEL,
  type MemoryContext,
  type SpendContext,
} from '@/lib/memory';
import { getTier, getTierProgress, summarizeMiles, type Tier } from '@/lib/miles';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const NETSMap = dynamic(() => import('@/components/overseas/NETSMap'), { 
  ssr: false,
  loading: () => <div className="skeleton-pulse" style={{width: '100%', height: '200px'}} />
});

// Extend window for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
  interface SpeechRecognition {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    onstart: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
  }
  interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
  }
  interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    readonly length: number;
  }
  interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    readonly length: number;
  }
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }
}

// Static top-up credit transactions to show alongside debits
const topUpTransactions: (Transaction & { isTopUp?: boolean; isCredit?: boolean })[] = [
  {
    id: 'topup-1',
    merchant: 'Top-up via PayNow',
    category: 'hawker',
    amount: 50.00,
    currency: 'SGD',
    location: 'Digital',
    area: 'Online',
    date: '2026-06-28',
    time: '09:00',
    friendIds: [],
    mood: 'happy',
    moodEmoji: '💳',
    memoryLine: 'Topped up via PayNow',
    isOverseas: false,
    isMemory: false,
    isTopUp: true,
    isCredit: true,
  },
  {
    id: 'topup-2',
    merchant: 'Received from Kai',
    category: 'hawker',
    amount: 25.00,
    currency: 'SGD',
    location: 'Digital',
    area: 'Online',
    date: '2026-06-27',
    time: '14:30',
    friendIds: ['kai'],
    mood: 'happy',
    moodEmoji: '💸',
    memoryLine: 'Received from Kai',
    isOverseas: false,
    isMemory: false,
    isTopUp: false,
    isCredit: true,
  },
];

// NETS wallet balance is a real running total, persisted across refreshes.
// Starts from the loaded wallet amount, then every simulated payment subtracts
// and every top-up adds to it.
const STARTING_BALANCE = 500;
const BALANCE_STORAGE_KEY = 'nets-quest-balance';

const CATEGORY_EMOJI: Record<string, string> = {
  hawker: '🍜',
  cafe: '☕',
  transport: '🚇',
  overseas: '✈️',
  restaurant: '🍽️',
  shopping: '🛍️',
};

export default function HomePage() {
  const [showSimulate, setShowSimulate] = useState(false);
  const [lastSimulation, setLastSimulation] = useState<SimulationResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [balanceReady, setBalanceReady] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number | null>(null);
  const [customTopUp, setCustomTopUp] = useState('');
  const [localTopUps, setLocalTopUps] = useState<typeof topUpTransactions>([]);

  const [pendingPayment, setPendingPayment] = useState<SimulationResult | null>(null);
  const [milesToast, setMilesToast] = useState<string | null>(null);
  const [tierUp, setTierUp] = useState<Tier | null>(null);

  const {
    hasOnboarded,
    allTransactions,
    addTransaction,
    personality,
    language,
    userName,
    recordMemory,
    recordTopUp,
    totalMiles,
    syncMilesFromServer,
    updateTransaction,
  } = useApp();

  const tier = getTier(totalMiles);
  const tierProgress = getTierProgress(totalMiles);

  // Fire-and-forget: fetch an AI one-liner and patch the saved memory once it
  // returns. Falls back silently to the deterministic caption already shown.
  const fetchCaption = (ctx: MemoryContext, friendNames: string[]) => {
    fetch('/api/generate-caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant: ctx.merchant,
        category: MEMORY_CATEGORY_LABEL[ctx.category],
        amount: ctx.amount,
        friends: friendNames,
        location: ctx.area,
        timeOfDay: TIME_OF_DAY_LABEL[ctx.timeOfDay],
        day: ctx.dayOfWeek,
        visitCount: ctx.visitCount,
        spendContext: spendContextLabel(ctx.spendContext),
        note: ctx.note,
        foreignCurrency: ctx.foreignCurrency,
        fallback: fallbackCaption(ctx, friendNames),
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.caption) updateTransaction(ctx.paymentId, { memoryLine: d.caption });
      })
      .catch(() => {
        /* keep the fallback caption */
      });
  };
  const router = useRouter();
  
  useEffect(() => {
    if (!hasOnboarded) {
      router.push('/onboarding');
    }
  }, [hasOnboarded, router]);

  // Reconcile the header with the DB-backed miles total (source of truth). Picks
  // up seeded demo totals and miles earned from real events (mood/settle/scan).
  useEffect(() => {
    let cancelled = false;
    fetch('/api/miles')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d || typeof d.total !== 'number') return;
        const { tierUp: newTier } = syncMilesFromServer(d.total);
        if (newTier) {
          setTierUp(newTier);
          setTimeout(() => setTierUp(null), 2000);
        }
      })
      .catch(() => {
        /* not logged in / offline — keep local mock total */
      });
    return () => {
      cancelled = true;
    };
  }, [syncMilesFromServer]);

  // Load the persisted wallet balance on mount (defaults to STARTING_BALANCE).
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BALANCE_STORAGE_KEY);
      if (stored !== null) {
        const parsed = parseFloat(stored);
        if (!Number.isNaN(parsed)) setBalance(parsed);
      }
    } catch {
      // localStorage unavailable — fall back to the in-memory default.
    }
    setBalanceReady(true);
  }, []);

  // Persist the running balance whenever it changes (after the initial load,
  // so we never clobber a stored value with the default).
  useEffect(() => {
    if (!balanceReady) return;
    try {
      localStorage.setItem(BALANCE_STORAGE_KEY, balance.toString());
    } catch {
      // Ignore storage write failures (e.g. private mode quota).
    }
  }, [balance, balanceReady]);

  const latestTransaction = allTransactions[0];

  // ── Spending forecast (derived from real spending, not hardcoded) ──
  // Sum every transaction (including simulated payments), work out the average
  // daily rate over the period the transactions span, and project that across a
  // 30-day month. This moves as soon as the user simulates a payment.
  const spentSoFar = allTransactions.reduce((sum, txn) => sum + txn.amount, 0);
  const txnTimes = allTransactions
    .map((txn) => new Date(txn.date).getTime())
    .filter((ms) => !Number.isNaN(ms));
  const spanDays =
    txnTimes.length > 1
      ? Math.max(1, Math.round((Math.max(...txnTimes) - Math.min(...txnTimes)) / 86_400_000) + 1)
      : 1;
  const projectedMonthlySpend = Math.round((spentSoFar / spanDays) * 30);
  const activeVault = getActiveVault();
  const vaultRemaining = activeVault
    ? Math.max(0, Math.round(activeVault.targetAmount - activeVault.collectedAmount))
    : 0;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const showMilesToast = (msg: string) => {
    setMilesToast(msg);
    setTimeout(() => setMilesToast(null), 2500);
  };

  // Payment confirmed: charge the wallet + persist, then open the memory sheet
  // so the user can add one bit of context (or ignore it and let it auto-save).
  const handleSimulate = (result: SimulationResult) => {
    setLastSimulation(result);
    setBalance(prev => prev - result.amount);

    // Persist the raw transaction to PostgreSQL.
    fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: result.amount,
        currency: 'SGD',
        merchant: result.merchant,
        category: result.category,
      }),
    }).catch(err => console.error('Failed to persist transaction:', err));

    setShowSimulate(false);
    setPendingPayment(result);
  };

  // Sheet resolved: build the full memory context, award NETS Miles, and save.
  const handleMemoryResolve = (spendContext: SpendContext, note: string) => {
    const result = pendingPayment;
    setPendingPayment(null);
    if (!result) return;

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const isOverseas = result.category === 'overseas';
    const priorVisits = allTransactions.filter(txn => txn.merchant === result.merchant).length;

    const ctx: MemoryContext = {
      paymentId: `sim-${now.getTime()}`,
      merchant: result.merchant,
      category: toMemoryCategory(result.category as Transaction['category'], isOverseas),
      amount: result.amount,
      currency: 'SGD',
      date,
      time,
      dayOfWeek: getDayOfWeek(date),
      timeOfDay: getTimeOfDay(time),
      friendIds: [],
      groupSize: getGroupSize(0),
      area: 'Singapore',
      isOverseas,
      isNewDiscovery: priorVisits === 0,
      visitCount: priorVisits + 1,
      spendContext,
      note,
    };

    // Award miles first (reads store state before the new txn is added).
    const { qualifies, miles, tierUp: newTier } = recordMemory(ctx);

    addTransaction({
      id: ctx.paymentId,
      merchant: ctx.merchant,
      category: result.category as Transaction['category'],
      amount: ctx.amount,
      currency: 'SGD',
      location: 'Singapore',
      area: ctx.area,
      date,
      time,
      friendIds: [],
      mood: result.mood,
      moodEmoji: result.moodEmoji,
      memoryLine: fallbackCaption(ctx, []),
      isOverseas,
      isMemory: qualifies,
      spendContext,
      note: note || undefined,
      isNewDiscovery: ctx.isNewDiscovery,
      visitCount: ctx.visitCount,
      timeOfDay: ctx.timeOfDay,
      milesEarned: miles.total,
    });

    // Only memories get an AI one-liner.
    if (qualifies) fetchCaption(ctx, []);

    if (miles.total > 0) showMilesToast(summarizeMiles(miles));
    if (newTier) {
      setTierUp(newTier);
      setTimeout(() => setTierUp(null), 2000);
    }
    showToast(qualifies ? '✨ Memory saved' : '📊 Added to your spending story');
  };

  const handleTopUpConfirm = () => {
    const amount = topUpAmount || parseFloat(customTopUp) || 0;
    if (!amount || amount <= 0) return;

    setBalance(prev => prev + amount);
    const newTopUp = {
      id: `topup-${Date.now()}`,
      merchant: 'Top-up via PayNow',
      category: 'hawker' as Transaction['category'],
      amount,
      currency: 'SGD',
      location: 'Digital',
      area: 'Online',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      friendIds: [],
      mood: 'happy',
      moodEmoji: '💳',
      memoryLine: 'Top-up via PayNow',
      isOverseas: false,
      isMemory: false,
      isTopUp: true,
      isCredit: true,
    };
    setLocalTopUps(prev => [newTopUp, ...prev]);

    // Award NETS ecosystem miles for topping up via PayNow.
    const { miles, tierUp: newTier } = recordTopUp(newTopUp.id, newTopUp.date);
    if (miles.total > 0) showMilesToast(summarizeMiles(miles));
    if (newTier) {
      setTierUp(newTier);
      setTimeout(() => setTierUp(null), 2000);
    }

    // Persist top-up credit transaction to database
    fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency: 'SGD',
        merchant: 'Top-up via PayNow',
        category: 'hawker',
      }),
    }).catch(err => console.error('Failed to persist top-up:', err));

    setShowTopUp(false);
    setTopUpAmount(null);
    setCustomTopUp('');
    showToast(`✓ Topped up $${amount.toFixed(2)} via PayNow`);
  };

  // Barcode decoration
  const barcodeWidths = [3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1];

  const renderTitle = (title: string) => {
    const words = title.split(' ');
    if (words.length <= 1) return title;
    return (
      <>
        {words[0]}{' '}
        <span className="text-red">{words[1]}</span>{' '}
        {words.slice(2).join(' ')}
      </>
    );
  };

  const handleVoicePayment = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Voice recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-SG';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceTranscript("Listening...");
    };

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setVoiceTranscript(transcript);
      setIsListening(false);
      showToast("Parsing voice command...");

      try {
        const res = await fetch('/api/parse-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript })
        });
        const data = await res.json();
        
        if (data.amount) {
          const now = new Date();
          const vDate = now.toISOString().split('T')[0];
          const vTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
          const vId = `voice-${now.getTime()}`;
          const friendIds: string[] = data.friendIds || [];
          const priorVisits = allTransactions.filter(txn => txn.merchant === data.merchant).length;

          // Voice payments auto-save with the default "Worth It" context.
          const vCtx: MemoryContext = {
            paymentId: vId,
            merchant: data.merchant,
            category: toMemoryCategory(data.category as Transaction['category'], false),
            amount: data.amount,
            currency: 'SGD',
            date: vDate,
            time: vTime,
            dayOfWeek: getDayOfWeek(vDate),
            timeOfDay: getTimeOfDay(vTime),
            friendIds,
            groupSize: getGroupSize(friendIds.length),
            area: 'Singapore',
            isOverseas: false,
            isNewDiscovery: priorVisits === 0,
            visitCount: priorVisits + 1,
            spendContext: 'worth_it',
          };
          const { qualifies, miles, tierUp: newTier } = recordMemory(vCtx);
          const friendNames = getFriendsByIds(friendIds).map((f) => f.name);

          addTransaction({
            id: vId,
            merchant: data.merchant,
            category: data.category,
            amount: data.amount,
            currency: 'SGD',
            location: 'Singapore',
            area: 'Singapore',
            date: vDate,
            time: vTime,
            friendIds,
            mood: data.mood || 'happy',
            moodEmoji: '🎙️',
            memoryLine: fallbackCaption(vCtx, friendNames),
            isOverseas: false,
            isMemory: qualifies,
            spendContext: 'worth_it',
            isNewDiscovery: vCtx.isNewDiscovery,
            visitCount: vCtx.visitCount,
            timeOfDay: vCtx.timeOfDay,
            milesEarned: miles.total,
          });
          if (qualifies) fetchCaption(vCtx, friendNames);
          setBalance(prev => prev - data.amount);
          if (miles.total > 0) showMilesToast(summarizeMiles(miles));
          if (newTier) {
            setTierUp(newTier);
            setTimeout(() => setTierUp(null), 2000);
          }
          showToast(`Added ${data.merchant} via Voice!`);
          setVoiceTranscript(null);
        } else {
          showToast("Failed to parse payment details.");
          setVoiceTranscript(null);
        }
      } catch {
        showToast("Error processing voice payment.");
        setVoiceTranscript(null);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setVoiceTranscript(null);
      showToast("Voice recognition failed.");
    };

    recognition.start();
  };

  // Merge all transactions for recent view
  const allWithCredits = [
    ...localTopUps,
    ...allTransactions.map(t => ({ ...t, isCredit: false, isTopUp: false })),
    ...topUpTransactions,
  ].sort((a, b) => {
    // Sort by date+time desc
    const aStr = `${a.date} ${a.time}`;
    const bStr = `${b.date} ${b.time}`;
    return bStr.localeCompare(aStr);
  });

  const recentTransactions = allWithCredits.slice(0, 4);

  return (
    <div className="page-content home-page">
      {/* Tagline */}
      <div className="animate-slap" style={{ margin: '20px 0 8px' }}>
        <div
          className="text-display"
          style={{
            fontSize: '2.4rem',
            lineHeight: '1',
          }}
        >
          GM, {userName}! 👋
          {tier.id === 'legend' && (
            <span
              className="legend-shimmer"
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                fontSize: '0.6rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#1A1A1A',
                background: '#F5C800',
                border: '2px solid #1A1A1A',
                boxShadow: '2px 2px 0 0 #1A1A1A',
                padding: '2px 8px',
                marginLeft: '10px',
                transform: 'rotate(-2deg)',
                display: 'inline-block',
                verticalAlign: 'middle',
              }}
            >
              ★ NETS Legend
            </span>
          )}
          <br />
          {t('home.tagline1', language)} {t('home.tagline2', language)}{' '}
          <span className="text-red">{t('home.tagline3', language)}</span>
        </div>
      </div>

      {/* Barcode decoration */}
      <div className="barcode" style={{ marginBottom: '16px' }}>
        {barcodeWidths.map((w, i) => (
          <span key={i} style={{ width: `${w}px`, height: `${8 + (i % 3) * 6}px` }} />
        ))}
        <span className="text-mono" style={{ marginLeft: '6px', fontSize: '0.55rem', color: 'var(--text-muted)', alignSelf: 'flex-end' }}>
          NETS-SREE-2026
        </span>
      </div>

      <div className="home-masonry">
      {/* ──────────────────────────────────────── */}
      {/* NETS CARD WIDGET                        */}
      {/* ──────────────────────────────────────── */}
      <div
        className="animate-slide-up stagger-1 surface-blue"
        style={{
          background: 'linear-gradient(135deg, #0A1628 0%, #0D2147 60%, #1A3460 100%)',
          border: '2.5px solid #1E3A6E',
          borderRadius: '16px',
          padding: '20px',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '12px',
          boxShadow: '6px 6px 0 #0A0A0A',
        }}
      >
        {/* Watermark */}
        <div style={{
          position: 'absolute',
          top: '-10px',
          right: '-16px',
          fontSize: '6rem',
          fontWeight: 900,
          color: 'rgba(255,255,255,0.04)',
          letterSpacing: '-0.05em',
          fontFamily: 'var(--font-display)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          NETS
        </div>

        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div className="text-muted" style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.55rem',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              marginBottom: '2px',
            }}>
              NETS CARD
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: '1.05rem',
              letterSpacing: '-0.02em',
            }}>
              NETS <span style={{ color: '#4A9FFF' }}>QUEST</span>
            </div>
          </div>
          <span className="surface-yellow" style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: '0.6rem',
            padding: '3px 10px',
            borderRadius: '20px',
            letterSpacing: '0.05em',
          }}>
            GOLD
          </span>
        </div>

        {/* Balance */}
        <div style={{ marginBottom: '14px' }}>
          <div className="text-muted" style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.55rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '2px',
          }}>
            Available Balance
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: '2.2rem',
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}>
            <CountUp value={balance} prefix="$" decimals={2} />
          </div>
          <div className="text-muted" style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            marginTop: '2px',
          }}>
            SGD
          </div>
        </div>

        {/* NETS Miles + tier badge — stamp/sticker treatment */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: '0.72rem',
            color: '#F5C800',
            letterSpacing: '0.04em',
          }}>
            ✦ {totalMiles.toLocaleString()} NETS Miles
          </div>
          <span
            className={tier.id === 'legend' ? 'legend-shimmer' : undefined}
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '0.55rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '4px 10px',
              color: tier.id === 'legend' ? '#1A1A1A' : '#fff',
              background: tier.color,
              border: '2px solid #F7F4EF',
              boxShadow: '2px 2px 0 0 rgba(0,0,0,0.55)',
              transform: 'rotate(-2deg)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {tier.id === 'legend' ? '★ ' : ''}{tier.label}
          </span>
        </div>

        {/* Distance-to-next-tier progress bar (thick-bordered) */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            height: '14px',
            border: '2px solid #F7F4EF',
            background: 'rgba(255,255,255,0.10)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              width: `${Math.round(tierProgress.fraction * 100)}%`,
              background: tier.id === 'legend' ? '#F5C800' : tier.color,
              transition: 'width 0.2s steps(6)',
            }} />
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.55rem',
            color: 'rgba(255,255,255,0.75)',
            marginTop: '4px',
            letterSpacing: '0.06em',
          }}>
            {tierProgress.nextTier
              ? `${tierProgress.milesToNext} miles to ${tierProgress.nextTier.label.toUpperCase()}`
              : 'TOP TIER — NETS LEGEND'}
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div className="text-muted" style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            letterSpacing: '0.12em',
          }}>
            •••• •••• •••• 4291
          </div>
          <div className="text-muted" style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.55rem',
          }}>
            Expires 12/27
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────── */}
      {/* QUICK ACTIONS ROW                       */}
      {/* ──────────────────────────────────────── */}
      <div
        className="animate-slide-up stagger-2"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        {[
          { label: 'Top Up', icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          ), action: () => setShowTopUp(true) },
          { label: 'History', icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          ), href: '/memories' },
          { label: 'Overseas', icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
              <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          ), href: '/overseas' },
          { label: 'Scan', icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
          ), href: '/scanner' },
        ].map((action, i) => {
          const inner = (
            <div
              key={i}
              onClick={action.action}
              style={{
                background: 'var(--card-bg)',
                border: '2.5px solid var(--border-color)',
                padding: '12px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'transform 0.08s steps(2)',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                position: 'relative',
              }}
            >
              <div style={{ color: 'var(--text-primary)' }}>{action.icon}</div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.55rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                textAlign: 'center',
              }}>
                {action.label}
              </div>
            </div>
          );
          if (action.href) {
            return <Link key={i} href={action.href} style={{ textDecoration: 'none' }}>{inner}</Link>;
          }
          return inner;
        })}
      </div>

      {/* Simulate Payment Button */}
      <button
        className="btn-primary animate-slide-up stagger-2"
        onClick={() => setShowSimulate(true)}
        style={{ marginTop: '0px', transform: 'rotate(0.5deg)' }}
      >
        {t('home.simulate', language)}
      </button>

      {/* Last Simulation Result */}
      {lastSimulation && (
        <div className="zine-card zine-card-pink animate-stamp" style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="text-mono" style={{ fontSize: '0.6rem', color: '#fff' }}>
                {t('home.lastPayment', language)}
              </span>
              <div style={{ fontWeight: 900, fontSize: '0.95rem', marginTop: '2px', color: '#fff' }}>
                {lastSimulation.merchant}
              </div>
              <div className="text-mono-bold text-red" style={{ marginTop: '4px', color: '#fff' }}>
                ${lastSimulation.amount.toFixed(2)}
              </div>
            </div>
            <span style={{ fontSize: '2rem' }}>{lastSimulation.moodEmoji}</span>
          </div>
          <div className="divider-dashed" />
          <div style={{ fontStyle: 'italic', fontSize: '0.82rem', color: '#fff' }}>
            &ldquo;{lastSimulation.budgetCoachLine}&rdquo;
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────── */}
      {/* RECENT TRANSACTIONS                     */}
      {/* ──────────────────────────────────────── */}
      <div className="section-header animate-slide-up stagger-3" style={{ marginTop: '24px' }}>
        RECENT
      </div>
      <div
        className="animate-slide-up stagger-3 surface-dark"
        style={{
          border: '2.5px solid var(--border-color)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: 4, left: 4, right: -4, bottom: -4, background: 'var(--ink-black)', zIndex: -1 }} />
        {recentTransactions.map((txn, i) => {
          const isCredit = (txn as { isCredit?: boolean }).isCredit;
          const emoji = (txn as { isTopUp?: boolean }).isTopUp
            ? '💳'
            : txn.moodEmoji || CATEGORY_EMOJI[txn.category] || '💰';
          return (
            <div
              key={txn.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderBottom: i < recentTransactions.length - 1 ? '1.5px solid var(--divider-color)' : 'none',
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                background: 'var(--paper-grey)',
                border: '2px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                flexShrink: 0,
              }}>
                {emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {txn.merchant}
                </div>
                <div className="text-muted" style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                }}>
                  {txn.date} · {txn.time}
                </div>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '0.88rem',
                flexShrink: 0,
              }}>
                {isCredit ? '+' : '-'}${txn.amount.toFixed(2)}
              </div>
            </div>
          );
        })}
        <Link href="/memories" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '10px 16px',
            borderTop: '1.5px solid var(--divider-color)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--nets-blue)',
            textAlign: 'center',
          }}>
            See all →
          </div>
        </Link>
      </div>

      {/* Section: Your Latest Moment */}
      {latestTransaction && (
        <>
          <div className="section-header animate-slide-up stagger-3">
            {t('home.latestMoment', language)}
          </div>
          <MomentCard transaction={latestTransaction} index={0} showRotation={false} variant="red" dimmed={tier.id === 'explorer'} />
        </>
      )}

      {/* Section: This Month's Vibe */}
      <div className="section-header animate-slide-up stagger-5">
        {t('home.thisMonth', language)}
      </div>
      <div
        className="zine-card zine-card-red card-red surface-red animate-slide-up stagger-6 halftone-bg"
        style={{ transform: 'rotate(1.2deg)' }}
      >
        <div className="text-display" style={{ fontSize: '1.3rem', marginBottom: '6px' }}>
          {t('home.youreA', language)} {renderTitle(personality.title)} {t('home.thisMonthSuffix', language)}
        </div>
        <div className="text-muted text-mono" style={{ fontSize: '0.65rem', marginTop: '8px' }}>
          {t('home.basedOn', language)} {allTransactions.length} {t('home.payments', language)} · {t('general.june2026', language)}
        </div>
      </div>

      {/* Spending Forecast */}
      <div className="section-header animate-slide-up stagger-6" style={{ marginTop: '24px' }}>
        Your Month Ahead
      </div>
      <div className="zine-card card-dark surface-dark animate-slide-up stagger-6" style={{ transform: 'rotate(-0.5deg)', border: '2px dashed rgba(255,255,255,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ fontSize: '2rem' }}>🔮</div>
          <div>
            <div className="text-display" style={{ fontSize: '1.1rem' }}>Spending Forecast</div>
            <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: '4px', lineHeight: '1.4' }}>
              At your current rate, you&apos;ll spend <strong>${projectedMonthlySpend}</strong> this month.
              {activeVault && vaultRemaining > 0 ? (
                <> Your {activeVault.destination} vault needs <strong>${vaultRemaining}</strong> more to hit its ${activeVault.targetAmount} goal.</>
              ) : activeVault ? (
                <> Your {activeVault.destination} vault is fully funded! 🎉</>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Summary Strip */}
      <div className="animate-slide-up stagger-7" style={{ 
        marginTop: '16px',
        display: 'flex',
        gap: '8px',
      }}>
        <div style={{
          flex: 1,
          background: 'var(--card-bg)',
          border: '2.5px solid var(--border-color)',
          padding: '12px',
          textAlign: 'center',
        }}>
          <div className="text-mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
            {t('home.memoriesLabel', language)}
          </div>
          <div className="text-display" style={{ fontSize: '1.5rem', color: 'var(--nets-red)' }}>
            <CountUp value={allTransactions.length + 20} />
          </div>
        </div>
        <div style={{
          flex: 1,
          background: 'var(--card-bg)',
          border: '2.5px solid var(--border-color)',
          padding: '12px',
          textAlign: 'center',
        }}>
          <div className="text-mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
            {t('home.friendsLabel', language)}
          </div>
          <div className="text-display" style={{ fontSize: '1.5rem', color: 'var(--nets-blue)' }}>
            <CountUp value={4} />
          </div>
        </div>
        <div style={{
          flex: 1,
          background: 'var(--card-bg)',
          border: '2.5px solid var(--border-color)',
          padding: '12px',
          textAlign: 'center',
        }}>
          <div className="text-mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
            {t('home.countriesLabel', language)}
          </div>
          <div className="text-display" style={{ fontSize: '1.5rem', color: 'var(--hot-pink)' }}>
            <CountUp value={2} />
          </div>
        </div>
      </div>

      {/* Local Map Widget */}
      <div className="section-header animate-slide-up stagger-8" style={{ marginTop: '24px' }}>
        NETS Near You
      </div>
      <div className="animate-slide-up stagger-8" style={{ position: 'relative' }}>
        <NETSMap isOverseasMode={false} compact={true} />
        <Link href="/overseas" style={{ textDecoration: 'none' }}>
          <button className="btn-secondary" style={{ width: '100%', marginTop: '8px' }}>
            See all nearby
          </button>
        </Link>
      </div>
      </div>{/* end home-masonry */}

      {/* Footer barcode */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <div className="barcode" style={{ justifyContent: 'center' }}>
          {barcodeWidths.slice(0, 20).map((w, i) => (
            <span key={`f-${i}`} style={{ width: `${w}px`, height: `${6 + (i % 4) * 4}px` }} />
          ))}
        </div>
        <div className="text-mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          NETS QUEST v1.0 — PolyFinTech100 2026
        </div>
      </div>

      {/* ──────────────────────────────────────── */}
      {/* TOP UP BOTTOM SHEET                     */}
      {/* ──────────────────────────────────────── */}
      {showTopUp && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowTopUp(false); }}
        >
          <div
            className="animate-slide-up"
            style={{
              background: 'var(--off-white)',
              border: '2.5px solid var(--border-color)',
              borderBottom: 'none',
              padding: '24px 20px 40px',
              width: '100%',
              maxWidth: '430px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: '1.2rem',
                letterSpacing: '-0.02em',
              }}>
                Top Up
              </div>
              <button
                onClick={() => setShowTopUp(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-primary)' }}
              >
                ✕
              </button>
            </div>

            {/* Amount quick select */}
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-muted)',
              marginBottom: '10px',
            }}>
              Select Amount
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {[10, 20, 50, 100].map(amt => (
                <button
                  key={amt}
                  onClick={() => { setTopUpAmount(amt); setCustomTopUp(''); }}
                  style={{
                    padding: '12px',
                    border: '2.5px solid var(--border-color)',
                    background: topUpAmount === amt ? 'var(--nets-red)' : 'var(--card-bg)',
                    color: topUpAmount === amt ? '#fff' : 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                  }}
                >
                  ${amt}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-muted)',
              marginBottom: '8px',
            }}>
              Or enter custom amount
            </div>
            <input
              type="number"
              placeholder="e.g. 35"
              value={customTopUp}
              onChange={e => { setCustomTopUp(e.target.value); setTopUpAmount(null); }}
              style={{
                width: '100%',
                padding: '12px',
                border: '2.5px solid var(--border-color)',
                background: 'var(--card-bg)',
                fontFamily: 'var(--font-mono)',
                fontSize: '1rem',
                marginBottom: '16px',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />

            {/* Payment method */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              border: '2px solid var(--border-color)',
              background: 'var(--card-bg)',
              marginBottom: '16px',
            }}>
              <span style={{ fontSize: '1.2rem' }}>📱</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Via PayNow</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>Pre-selected · Instant</div>
              </div>
              <span style={{ marginLeft: 'auto', color: 'var(--stamp-green)', fontWeight: 700, fontSize: '0.8rem' }}>✓</span>
            </div>

            <button
              className="btn-primary"
              onClick={handleTopUpConfirm}
              style={{ width: '100%' }}
            >
              Confirm Top Up ${topUpAmount ? topUpAmount.toFixed(2) : parseFloat(customTopUp || '0').toFixed(2)}
            </button>
          </div>
        </div>
      )}

      {/* Simulate Payment Modal */}
      {showSimulate && (
        <SimulatePayment
          onClose={() => setShowSimulate(false)}
          onSimulate={handleSimulate}
        />
      )}

      {/* Post-payment memory capture sheet */}
      {pendingPayment && (
        <MemorySheet
          caption={`${pendingPayment.merchant} · $${pendingPayment.amount.toFixed(2)}`}
          onResolve={handleMemoryResolve}
        />
      )}

      {/* NETS Miles earned toast (top — separate from the payment toast) */}
      {milesToast && (
        <div
          className="animate-slide-up"
          style={{
            position: 'fixed',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1A1A1A',
            color: '#F5C800',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: '0.78rem',
            padding: '10px 18px',
            border: '2px solid #F5C800',
            zIndex: 1200,
            maxWidth: '90vw',
            textAlign: 'center',
            boxShadow: '3px 3px 0 rgba(0,0,0,0.4)',
          }}
        >
          {milesToast}
        </div>
      )}

      {/* Tier-up celebration overlay */}
      {tierUp && (
        <div
          className="animate-slap"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10,22,40,0.96)',
            zIndex: 4000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '24px',
          }}
        >
          {/* CSS confetti in NETS red + blue */}
          <div className="confetti-layer" aria-hidden="true">
            {Array.from({ length: 40 }).map((_, i) => (
              <span
                key={i}
                className="confetti-piece"
                style={{
                  left: `${(i * 2.5) % 100}%`,
                  background: ['#C0001F', '#0033A0', '#F5C800'][i % 3],
                  animationDelay: `${(i % 10) * 0.12}s`,
                  transform: `rotate(${i * 33}deg)`,
                }}
              />
            ))}
          </div>
          <div
            className="text-mono"
            style={{
              color: tierUp.color,
              letterSpacing: '0.2em',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              marginBottom: '12px',
              position: 'relative',
            }}
          >
            You&apos;re now a
          </div>
          <div
            className={tierUp.id === 'legend' ? 'legend-shimmer' : undefined}
            style={{
              fontFamily: "'Space Grotesk', var(--font-display), sans-serif",
              fontWeight: 800,
              fontSize: '2.6rem',
              color: tierUp.id === 'legend' ? undefined : '#fff',
              letterSpacing: '-0.02em',
              position: 'relative',
            }}
          >
            {tierUp.label}
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.75)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              marginTop: '12px',
              maxWidth: '320px',
              lineHeight: 1.5,
            }}
          >
            {tierUp.unlockLine}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="animate-slap" style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--card-bg)',
          border: '2.5px solid var(--border-color)',
          boxShadow: '4px 4px 0 var(--ink-black)',
          padding: '12px 24px',
          fontWeight: 800,
          fontSize: '0.9rem',
          zIndex: 1000,
          whiteSpace: 'nowrap',
          color: 'var(--text-primary)'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Voice Payment FAB */}
      <div 
        onClick={isListening ? undefined : handleVoicePayment}
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: isListening ? 'var(--nets-blue)' : 'var(--nets-red)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '4px 4px 0 var(--ink-black)',
          border: '2.5px solid var(--ink-black)',
          cursor: 'pointer',
          zIndex: 90,
          animation: isListening ? 'skeletonPulse 1.5s infinite' : 'none',
          transition: 'all 0.2s'
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </div>

      {/* Voice Status Bubble */}
      {voiceTranscript && (
        <div className="animate-slide-up" style={{
          position: 'fixed',
          bottom: '170px',
          right: '20px',
          background: 'var(--card-bg)',
          border: '2px solid var(--ink-black)',
          padding: '8px 12px',
          borderRadius: '12px',
          borderBottomRightRadius: '0px',
          boxShadow: '4px 4px 0 var(--ink-black)',
          zIndex: 90,
          maxWidth: '250px',
          fontSize: '0.8rem',
          fontWeight: 700
        }}>
          {voiceTranscript}
        </div>
      )}
    </div>
  );
}
