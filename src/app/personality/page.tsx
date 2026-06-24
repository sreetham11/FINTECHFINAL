'use client';

import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { t } from '@/data/translations';
import Link from 'next/link';

export default function PersonalityPage() {
  const [isSharing, setIsSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const { personality, categories, peakTime, moodPattern, language, simulatedTransactions } = useApp();
  
  const txnCount = simulatedTransactions?.length || 0;
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
                <span className="text-muted" style={{ fontSize: '1.5rem' }}>Analyzing recent payments...</span>
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



        {/* Category Breakdown */}
        <div className="section-header" style={{ margin: '20px 0 12px' }}>
          {t('me.spendingBreakdown', language)}
        </div>

        {categories.map((cat) => (
          <div key={cat.label} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span className="text-mono" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                {cat.label}
              </span>
              <span className="text-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {cat.percent}%
              </span>
            </div>
            <div className="stat-bar">
              <div
                className="stat-bar-fill"
                style={{
                  width: `${cat.percent}%`,
                  background: cat.color,
                }}
              />
            </div>
          </div>
        ))}

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
            {personality.isLoading ? 'Writing your new story...' : personality.story}
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
