'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
      } else {
        // Best-effort: make sure the local user record exists. The endpoint
        // derives identity from the now-established session, so no ids are sent.
        try {
          await fetch('/api/auth/register', { method: 'POST' });
        } catch {
          // Non-fatal — the record is also synced on the OAuth callback.
        }
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (googleError) setError(googleError.message);
    } catch (err) {
      console.error(err);
      setError('Failed to initialize Google login.');
    }
  };

  return (
    <div className="auth-screen">
      {/* Collage stickers behind the card */}
      <div className="auth-blob" style={{ top: '9%', left: '8%', width: 74, height: 74, background: 'var(--nets-blue)', transform: 'rotate(12deg)' }} />
      <div className="auth-blob" style={{ bottom: '11%', right: '9%', width: 96, height: 40, background: 'var(--dirty-yellow)', border: '3px solid var(--ink-black)', transform: 'rotate(-8deg)' }} />
      <div className="auth-blob" style={{ top: '16%', right: '14%', width: 0, height: 0, borderLeft: '26px solid transparent', borderRight: '26px solid transparent', borderBottom: '44px solid var(--nets-red)', transform: 'rotate(18deg)' }} />

      <div className="onb-layout">
        {/* Desktop-only brand panel */}
        <aside className="onb-hero">
          <div className="onb-hero-brand"><span className="nets">NETS</span> <span className="quest">QUEST</span></div>
          <div className="onb-hero-title">Every tap<br />tells your <span className="accent">story.</span></div>
          <p className="onb-hero-sub">Split trips, capture memories and climb the NETS Miles tiers — all from one wallet.</p>
          <div className="onb-hero-list">
            <div className="onb-hero-item"><span>🔒</span><span>256-bit encrypted · MAS regulated</span></div>
            <div className="onb-hero-item"><span>🎟️</span><span>Earn NETS Miles every day</span></div>
            <div className="onb-hero-item"><span>👥</span><span>Vaults &amp; splits with your squad</span></div>
          </div>
        </aside>

      <div className="auth-card-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <span className="auth-stamp">Polyfintech100 · SG 2026</span>
          <span className="auth-stamp" style={{ background: 'var(--nets-blue)', color: '#fff', transform: 'rotate(4deg)' }}>Nets Quest</span>
        </div>

        <div className="auth-card">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.16em', color: 'var(--nets-red)', textTransform: 'uppercase' }}>
            Good to see you
          </div>
          <h1 className="auth-headline">Welcome<br /><span className="accent">Back</span></h1>

          {error && <div className="auth-error">💥 {error}</div>}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="auth-label" htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
                placeholder="you@domain.com"
              />
            </div>

            <div>
              <label className="auth-label" htmlFor="login-password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="auth-input"
                  style={{ paddingRight: 58 }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--nets-blue)', textTransform: 'uppercase' }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div style={{ textAlign: 'right', marginTop: 6 }}>
                <Link href="/auth/signup" className="auth-link" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.06em' }}>
                  Forgot password?
                </Link>
              </div>
            </div>

            <button type="submit" disabled={loading} className="auth-btn auth-btn-primary">
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setError('Face ID isn’t set up on this device yet — use your password for now.')}
            className="auth-btn auth-faceid"
            style={{ marginTop: 12 }}
          >
            ⚇ Continue with Face ID
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
            <div style={{ flex: 1, borderTop: '2px solid var(--ink-black)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--ink-black) 55%, transparent)' }}>or</span>
            <div style={{ flex: 1, borderTop: '2px solid var(--ink-black)' }} />
          </div>

          <button onClick={handleGoogleLogin} type="button" className="auth-btn auth-btn-ghost">
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'color-mix(in srgb, var(--ink-black) 65%, transparent)', marginTop: 20 }}>
            New to NETS Quest?{' '}
            <Link href="/auth/signup" className="auth-link">Create an account</Link>
          </p>

          {/* Barcode-style trust strip */}
          <div style={{ marginTop: 18, borderTop: '2px dashed var(--ink-black)', paddingTop: 10 }}>
            <div className="auth-barcode">
              {[3,1,2,4,1,2,1,3,2,1,4,1,2,2,1,3,1,2,4,1,1,2,3,1,2,1,4,2,1,3].map((w, i) => (
                <span key={i} style={{ width: w, height: 10 + (i % 4) * 4 }} />
              ))}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--ink-black) 55%, transparent)', marginTop: 4 }}>
              256-bit encrypted · MAS regulated
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
