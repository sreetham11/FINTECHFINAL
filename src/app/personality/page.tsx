'use client';

import { useState, useRef } from 'react';
import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { t } from '@/data/translations';
import Link from 'next/link';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis } from 'recharts';
import Typewriter from '@/components/Typewriter';

export default function PersonalityPage() {
  const [isSharing, setIsSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const { personality, categories, peakTime, moodPattern, language, simulatedTransactions, allTransactions } = useApp();
  
  const txnCount = simulatedTransactions?.length || 0;

  // Heatmap Data Prep
  const heatmapData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const times = ['Morning', 'Afternoon', 'Evening', 'Night'];
    const grid: any[] = [];
    days.forEach((day, x) => {
      times.forEach((time, y) => {
        grid.push({ x, y, day, time, value: 0 });
      });
    });

    allTransactions.forEach(t => {
      const d = new Date(t.date);
      const dayIdx = d.getDay();
      const hour = parseInt(t.time.split(':')[0]);
      let timeIdx = 0;
      if (hour >= 6 && hour < 12) timeIdx = 0;
      else if (hour >= 12 && hour < 17) timeIdx = 1;
      else if (hour >= 17 && hour < 21) timeIdx = 2;
      else timeIdx = 3;

      const cell = grid.find(g => g.x === dayIdx && g.y === timeIdx);
      if (cell) cell.value += 1;
    });

    return grid.filter(g => g.value > 0);
  }, [allTransactions]);
  const isTitleStoryLocked = txnCount < 10;
  const isTraitsLocked = txnCount < 5;

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

  return (
    <div className="page-content" style={{ padding: '0', paddingTop: 'var(--header-height)', paddingBottom: 'calc(var(--nav-height) + 24px)' }}>
      <div ref={cardRef} className="personality-card animate-slap locked-overlay-container" style={{ margin: '0 8px' }}>
        {/* Partial Reveal Overlay */}
        {!isTraitsLocked && isTitleStoryLocked && (
          <div className="locked-overlay animate-slap" style={{ top: '25%' }}>
            <div>Almost there...</div>
            <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--nets-red)', fontWeight: 900 }}>
              {10 - txnCount} TXNS TO FULL REVEAL
            </div>
          </div>
        )}

        {isTraitsLocked ? (
          <div style={{ textAlign: 'center', padding: '20px 10px', marginBottom: '20px' }}>
             <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔒</div>
             <div className="text-display" style={{ fontSize: '1.6rem', marginBottom: '12px' }}>Your personality is forming...</div>
             <div className="text-body" style={{ color: 'var(--text-muted)', marginBottom: '32px', fontWeight: 500 }}>Every NETS payment reveals more about you</div>
             
             {/* Progress Bar */}
             <div style={{ background: 'var(--border-color)', height: '14px', borderRadius: '7px', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ width: `${(txnCount / 5) * 100}%`, background: 'var(--nets-red)', height: '100%', transition: 'width 0.3s ease' }} />
             </div>
             <div className="text-mono-bold" style={{ fontSize: '0.85rem', marginBottom: '32px', color: 'var(--text-primary)' }}>
               {txnCount}/5 PAYMENTS MADE
             </div>
             
             <div className="text-body" style={{ fontSize: '0.95rem', marginBottom: '20px', fontWeight: 600 }}>
               Make {5 - txnCount} more payment{5 - txnCount === 1 ? '' : 's'} to unlock
             </div>
             
             <Link href="/">
               <button className="btn-primary" style={{ width: '100%' }}>Simulate Payment</button>
             </Link>
          </div>
        ) : (
          <>
            {/* Top stamp */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span
                className="stamp-tag stamp-tag-red"
                style={{ fontSize: '0.6rem', padding: '4px 8px', transform: 'rotate(-3deg)' }}
              >
                {t('general.june2026', language)}
              </span>
              <span
                className="stamp-tag stamp-tag-outline"
                style={{ fontSize: '0.55rem', transform: 'rotate(2deg)' }}
              >
                {t('me.paymentPersonality', language)}
              </span>
            </div>

            {/* Personality Title */}
            <div className={`personality-title ${isTitleStoryLocked ? 'blur-locked' : ''}`} style={{ marginTop: '12px' }}>
              {personality.isLoading ? (
                <>
                  <div className="skeleton-pulse" style={{ height: '36px', width: '90%', marginBottom: '6px' }} />
                  <div className="skeleton-pulse" style={{ height: '36px', width: '60%' }} />
                </>
              ) : (
                renderTitle(personality.title)
              )}
            </div>

            {/* Halftone accent bar */}
            <div style={{
              height: '8px',
              background: 'var(--nets-red)',
              margin: '16px 0',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '4px 4px',
              }} />
            </div>

            {/* Trait Tags */}
            <div className="personality-traits">
              {personality.traits.map((trait, i) => (
                <span
                  key={`${trait.label}-${i}`}
                  className="trait-tag"
                  style={{
                    background: trait.color,
                    color: 'white',
                    borderColor: 'var(--border-color)',
                    transform: `rotate(${Math.random() * 4 - 2}deg)`,
                  }}
                >
                  {trait.label}
                </span>
              ))}
            </div>
          </>
        )}



        {/* Category Breakdown (Recharts) */}
        <div className="section-header" style={{ margin: '20px 0 12px' }}>
          {t('me.spendingBreakdown', language)}
        </div>
        <div style={{ height: '220px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categories}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="percent"
              >
                {categories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip 
                formatter={(value: number) => [`${value}%`, 'Spend']}
                contentStyle={{ background: 'var(--card-bg)', border: '2px solid var(--border-color)', fontWeight: 700 }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Category Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginBottom: '16px' }}>
          {categories.map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', background: c.color, borderRadius: '50%' }} />
              <span className="text-mono" style={{ fontSize: '0.65rem' }}>{c.label} {c.percent}%</span>
            </div>
          ))}
        </div>

        {/* When do you spend Heatmap (Recharts) */}
        <div className="section-header" style={{ margin: '24px 0 12px' }}>
          When do you spend?
        </div>
        <div style={{ height: '200px', width: '100%', marginLeft: '-20px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <XAxis type="number" dataKey="x" name="Day" tickFormatter={(v) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][v]} stroke="var(--border-color)" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} domain={[-0.5, 6.5]} tickCount={7} />
              <YAxis type="number" dataKey="y" name="Time" tickFormatter={(v) => ['Morn','Aft','Eve','Night'][v]} stroke="var(--border-color)" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} domain={[-0.5, 3.5]} tickCount={4} reversed />
              <ZAxis type="number" dataKey="value" range={[50, 400]} />
              <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={{ background: 'var(--card-bg)', border: '2px solid var(--border-color)', padding: '8px', fontWeight: 700 }}>
                        <p className="text-mono" style={{ fontSize: '0.65rem' }}>{data.day} {data.time}</p>
                        <p style={{ color: 'var(--nets-red)' }}>{data.value} transactions</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Spend Heatmap" data={heatmapData} fill="var(--nets-red)" fillOpacity={0.8} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '16px 0' }}>
          <div style={{ background: 'var(--card-bg)', border: '2.5px solid var(--border-color)', padding: '10px' }}>
            <div className="text-mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
              {t('me.peakTime', language)}
            </div>
            <div style={{ fontWeight: 900, fontSize: '0.9rem', marginTop: '2px' }}>
              {peakTime.split(' ')[0]}<br />{peakTime.split(' ').slice(1).join(' ')}
            </div>
          </div>
          <div style={{ background: 'var(--card-bg)', border: '2.5px solid var(--border-color)', padding: '10px' }}>
            <div className="text-mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
              {t('me.moodPattern', language)}
            </div>
            <div style={{ fontWeight: 900, fontSize: '0.9rem', marginTop: '2px' }}>
              {moodPattern.primary}<br />
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                {moodPattern.secondary}
              </span>
            </div>
          </div>
        </div>

        {/* AI Narrative */}
        {!isTraitsLocked && (
          <div className={`personality-story ${isTitleStoryLocked ? 'blur-locked' : ''}`}>
            <div className="text-mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              {t('me.spendingStory', language)}
            </div>
            {personality.isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="skeleton-pulse" style={{ height: '14px', width: '100%' }} />
                <div className="skeleton-pulse" style={{ height: '14px', width: '100%' }} />
                <div className="skeleton-pulse" style={{ height: '14px', width: '80%' }} />
              </div>
            ) : (
              <Typewriter text={personality.story} speed={20} />
            )}
          </div>
        )}

        {/* Barcode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
          <div className="barcode" style={{ flex: 1 }}>
            {barcodeWidths.map((w, i) => (
              <span key={i} style={{ width: `${w}px`, height: `${8 + (i % 3) * 5}px` }} />
            ))}
          </div>
          <span className="text-mono" style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>
            NETS-QUEST-PERSONALITY-2026
          </span>
        </div>

        {/* Next update */}
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <span className="text-mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
            {t('me.nextUpdate', language)}
          </span>
        </div>
      </div>

      {/* Share Button (outside card ref for clean capture) */}
      <div style={{ padding: '12px 8px' }}>
        <button className="share-btn" onClick={handleShare} disabled={isSharing}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 12v8h16v-8M12 3v12M8 7l4-4 4 4" />
          </svg>
          {isSharing ? t('me.saving', language) : t('me.shareCard', language)}
        </button>
      </div>
    </div>
  );
}
