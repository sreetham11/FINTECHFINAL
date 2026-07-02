'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

const SQUAD = ['Kai', 'Priya', 'Manoj', 'Wei'];

const STEPS = [
  {
    kicker: "Let's set you up",
    title: ['What’s your', 'name?'],
    subtitle: 'We’ll use this to personalise your Quest dashboard.',
  },
  {
    kicker: 'Step 2 of 3',
    title: ['Your usual', 'squad?'],
    subtitle: 'Pick the friends you split payments with the most.',
  },
  {
    kicker: 'Almost there',
    title: ['Your go-to', 'spot?'],
    subtitle: 'Your most frequented hawker or café.',
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [tempName, setTempName] = useState('');
  const [tempFriends, setTempFriends] = useState<string[]>([]);
  const [tempMerchant, setTempMerchant] = useState('');

  const { setHasOnboarded, setUserName, setFrequentMerchant } = useApp();
  const router = useRouter();

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setUserName(tempName || 'Sree');
      setFrequentMerchant(tempMerchant || 'Maxwell Food Centre');
      setHasOnboarded(true);
      router.push('/');
    }
  };

  const canAdvance = step === 1 ? tempName.trim().length > 0 : true;

  const toggleFriend = (f: string) =>
    setTempFriends((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const meta = STEPS[step - 1];

  return (
    <div className="auth-screen">
      {/* Collage stickers behind the card */}
      <div className="auth-blob" style={{ top: '10%', left: '6%', width: 64, height: 64, background: 'var(--nets-blue)', transform: 'rotate(10deg)' }} />
      <div className="auth-blob" style={{ bottom: '12%', right: '8%', width: 88, height: 38, background: 'var(--dirty-yellow)', border: '3px solid var(--ink-black)', transform: 'rotate(-7deg)' }} />

      <div className="onb-layout">
        {/* Desktop-only brand / hero panel */}
        <aside className="onb-hero">
          <div className="onb-hero-brand">
            <span className="nets">NETS</span> <span className="quest">QUEST</span>
          </div>
          <div className="onb-hero-title">
            Your money,<br />but make it a <span className="accent">story.</span>
          </div>
          <p className="onb-hero-sub">
            Set up in 30 seconds. Then every tap becomes a memory, a split, or a step up the NETS Miles ladder.
          </p>
          <div className="onb-hero-list">
            <div className="onb-hero-item"><span>🧾</span><span>Split trips &amp; bills in seconds</span></div>
            <div className="onb-hero-item"><span>✨</span><span>Turn payments into memories</span></div>
            <div className="onb-hero-item"><span>🎟️</span><span>Earn NETS Miles as you go</span></div>
          </div>
        </aside>

        <div className="auth-card-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <span className="auth-stamp">NETS Quest</span>
          <span className="auth-stamp" style={{ background: 'var(--nets-blue)', color: '#fff', transform: 'rotate(4deg)' }}>Step {step} / 3</span>
        </div>

        <div className="auth-card onb-card">
          {/* Progress bar */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 16 }}>
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                style={{
                  flex: 1,
                  height: 5,
                  border: '2px solid var(--ink-black)',
                  background: step >= i ? 'var(--nets-red)' : 'transparent',
                  transition: 'background 0.1s steps(2)',
                }}
              />
            ))}
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.16em', color: 'var(--nets-red)', textTransform: 'uppercase' }}>
            {meta.kicker}
          </div>
          <h1 className="auth-headline">
            {meta.title[0]}<br /><span className="accent">{meta.title[1]}</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'color-mix(in srgb, var(--ink-black) 65%, transparent)', marginTop: -4, marginBottom: 18, lineHeight: 1.5 }}>
            {meta.subtitle}
          </p>

          {step === 1 && (
            <div>
              <label className="auth-label" htmlFor="onb-name">Your name</label>
              <input
                id="onb-name"
                autoFocus
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="e.g. Sree"
                className="auth-input"
                onKeyDown={(e) => { if (e.key === 'Enter' && canAdvance) handleNext(); }}
              />
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {SQUAD.map((friend) => {
                const selected = tempFriends.includes(friend);
                return (
                  <button
                    key={friend}
                    type="button"
                    onClick={() => toggleFriend(friend)}
                    style={{
                      padding: '14px',
                      border: '2.5px solid var(--ink-black)',
                      background: selected ? 'var(--nets-blue)' : 'var(--off-white)',
                      color: selected ? '#fff' : 'var(--ink-black)',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      boxShadow: selected ? '3px 3px 0 0 var(--ink-black)' : 'none',
                      transform: selected ? 'translate(-1px,-1px)' : 'none',
                      transition: 'transform 0.08s steps(2), box-shadow 0.08s steps(2)',
                    }}
                  >
                    {friend}
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div>
              <label className="auth-label" htmlFor="onb-merchant">Go-to spot</label>
              <input
                id="onb-merchant"
                autoFocus
                type="text"
                value={tempMerchant}
                onChange={(e) => setTempMerchant(e.target.value)}
                placeholder="e.g. Maxwell Food Centre"
                className="auth-input"
                onKeyDown={(e) => { if (e.key === 'Enter') handleNext(); }}
              />
            </div>
          )}

          <button
            type="button"
            className="auth-btn auth-btn-primary"
            onClick={handleNext}
            disabled={!canAdvance}
            style={{ marginTop: 20 }}
          >
            {step === 3 ? "Let’s Go 🚀" : 'Next →'}
          </button>

          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--ink-black) 55%, transparent)' }}
            >
              ← Back
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
