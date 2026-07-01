'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { t } from '@/data/translations';
import Link from 'next/link';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis } from 'recharts';
import Typewriter from '@/components/Typewriter';
import { useRouter } from 'next/navigation';

export default function PersonalityPage() {
  const [isSharing, setIsSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const { language } = useApp();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [personalityData, setPersonalityData] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Fetch personality details & transactions
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load transactions first to get heatmap/stats
        const txRes = await fetch('/api/transactions');
        if (txRes.status === 401) {
          router.push('/auth/login');
          return;
        }
        const txData = await txRes.json();
        const txs = txData.transactions || [];
        setTransactions(txs);

        // Load personality
        const pRes = await fetch('/api/personality');
        const pData = await pRes.json();
        
        if (pRes.status === 400) {
          setErrorMsg(pData.message || 'Make more payments to reveal your personality!');
        } else if (pRes.ok) {
          setPersonalityData(pData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleReveal = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/personality', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.status === 400) {
        setErrorMsg(data.message);
      } else if (res.ok) {
        setPersonalityData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Heatmap Data Prep from database transactions
  const heatmapData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const times = ['Morning', 'Afternoon', 'Evening', 'Night'];
    const grid: { x: number; y: number; day: string; time: string; value: number }[] = [];
    days.forEach((day, x) => {
      times.forEach((time, y) => {
        grid.push({ x, y, day, time, value: 0 });
      });
    });

    transactions.forEach(t => {
      const d = new Date(t.createdAt);
      const dayIdx = d.getDay();
      const hour = d.getHours();
      let timeIdx = 0;
      if (hour >= 6 && hour < 12) timeIdx = 0;
      else if (hour >= 12 && hour < 17) timeIdx = 1;
      else if (hour >= 17 && hour < 21) timeIdx = 2;
      else timeIdx = 3;

      const cell = grid.find(g => g.x === dayIdx && g.y === timeIdx);
      if (cell) cell.value += 1;
    });

    return grid.filter(g => g.value > 0);
  }, [transactions]);

  // Category Pie Chart Data Prep
  const categoriesData = useMemo(() => {
    const count: Record<string, number> = {};
    transactions.forEach(t => {
      count[t.category] = (count[t.category] ?? 0) + 1;
    });
    const colors: Record<string, string> = {
      Food: '#C0001F',
      Transport: '#0284C7',
      Shopping: '#E6A15C',
      Sightseeing: '#10B981',
      Others: '#8B5CF6'
    };
    return Object.entries(count).map(([label, val]) => ({
      label,
      percent: Math.round((val / (transactions.length || 1)) * 100),
      color: colors[label] || '#4B5563'
    }));
  }, [transactions]);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      if (cardRef.current) {
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: '#F7F4EF',
          scale: 2,
        });
        const link = document.createElement('a');
        link.download = 'nets-quest-personality.png';
        link.href = canvas.toDataURL();
        link.click();
      }
    } catch {
      alert('Card saved! (In production, this downloads as an image)');
    }
    setIsSharing(false);
  };

  // Barcode decoration
  const barcodeWidths = [2, 1, 3, 1, 2, 3, 1, 1, 2, 3, 1, 2, 1, 3, 2, 1, 1, 3, 2, 1, 3, 1, 2, 1];

  const renderTitle = (title: string) => {
    const words = title.split(' ');
    if (words.length === 1) return title;
    if (words.length === 2) return <><span className="text-red">{words[0]}</span><br />{words[1]}</>;
    return (
      <>
        {words[0]}<br />
        <span className="text-red">{words[1]}</span><br />
        {words.slice(2).join(' ')}
      </>
    );
  };

  if (loading) {
    return (
      <div className="page-content min-height-100dvh flex justify-center items-center" style={{ background: '#F7F4EF' }}>
        <div className="font-space-mono text-xs uppercase tracking-widest text-[#C0001F] animate-pulse">
          Analyzing Spending Habits... 🔮
        </div>
      </div>
    );
  }

  const isLocked = !personalityData || transactions.length < 3;

  return (
    <div className="page-content min-height-100dvh py-8 px-4" style={{ background: '#F7F4EF', paddingTop: '90px', paddingBottom: '90px' }}>
      <div className="max-w-xl mx-auto space-y-6">

        <div ref={cardRef} className="personality-card bg-white border-[3px] border-[#1A1A1A] p-6 box-shadow-[6px_6px_0_0_#1A1A1A] space-y-6">
          
          {isLocked ? (
            /* ================= LOCKED STATE ================= */
            <div className="text-center py-8 space-y-6">
              <div className="text-6xl animate-bounce">🔒</div>
              <h2 className="text-2xl font-black text-[#1A1A1A] font-outfit uppercase">
                Personality Locked
              </h2>
              <p className="font-space-mono text-xs text-[#555] max-w-sm mx-auto leading-relaxed">
                {errorMsg || 'Make at least 3 transactions on your NETS Card to unlock your payment personality briefing!'}
              </p>
              
              {/* Progress Slider */}
              <div className="space-y-2 max-w-xs mx-auto">
                <div className="flex justify-between font-space-mono text-[0.65rem] font-bold text-[#777]">
                  <span>Payments</span>
                  <span>{transactions.length} / 3</span>
                </div>
                <div className="w-full bg-[#F7F4EF] border-2 border-[#1A1A1A] h-4 rounded-sm overflow-hidden">
                  <div
                    className="bg-[#C0001F] h-full"
                    style={{ width: `${Math.min(100, (transactions.length / 3) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                {transactions.length >= 3 ? (
                  <button
                    onClick={handleReveal}
                    className="bg-[#1A1A1A] text-white border-2 border-[#1A1A1A] py-2.5 px-6 font-space-mono text-xs font-bold uppercase hover:bg-[#C0001F]"
                  >
                    ✨ Reveal My Personality
                  </button>
                ) : (
                  <Link href="/" className="w-full">
                    <button className="w-full bg-[#1A1A1A] text-white border-2 border-[#1A1A1A] py-2.5 px-6 font-space-mono text-xs font-bold uppercase hover:bg-[#C0001F]">
                      Simulate Payments on Home Screen →
                    </button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            /* ================= UNLOCKED STATE ================= */
            <>
              <div className="flex justify-between items-start">
                <span className="stamp-tag stamp-tag-pink surface-pink font-mono text-[0.6rem] py-1 px-2.5 border-2 border-[#1A1A1A] uppercase tracking-wider rotate-[-2deg]">
                  Verified personality
                </span>
                <span className="stamp-tag stamp-tag-outline font-mono text-[0.6rem] py-1 px-2.5 border border-[#1A1A1A]">
                  NETS QUEST 2026
                </span>
              </div>

              {/* Personality Card Header */}
              <div className="personality-title font-outfit text-3xl font-black uppercase text-[#1A1A1A] tracking-tight leading-none mt-2">
                {renderTitle(personalityData.title)}
              </div>

              {/* Red Accent Divider */}
              <div className="h-2 bg-[#C0001F] relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle,_#fff_1px,_transparent_1px)] bg-[size:4px_4px]" />
              </div>

              {/* Traits Tags */}
              <div className="flex flex-wrap gap-2">
                {personalityData.traits?.map((trait: string, idx: number) => (
                  <span
                    key={idx}
                    className="bg-[#F7F4EF] text-[#1A1A1A] border-2 border-[#1A1A1A] px-3 py-1 font-space-mono text-[0.65rem] font-bold rounded-sm shadow-[2px_2px_0_0_#1A1A1A]"
                    style={{ transform: `rotate(${(idx % 2 === 0 ? 1.5 : -1.5) * (idx + 1)}deg)` }}
                  >
                    ⚡ {trait}
                  </span>
                ))}
              </div>

              {/* Heatmap Section */}
              <div className="space-y-3 pt-4">
                <h3 className="font-space-mono text-xs font-black uppercase border-b-2 border-[#1A1A1A] pb-1.5 text-[#1A1A1A]">
                  ⏱️ Spending Heatmap
                </h3>
                <div style={{ height: '180px', width: '100%', marginLeft: '-20px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <XAxis type="number" dataKey="x" name="Day" tickFormatter={(v) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][v]} stroke="#1A1A1A" tick={{ fill: '#555', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} domain={[-0.5, 6.5]} tickCount={7} />
                      <YAxis type="number" dataKey="y" name="Time" tickFormatter={(v) => ['Morn','Aft','Eve','Night'][v]} stroke="#1A1A1A" tick={{ fill: '#555', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} domain={[-0.5, 3.5]} tickCount={4} reversed />
                      <ZAxis type="number" dataKey="value" range={[40, 200]} />
                      <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-white border-2 border-[#1A1A1A] p-2 font-space-mono text-[0.65rem] font-bold">
                                {d.day} {d.time}: {d.value} txn{d.value > 1 ? 's' : ''}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter name="Spend Heatmap" data={heatmapData} fill="#C0001F" fillOpacity={0.8} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Breakdown Charts */}
              <div className="space-y-3 pt-4">
                <h3 className="font-space-mono text-xs font-black uppercase border-b-2 border-[#1A1A1A] pb-1.5 text-[#1A1A1A]">
                  🍕 Category Breakdown
                </h3>
                <div className="flex items-center gap-4">
                  <div style={{ height: '140px', width: '140px' }} className="flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoriesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          paddingAngle={3}
                          dataKey="percent"
                        >
                          {categoriesData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-2 text-[0.65rem] font-space-mono">
                    {categoriesData.map((c, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        <span>{c.label} ({c.percent}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Narrative */}
              <div className="bg-[#FFFCEB] surface-yellow p-4 border-2 border-[#1A1A1A] space-y-2 box-shadow-[3px_3px_0_0_#1A1A1A]">
                <div className="text-[0.6rem] font-space-mono font-bold uppercase tracking-wider">
                  🔮 AI Spending Narrative:
                </div>
                <div className="font-space-mono text-xs leading-relaxed">
                  <Typewriter text={personalityData.story} speed={15} />
                </div>
              </div>

              {/* Barcode Deco */}
              <div className="flex items-center gap-4 pt-4 border-t-2 border-[#1A1A1A] border-dashed">
                <div className="flex flex-row items-end gap-[1.5px] flex-1">
                  {barcodeWidths.map((w, idx) => (
                    <span key={idx} className="bg-[#1A1A1A]" style={{ width: `${w}px`, height: `${12 + (idx % 4) * 4}px` }} />
                  ))}
                </div>
                <span className="font-space-mono text-[0.55rem] text-[#777] uppercase tracking-widest">
                  {personalityData.personality}
                </span>
              </div>
            </>
          )}

        </div>

        {/* Share Button (Outside card for clean print) */}
        {!isLocked && (
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="w-full bg-[#1A1A1A] text-white border-[3px] border-[#1A1A1A] py-3.5 px-6 font-space-mono font-bold uppercase tracking-wider text-xs hover:bg-[#C0001F] flex items-center justify-center gap-2.5 box-shadow-[4px_4px_0_0_#1A1A1A]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 12v8h16v-8M12 3v12M8 7l4-4 4 4" />
            </svg>
            {isSharing ? 'Saving Card...' : 'Share / Download Card'}
          </button>
        )}

      </div>
    </div>
  );
}
