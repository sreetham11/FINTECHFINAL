'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { DEMO_PROFILES } from '@/data/demo-profiles';

/**
 * Floating demo persona switcher. Overwrites the client (Zustand) transaction +
 * personality state so the whole app previews a different Singaporean lifestyle
 * instantly — no Supabase account, no login.
 */
export default function DemoSwitcher() {
  const [open, setOpen] = useState(false);
  const { activeDemoProfile, applyDemoProfile, clearDemoProfile } = useApp();

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Switch demo persona"
        style={{
          position: 'fixed',
          right: 16,
          bottom: 92,
          zIndex: 1200,
          width: 54,
          height: 54,
          borderRadius: 0,
          border: '3px solid var(--ink-black)',
          background: activeDemoProfile ? 'var(--dirty-yellow)' : 'var(--hot-pink)',
          color: activeDemoProfile ? 'var(--ink-black)' : '#fff',
          boxShadow: '4px 4px 0 0 var(--ink-black)',
          fontSize: activeDemoProfile ? '1.6rem' : '1.3rem',
          cursor: 'pointer',
          transform: 'rotate(-3deg)',
          transition: 'transform 0.08s steps(2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {activeDemoProfile ? activeDemoProfile.mascot : '🎭'}
      </button>

      {open && (
        <>
          {/* click-away backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 1199, background: 'transparent' }}
          />
          <div
            className="animate-slap"
            style={{
              position: 'fixed',
              right: 16,
              bottom: 156,
              zIndex: 1201,
              width: 268,
              maxWidth: 'calc(100vw - 32px)',
              background: 'var(--card-bg, #FBF9F5)',
              border: '3px solid var(--ink-black)',
              boxShadow: '6px 6px 0 0 var(--ink-black)',
              padding: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-black)' }}>
                🎭 Demo Personas
              </span>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', color: 'var(--ink-black)' }}>×</button>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'color-mix(in srgb, var(--ink-black) 60%, transparent)', marginBottom: 10, lineHeight: 1.4 }}>
              Instantly preview a persona across the whole app. No login.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DEMO_PROFILES.map((p) => {
                const active = activeDemoProfile?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      applyDemoProfile(p);
                      setOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      textAlign: 'left',
                      padding: '8px 10px',
                      border: '2.5px solid var(--ink-black)',
                      background: active ? 'var(--nets-blue)' : 'var(--off-white)',
                      color: active ? '#fff' : 'var(--ink-black)',
                      cursor: 'pointer',
                      boxShadow: active ? '2px 2px 0 0 var(--ink-black)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{p.mascot}</span>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.85rem' }}>
                        {p.name}
                      </span>
                      <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.55rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {p.personaTitle}
                      </span>
                    </span>
                    {active && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', fontWeight: 800 }}>ON</span>}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                clearDemoProfile();
                setOpen(false);
              }}
              disabled={!activeDemoProfile}
              style={{
                width: '100%',
                marginTop: 10,
                padding: '8px',
                border: '2.5px solid var(--ink-black)',
                background: activeDemoProfile ? 'var(--nets-red)' : 'var(--paper-grey, #EDEBE7)',
                color: activeDemoProfile ? '#fff' : 'color-mix(in srgb, var(--ink-black) 45%, transparent)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                fontSize: '0.6rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                cursor: activeDemoProfile ? 'pointer' : 'not-allowed',
              }}
            >
              ↺ Reset to default
            </button>
          </div>
        </>
      )}
    </>
  );
}
