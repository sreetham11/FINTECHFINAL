'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

// Pre-computed particle configs so they don't re-randomize on every render
const PARTICLE_CONFIGS = [
  { size: 10, left: 8,  duration: 10, delay: 0,   isRed: true,  isCircle: true  },
  { size: 18, left: 25, duration: 13, delay: 2,   isRed: false, isCircle: false },
  { size: 12, left: 42, duration: 9,  delay: 4,   isRed: true,  isCircle: false },
  { size: 22, left: 60, duration: 14, delay: 1,   isRed: false, isCircle: true  },
  { size: 8,  left: 75, duration: 11, delay: 3,   isRed: true,  isCircle: true  },
  { size: 16, left: 15, duration: 12, delay: 0.5, isRed: false, isCircle: false },
  { size: 24, left: 88, duration: 15, delay: 2.5, isRed: true,  isCircle: true  },
  { size: 14, left: 50, duration: 8,  delay: 4.5, isRed: false, isCircle: true  },
  { size: 20, left: 35, duration: 10, delay: 1.5, isRed: true,  isCircle: false },
  { size: 11, left: 70, duration: 13, delay: 3.5, isRed: false, isCircle: true  },
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

  const toggleFriend = (f: string) => {
    if (tempFriends.includes(f)) {
      setTempFriends(tempFriends.filter(x => x !== f));
    } else {
      setTempFriends([...tempFriends, f]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '20px', background: '#F7F4EF', paddingBottom: '80px', position: 'relative', overflow: 'hidden' }}>
      
      {/* Floating particle animation — pure CSS */}
      <style>{`
        @keyframes onb-float {
          0%   { transform: translateY(0) rotate(0deg);    opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>

      {/* 10 particles — deterministic configs, no Math.random() in render */}
      {PARTICLE_CONFIGS.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            bottom: '-30px',
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.isRed ? '#C0001F' : '#0033A0',
            opacity: 0,
            borderRadius: p.isCircle ? '50%' : '4px',
            pointerEvents: 'none',
            zIndex: 0,
            animation: `onb-float ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}

      {/* Content layer sits on top */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--nets-red)', letterSpacing: '-1px' }}>
            NETS <span style={{ color: 'var(--nets-blue)' }}>QUEST</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '40px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1, height: '4px', background: step >= i ? 'var(--nets-red)' : '#ccc' }} />
          ))}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {step === 1 && (
            <div className="animate-slide-up">
              <div className="text-display" style={{ fontSize: '2rem', marginBottom: '8px' }}>What&apos;s your name?</div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>We&apos;ll use this to personalise your Quest dashboard.</div>
              <input 
                autoFocus
                type="text" 
                value={tempName} 
                onChange={e => setTempName(e.target.value)} 
                placeholder="e.g. Sree"
                style={{
                  width: '100%', padding: '16px', fontSize: '1.2rem', fontFamily: 'inherit',
                  border: '2.5px solid var(--ink-black)', borderRadius: '12px', background: 'var(--card-bg)'
                }}
              />
            </div>
          )}

          {step === 2 && (
            <div className="animate-slide-up">
              <div className="text-display" style={{ fontSize: '2rem', marginBottom: '8px' }}>Who&apos;s your usual squad?</div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Pick the friends you split payments with the most.</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {['Kai', 'Priya', 'Manoj', 'Wei'].map(friend => (
                  <div 
                    key={friend}
                    onClick={() => toggleFriend(friend)}
                    style={{
                      padding: '16px', border: '2.5px solid var(--ink-black)', borderRadius: '12px',
                      textAlign: 'center', fontWeight: 900, cursor: 'pointer',
                      background: tempFriends.includes(friend) ? 'var(--nets-red)' : 'var(--card-bg)',
                      color: tempFriends.includes(friend) ? '#fff' : 'inherit',
                      transition: 'all 0.2s'
                    }}
                  >
                    {friend}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-slide-up">
              <div className="text-display" style={{ fontSize: '2rem', marginBottom: '8px' }}>Where&apos;s your go-to spot?</div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Your most frequented hawker or cafe.</div>
              <input 
                autoFocus
                type="text" 
                value={tempMerchant} 
                onChange={e => setTempMerchant(e.target.value)} 
                placeholder="e.g. Maxwell Food Centre"
                style={{
                  width: '100%', padding: '16px', fontSize: '1.2rem', fontFamily: 'inherit',
                  border: '2.5px solid var(--ink-black)', borderRadius: '12px', background: 'var(--card-bg)'
                }}
              />
            </div>
          )}
        </div>

        <button 
          className="btn-primary animate-slap" 
          onClick={handleNext}
          style={{ width: '100%', padding: '16px', fontSize: '1.2rem', marginTop: '40px' }}
        >
          {step === 3 ? "Let's Go 🚀" : "Next"}
        </button>
      </div>
    </div>
  );
}
