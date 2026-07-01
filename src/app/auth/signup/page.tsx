'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

      // 2. Call register API to create Prisma user record
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          name: name || data.user.email?.split('@')[0] || 'User',
        }),
      });

      if (!registerRes.ok) {
        const errData = await registerRes.json();
        console.error('Failed to register user in custom database:', errData);
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
    <div className="min-height-100dvh flex flex-col justify-center items-center px-4 relative overflow-hidden" style={{ background: '#F7F4EF' }}>
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full filter blur-[120px] opacity-40 animate-pulse" style={{ background: '#C0001F' }}></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full filter blur-[140px] opacity-35" style={{ background: '#E6A15C' }}></div>

      <div className="w-full max-w-md bg-white border-[3px] border-[#1A1A1A] p-8 relative z-10 box-shadow-[8px_8px_0_0_#1A1A1A]">
        <div className="text-center mb-8">
          <div className="font-mono text-[0.75rem] uppercase tracking-[0.2em] text-[#C0001F] font-bold mb-2">
            PolyFinTech100 Hackathon 2026
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1A1A1A] font-outfit uppercase">
            Create <span className="text-[#C0001F]">Account</span>
          </h1>
          <p className="text-[#555] font-space-mono text-xs mt-2">
            Start your Gen Z payment companion journey.
          </p>
        </div>

        {error && (
          <div className="bg-[#FFF0F2] border-2 border-[#C0001F] text-[#C0001F] p-3 font-mono text-xs mb-6 rounded-sm">
            💥 {error}
          </div>
        )}

        {success ? (
          <div className="bg-[#E6FDF4] border-2 border-[#10B981] text-[#10B981] p-5 font-mono text-xs mb-6 text-center rounded-sm">
            🎉 Account created successfully! <br/>
            Check your email for confirmation, or redirecting you to log in...
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block font-space-mono text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#F7F4EF] border-2 border-[#1A1A1A] px-4 py-3 font-space-mono text-sm text-[#1A1A1A] focus:outline-none focus:bg-white transition-colors"
                placeholder="e.g. John Doe"
              />
            </div>

            <div>
              <label className="block font-space-mono text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#F7F4EF] border-2 border-[#1A1A1A] px-4 py-3 font-space-mono text-sm text-[#1A1A1A] focus:outline-none focus:bg-white transition-colors"
                placeholder="e.g. user@domain.com"
              />
            </div>

            <div>
              <label className="block font-space-mono text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#F7F4EF] border-2 border-[#1A1A1A] px-4 py-3 font-space-mono text-sm text-[#1A1A1A] focus:outline-none focus:bg-white transition-colors"
                placeholder="Minimum 6 characters"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C0001F] text-white border-2 border-[#1A1A1A] py-3.5 px-6 font-space-mono font-bold uppercase tracking-wider text-sm hover:bg-[#A00018] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_0_#1A1A1A] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all duration-150 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        )}

        <p className="text-center font-space-mono text-xs text-[#555] mt-8">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[#C0001F] font-bold underline hover:text-[#A00018]">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
