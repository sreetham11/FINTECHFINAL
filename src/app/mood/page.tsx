'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const MOODS = [
  { key: 'EXCITED', emoji: '🤩', label: 'Excited', color: '#FFF3C4', border: '#E6A15C' },
  { key: 'CONFIDENT', emoji: '😎', label: 'Confident', color: '#E0F2FE', border: '#0284C7' },
  { key: 'NEUTRAL', emoji: '😐', label: 'Neutral', color: '#F3F4F6', border: '#4B5563' },
  { key: 'STRESSED', emoji: '😰', label: 'Stressed', color: '#FEE2E2', border: '#EF4444' },
];

export default function MoodPage() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState<number>(0);
  const [insight, setInsight] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const router = useRouter();

  // Load user profile / streak and check-in history
  useEffect(() => {
    fetch('/api/mood/history')
      .then(res => {
        if (res.status === 401) {
          router.push('/auth/login');
          return;
        }
        return res.json();
      })
      .then(data => {
        if (data && data.history) {
          setHistory(data.history);
          // Get current streak from first checkin metadata or user profile
          if (data.history.length > 0) {
            // Estimate streak from history or fallback
            // We'll read the actual streak from user profile later
          }
        }
      })
      .catch(err => console.error('Failed to load mood history', err));

    // Also get the user streak
    fetch('/api/personality')
      .then(res => res.json())
      .then(data => {
        // Fallback or read streak
      })
      .catch(err => console.error(err));
  }, [router]);

  const handleSubmit = async () => {
    if (!selectedMood) return;
    setLoading(true);
    setInsight('');

    try {
      const response = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: selectedMood,
          spendingContext: context,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit mood');
      }

      // Read streak and check-in ID from headers
      const checkinStreak = response.headers.get('X-Mood-Streak');
      if (checkinStreak) {
        setStreak(parseInt(checkinStreak, 10));
      }

      // Stream the response text
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          
          // The stream returned by streamText has data prefixes (e.g. 0:"text"), let's clean it up
          // We can parse chunks or just replace Vercel AI Stream markers: 0:"..."
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                const parsedText = JSON.parse(line.slice(2));
                setInsight(prev => prev + parsedText);
              } catch {
                // If parsing fails, just clean quotes
                const textVal = line.slice(2).replace(/^"|"$/g, '').replace(/\\n/g, '\n');
                setInsight(prev => prev + textVal);
              }
            } else if (!line.includes(':')) {
              // Standard text fallback
              setInsight(prev => prev + line);
            }
          }
        }
      }

      // Refresh history
      const historyRes = await fetch('/api/mood/history');
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData.history);
      }

    } catch (err) {
      console.error(err);
      setInsight('💥 Fails to load insight. Please verify database connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content min-height-100dvh py-8 px-4" style={{ background: '#F7F4EF', paddingTop: '90px', paddingBottom: '90px' }}>
      <div className="max-w-xl mx-auto space-y-8">
        
        {/* Header Display */}
        <div className="bg-white border-[3px] border-[#1A1A1A] p-6 box-shadow-[6px_6px_0_0_#1A1A1A]">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#1A1A1A] font-outfit uppercase">
                Mood <span className="text-[#C0001F]">Check-In</span>
              </h1>
              <p className="text-[#555] font-space-mono text-xs mt-1">
                How does your wallet make you feel today?
              </p>
            </div>
            <div className="bg-[#C0001F] text-white border-2 border-[#1A1A1A] py-2 px-4 text-center font-mono">
              <div className="text-[0.6rem] uppercase tracking-wider font-bold">Streak</div>
              <div className="text-xl font-black">{streak || history.length > 0 ? (streak || 1) : 0}🔥</div>
            </div>
          </div>
        </div>

        {/* Check-In Form */}
        <div className="bg-white border-[3px] border-[#1A1A1A] p-6 box-shadow-[6px_6px_0_0_#1A1A1A] space-y-6">
          <h2 className="font-space-mono text-xs font-black uppercase text-[#1A1A1A] tracking-wider border-b-2 border-[#1A1A1A] pb-2">
            1. Select Your Current Vibe
          </h2>

          <div className="grid grid-cols-4 gap-3">
            {MOODS.map((m) => {
              const isSelected = selectedMood === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setSelectedMood(m.key)}
                  className="flex flex-col items-center justify-center p-4 border-[2.5px] border-[#1A1A1A] transition-all duration-150 active:translate-y-0"
                  style={{
                    backgroundColor: isSelected ? m.color : '#FFFFFF',
                    transform: isSelected ? 'translateY(-4px)' : 'none',
                    boxShadow: isSelected ? `4px 4px 0 0 #1A1A1A` : 'none',
                  }}
                >
                  <span className="text-3xl mb-1">{m.emoji}</span>
                  <span className="font-space-mono text-[0.65rem] font-bold text-[#1A1A1A]">{m.label}</span>
                </button>
              );
            })}
          </div>

          <h2 className="font-space-mono text-xs font-black uppercase text-[#1A1A1A] tracking-wider border-b-2 border-[#1A1A1A] pb-2 pt-2">
            2. Add Financial Context (Optional)
          </h2>

          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. Spent way too much on Grab rides today... or just hit a budget goal! Spill the tea."
            className="w-full h-24 bg-[#F7F4EF] border-2 border-[#1A1A1A] p-3 font-space-mono text-xs text-[#1A1A1A] focus:outline-none focus:bg-white resize-none"
          />

          <button
            onClick={handleSubmit}
            disabled={!selectedMood || loading}
            className="w-full bg-[#1A1A1A] text-white py-3.5 px-6 font-space-mono font-bold uppercase tracking-wider text-xs hover:bg-[#C0001F] transition-all duration-150 disabled:opacity-40"
          >
            {loading ? 'Analyzing your vibe...' : 'Submit Check-In & Get Insight'}
          </button>
        </div>

        {/* AI Insight Box */}
        {(insight || loading) && (
          <div className="bg-[#FFFCEB] border-[3px] border-[#1A1A1A] p-6 box-shadow-[6px_6px_0_0_#1A1A1A] relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#E6A15C] text-[#1A1A1A] font-mono text-[0.6rem] font-bold px-2 py-1 border-b-2 border-l-2 border-[#1A1A1A] uppercase">
              AI Insight
            </div>
            <h3 className="font-space-mono text-xs font-black text-[#C0001F] uppercase tracking-wider mb-3">
              🔮 Coach Claude Says:
            </h3>
            <p className="font-space-mono text-xs text-[#1A1A1A] leading-relaxed whitespace-pre-wrap">
              {insight || 'Tuning into your spending frequencies... 📡'}
            </p>
          </div>
        )}

        {/* History Feed */}
        {history.length > 0 && (
          <div className="bg-white border-[3px] border-[#1A1A1A] p-6 box-shadow-[6px_6px_0_0_#1A1A1A] space-y-4">
            <h2 className="font-space-mono text-xs font-black uppercase text-[#1A1A1A] tracking-wider border-b-2 border-[#1A1A1A] pb-2">
              Previous Vibe Checks
            </h2>
            <div className="divide-y-2 divide-[#1A1A1A]">
              {history.map((h, i) => {
                const moodObj = MOODS.find(m => m.key === h.mood);
                return (
                  <div key={h.id || i} className="py-3 flex justify-between items-center text-xs font-space-mono">
                    <div className="flex items-center gap-3">
                      <span className="text-xl bg-[#F7F4EF] p-1.5 border border-[#1A1A1A] rounded-sm">
                        {moodObj?.emoji || '😐'}
                      </span>
                      <div>
                        <div className="font-bold text-[#1A1A1A]">{moodObj?.label || h.mood}</div>
                        <div className="text-[0.65rem] text-[#777]">{new Date(h.createdAt).toLocaleDateString('en-SG', { dateStyle: 'medium' })}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#C0001F]">SGD {h.spendOnDay ?? 0}</div>
                      <div className="text-[0.6rem] text-[#777] uppercase tracking-wider">spent that day</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
