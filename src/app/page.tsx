'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import MomentCard from '@/components/MomentCard';
import SimulatePayment, { SimulationResult } from '@/components/SimulatePayment';
import { t } from '@/data/translations';

export default function HomePage() {
  const [showSimulate, setShowSimulate] = useState(false);
  const [lastSimulation, setLastSimulation] = useState<SimulationResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { allTransactions, addTransaction, personality, language } = useApp();
  
  const latestTransaction = allTransactions[0];

  const handleSimulate = (result: SimulationResult) => {
    // Memory Gating Logic
    const isSocial = false; // Simulate UI currently doesn't allow adding friends
    const isOverseas = result.category === 'overseas';
    const isFirstTime = !allTransactions.some(t => t.merchant === result.merchant);
    const isHighEmotion = ['happy', 'guilty', 'impulsive'].includes(result.mood);
    const isLargeSpend = result.amount > 20;

    const isMemory = isSocial || isOverseas || isFirstTime || isHighEmotion || isLargeSpend;

    setLastSimulation(result);
    
    // Add to global state which triggers reactivity
    addTransaction({
      id: `sim-${Date.now()}`,
      merchant: result.merchant,
      category: result.category as any,
      amount: result.amount,
      currency: 'SGD',
      location: 'Singapore',
      area: 'Local',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      friendIds: [],
      mood: result.mood,
      moodEmoji: result.moodEmoji,
      memoryLine: result.budgetCoachLine,
      isOverseas: false,
      isMemory,
    });

    setToastMessage(isMemory ? '✨ Memory saved' : '📊 Added to your spending story');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Barcode decoration
  const barcodeWidths = [3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1];

  // Helper to highlight parts of the title
  const renderTitle = (title: string) => {
    const words = title.split(' ');
    if (words.length <= 1) return title;
    
    // First word normal, second red, rest normal
    return (
      <>
        {words[0]}{' '}
        <span className="text-red">{words[1]}</span>{' '}
        {words.slice(2).join(' ')}
      </>
    );
  };

  return (
    <div className="page-content">
      {/* Tagline */}
      <div className="animate-slap" style={{ margin: '20px 0 8px' }}>
        <div
          className="text-display"
          style={{
            fontSize: '2.4rem',
            lineHeight: '0.9',
            overflow: 'hidden',
          }}
        >
          {t('home.tagline1', language)}<br />
          {t('home.tagline2', language)}<br />
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

      {/* Balance Card */}
      <div className="balance-card animate-slide-up stagger-1" style={{ transform: 'rotate(-0.8deg)' }}>
        <div className="balance-label">{t('home.balance', language)}</div>
        <div className="balance-amount">$247.80</div>
        <div className="balance-currency">{t('home.currency', language)}</div>
        <div style={{ 
          position: 'absolute', 
          bottom: '12px', 
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <span className="stamp-tag stamp-tag-green" style={{ fontSize: '0.55rem', transform: 'rotate(2deg)' }}>
            {t('general.active', language)}
          </span>
        </div>
      </div>

      {/* Simulate Payment Button */}
      <button
        className="btn-primary animate-slide-up stagger-2"
        onClick={() => setShowSimulate(true)}
        style={{ marginTop: '12px', transform: 'rotate(0.5deg)' }}
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

      {/* Section: Your Latest Moment */}
      {latestTransaction && (
        <>
          <div className="section-header animate-slide-up stagger-3">
            {t('home.latestMoment', language)}
          </div>
          <MomentCard transaction={latestTransaction} index={0} showRotation={false} variant="red" />
        </>
      )}

      {/* Section: This Month's Vibe */}
      <div className="section-header animate-slide-up stagger-5">
        {t('home.thisMonth', language)}
      </div>
      <div
        className="zine-card zine-card-red card-red animate-slide-up stagger-6 halftone-bg"
        style={{ transform: 'rotate(1.2deg)' }}
      >
        <div className="text-display" style={{ fontSize: '1.3rem', marginBottom: '6px' }}>
          {t('home.youreA', language)} {renderTitle(personality.title)} {t('home.thisMonthSuffix', language)}
        </div>
        <div className="text-mono" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)', marginTop: '8px' }}>
          {t('home.basedOn', language)} {allTransactions.length} {t('home.payments', language)} · {t('general.june2026', language)}
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
            {allTransactions.length + 20}
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
            4
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
            2
          </div>
        </div>
      </div>

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

      {/* Simulate Payment Modal */}
      {showSimulate && (
        <SimulatePayment
          onClose={() => setShowSimulate(false)}
          onSimulate={handleSimulate}
        />
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
    </div>
  );
}
