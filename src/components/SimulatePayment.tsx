'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { t } from '@/data/translations';

interface SimulatePaymentProps {
  onClose: () => void;
  onSimulate: (result: SimulationResult) => void;
}

export interface SimulationResult {
  merchant: string;
  amount: number;
  mood: string;
  moodEmoji: string;
  budgetCoachLine: string;
  category: string;
}

const mockMerchants = [
  { name: 'Mr Bean', amount: 4.20, category: 'cafe' },
  { name: 'Wanton Mee Stall', amount: 5.00, category: 'hawker' },
  { name: 'Toast Box', amount: 6.80, category: 'cafe' },
  { name: 'GrabCar', amount: 9.50, category: 'transport' },
  { name: 'Kopitiam', amount: 3.80, category: 'hawker' },
];

const mockMoods = [
  { mood: 'happy', emoji: '😋' },
  { mood: 'satisfied', emoji: '😊' },
  { mood: 'guilty', emoji: '😅' },
  { mood: 'chill', emoji: '😌' },
];

const mockCoachLines = [
  "you've spent $67 by Thursday — bubble tea is your weakness this week ☕",
  "3 hawker runs in 2 days, you're on a streak 🍜",
  "transport spending up 23% — those late Grabs add up 💀",
  "you're under budget this week, treat yourself fr 🎉",
  "food's taking 62% of your spend — but honestly, valid",
];

export default function SimulatePayment({ onClose, onSimulate }: SimulatePaymentProps) {
  const [step, setStep] = useState<'select' | 'mood' | 'result'>('select');
  const [selectedMerchant, setSelectedMerchant] = useState<typeof mockMerchants[0] | null>(null);
  const [selectedMood, setSelectedMood] = useState<typeof mockMoods[0] | null>(null);
  const { language } = useApp();

  const handleMerchantSelect = (merchant: typeof mockMerchants[0]) => {
    setSelectedMerchant(merchant);
    setStep('mood');
  };

  const handleMoodSelect = (mood: typeof mockMoods[0]) => {
    setSelectedMood(mood);
    const coachLine = mockCoachLines[Math.floor(Math.random() * mockCoachLines.length)];
    
    onSimulate({
      merchant: selectedMerchant!.name,
      amount: selectedMerchant!.amount,
      mood: mood.mood,
      moodEmoji: mood.emoji,
      budgetCoachLine: coachLine,
      category: selectedMerchant!.category,
    });
    
    setStep('result');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {step === 'select' && (
          <div className="animate-slap">
            <div className="text-display text-display-sm" style={{ marginBottom: '4px' }}>
              {t('simulate.title', language)}<br />
              <span className="text-red">{t('simulate.payment', language)}</span>
            </div>
            <p className="text-mono" style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.7rem' }}>
              {t('simulate.tapMerchant', language)}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {mockMerchants.map((m, i) => (
                <button
                  key={m.name}
                  onClick={() => handleMerchantSelect(m)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: 'var(--card-bg)',
                    border: '2.5px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display)',
                    textAlign: 'left',
                    transform: `rotate(${i % 2 === 0 ? '-0.5' : '0.5'}deg)`,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{m.name}</span>
                  <span className="text-mono-bold" style={{ color: 'var(--nets-red)' }}>
                    ${m.amount.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'mood' && (
          <div className="animate-slap">
            <div className="text-display text-display-sm" style={{ marginBottom: '4px' }}>
              {t('simulate.howFeeling', language)}<br />
              <span className="text-pink">{t('simulate.feeling', language)}</span>
            </div>
            <p className="text-mono" style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.7rem' }}>
              {t('simulate.afterPaying', language)} ${selectedMerchant?.amount.toFixed(2)} {t('simulate.at', language)} {selectedMerchant?.name.toUpperCase()}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {mockMoods.map((m) => (
                <button
                  key={m.mood}
                  onClick={() => handleMoodSelect(m)}
                  style={{
                    padding: '16px',
                    background: 'var(--card-bg)',
                    border: '2.5px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>{m.emoji}</span>
                  <span className="text-mono" style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                    {m.mood}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'result' && selectedMerchant && selectedMood && (
          <div className="animate-stamp" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '8px' }}>{selectedMood.emoji}</div>
            <div className="text-display text-display-sm">
              {t('simulate.payment', language)}<br />
              <span className="text-green">{t('simulate.logged', language)}</span>
            </div>
            <div style={{ margin: '16px 0', padding: '12px', background: 'var(--card-bg)', border: '2.5px solid var(--border-color)' }}>
              <div className="text-mono-bold" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>
                {selectedMerchant.name} — ${selectedMerchant.amount.toFixed(2)}
              </div>
              <div className="divider-dashed" />
              <div className="text-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {t('simulate.smartCoach', language)}
              </div>
              <div style={{ fontStyle: 'italic', fontSize: '0.85rem', marginTop: '6px', lineHeight: '1.4' }}>
                &ldquo;{mockCoachLines[Math.floor(Math.random() * mockCoachLines.length)]}&rdquo;
              </div>
            </div>
            <button className="btn-primary" onClick={onClose} style={{ marginTop: '8px' }}>
              {t('simulate.close', language)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
