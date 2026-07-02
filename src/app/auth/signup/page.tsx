'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Sign up user in Supabase Auth
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (signupError) {
        setError(signupError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('Signup succeeded but no user data returned.');
        setLoading(false);
        return;
      }

      // 2. If email confirmation is disabled, signUp returns a live session, so
      //    we can create the local user record now. Otherwise the record is
      //    created on first login / OAuth callback (both use the verified
      //    session). The register endpoint takes identity from the session, so
      //    we only send the display name.
      if (data.session) {
        try {
          const registerRes = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
          });
          if (!registerRes.ok) {
            console.error('Failed to create local user record:', await registerRes.json().catch(() => ({})));
          }
        } catch (err) {
          console.error('Failed to create local user record:', err);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);

    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      {/* Collage stickers behind the card */}
      <div className="auth-blob" style={{ top: '10%', right: '9%', width: 74, height: 74, background: 'var(--nets-red)', transform: 'rotate(-14deg)' }} />
      <div className="auth-blob" style={{ bottom: '12%', left: '8%', width: 96, height: 40, background: 'var(--dirty-yellow)', border: '3px solid var(--ink-black)', transform: 'rotate(7deg)' }} />
      <div className="auth-blob" style={{ top: '18%', left: '13%', width: 0, height: 0, borderLeft: '24px solid transparent', borderRight: '24px solid transparent', borderBottom: '42px solid var(--nets-blue)', transform: 'rotate(-16deg)' }} />

      <div className="onb-layout">
        {/* Desktop-only brand panel */}
        <aside className="onb-hero">
          <div className="onb-hero-brand"><span className="nets">NETS</span> <span className="quest">QUEST</span></div>
          <div className="onb-hero-title">Start your<br />payment <span className="accent">era.</span></div>
          <p className="onb-hero-sub">One wallet for splitting trips, saving memories and earning NETS Miles with your squad.</p>
          <div className="onb-hero-list">
            <div className="onb-hero-item"><span>🧾</span><span>Split bills &amp; trips instantly</span></div>
            <div className="onb-hero-item"><span>✨</span><span>Every tap becomes a memory</span></div>
            <div className="onb-hero-item"><span>🔒</span><span>256-bit encrypted · MAS regulated</span></div>
          </div>
        </aside>

      <div className="auth-card-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <span className="auth-stamp">New here</span>
          <span className="auth-stamp" style={{ background: 'var(--nets-red)', color: '#fff', transform: 'rotate(4deg)' }}>Nets Quest</span>
        </div>

        <div className="auth-card" style={{ transform: 'rotate(1.5deg)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.16em', color: 'var(--nets-red)', textTransform: 'uppercase' }}>
            Your payment era starts
          </div>
          <h1 className="auth-headline">Create<br /><span className="accent">Account</span></h1>

          {error && <div className="auth-error">💥 {error}</div>}

          {success ? (
            <div style={{ border: '2.5px solid var(--stamp-green, #00A86B)', color: 'var(--stamp-green, #00A86B)', padding: 18, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textAlign: 'center', boxShadow: '3px 3px 0 0 var(--ink-black)' }}>
              🎉 Account created!<br />Check your email to confirm, or hang tight — taking you to log in…
            </div>
          ) : (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="auth-label" htmlFor="su-name">Your name</label>
                <input id="su-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="auth-input" placeholder="e.g. Sree Kumar" />
              </div>
              <div>
                <label className="auth-label" htmlFor="su-email">Email address</label>
                <input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="auth-input" placeholder="you@domain.com" />
              </div>
              <div>
                <label className="auth-label" htmlFor="su-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="su-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="auth-input"
                    style={{ paddingRight: 58 }}
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--nets-blue)', textTransform: 'uppercase' }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="auth-btn auth-btn-primary">
                {loading ? 'Creating…' : 'Create Account →'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'color-mix(in srgb, var(--ink-black) 65%, transparent)', marginTop: 20 }}>
            Already have an account?{' '}
            <Link href="/auth/login" className="auth-link">Log in</Link>
          </p>

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
