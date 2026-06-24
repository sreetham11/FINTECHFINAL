'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { formatCurrency, convertCurrency } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { t } from '@/data/translations';

const NETSMap = dynamic(() => import('@/components/overseas/NETSMap'), { 
  ssr: false,
  loading: () => <div className="skeleton-pulse" style={{width: '100%', height: '400px'}} />
});

const friendPayments = [
  { friend: 'Kai', merchant: '7-Eleven Sukhumvit', amount: 4.20, emoji: '🏪', timeAgo: '2h ago' },
  { friend: 'Priya', merchant: 'Chatuchak Market', amount: 18.50, emoji: '🛍️', timeAgo: '5h ago' },
  { friend: 'Wei', merchant: 'Terminal 21 Food Court', amount: 6.80, emoji: '🍜', timeAgo: '1d ago' },
];

const travelTips = [
  { tip: 'NETS QR works at all 7-Eleven Thailand locations', icon: '🏪' },
  { tip: 'Look for the NETS logo at Central Group malls', icon: '🏬' },
  { tip: 'Street food vendors may not accept NETS — bring cash backup', icon: '💵' },
  { tip: 'Currency conversion happens at real-time rates, no hidden fees', icon: '💱' },
];

const destinations = [
  { name: 'Bangkok', country: 'Thailand', flag: '🇹🇭', acceptance: 'HIGH', color: '#00A86B', merchants: '2,400+' },
  { name: 'Tokyo', country: 'Japan', flag: '🇯🇵', acceptance: 'MEDIUM', color: '#F5C800', merchants: '800+' },
  { name: 'Kuala Lumpur', country: 'Malaysia', flag: '🇲🇾', acceptance: 'HIGH', color: '#00A86B', merchants: '3,100+' },
  { name: 'Bali', country: 'Indonesia', flag: '🇮🇩', acceptance: 'MEDIUM', color: '#F5C800', merchants: '600+' },
];

export default function OverseasPage() {
  const [isOverseas, setIsOverseas] = useState(false);
  const { language } = useApp();
  const rate = 25.5; // SGD to THB



  const spendingSummary = {
    totalSGD: 51.50,
    totalTHB: convertCurrency(51.50, rate),
    transactionCount: 4,
  };

  return (
    <div className="page-content">
      {/* Header stamp */}
      <div className="animate-slap" style={{ margin: '20px 0 0' }}>
        <div
          className="stamp-tag stamp-tag-pink"
          style={{
            fontSize: '0.7rem',
            padding: '6px 12px',
            transform: 'rotate(-1.5deg)',
            display: 'inline-block',
          }}
        >
          {t('overseas.mode', language)}
        </div>
      </div>

      {/* Toggle */}
      <div
        className={`overseas-toggle animate-slide-up stagger-1 ${isOverseas ? 'active' : ''}`}
        onClick={() => setIsOverseas(!isOverseas)}
      >
        <div>
          <div style={{ fontWeight: 900, fontSize: '1rem' }}>
            {isOverseas ? t('overseas.youreOverseas', language) : t('overseas.youreHome', language)}
          </div>
          <div className="text-mono" style={{ fontSize: '0.6rem', opacity: 0.6, marginTop: '2px' }}>
            {isOverseas ? 'BANGKOK, THAILAND' : 'LOCAL MODE'}
          </div>
        </div>
        <div className="toggle-switch" />
      </div>

      <div className="animate-slide-up stagger-2" style={{ margin: '16px 0' }}>
        <NETSMap isOverseasMode={isOverseas} />
      </div>

      {isOverseas ? (
        /* ===== OVERSEAS ACTIVE STATE ===== */
        <>
          {/* Confidence Score */}
          <div
            className="zine-card zine-card-pink card-red animate-slide-up stagger-2"
            style={{ transform: 'rotate(-0.5deg)', textAlign: 'center' }}
          >
            <div className="text-mono" style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.8)' }}>
              {t('overseas.confidenceScore', language)}
            </div>
            <div className="text-display" style={{ fontSize: '1.6rem', margin: '8px 0 4px', color: '#fff' }}>
              {t('overseas.netsReady', language)}<br />{t('overseas.in', language)} Bangkok <span style={{ color: 'var(--stamp-green)' }}>🟢</span>
            </div>
            <div className="text-mono" style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.8)' }}>
              2,400+ MERCHANTS ACCEPT NETS · HIGH COVERAGE
            </div>
          </div>

          {/* Currency Conversion */}
          <div className="zine-card animate-slide-up stagger-3" style={{ transform: 'rotate(0.3deg)', marginTop: '16px' }}>
            <div className="text-mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
              {t('overseas.liveRate', language)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <div>
                <div className="text-display" style={{ fontSize: '1.4rem' }}>$1.00</div>
                <div className="text-mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>SGD</div>
              </div>
              <div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--nets-red)' }}>→</div>
              <div>
                <div className="text-display" style={{ fontSize: '1.4rem', color: 'var(--nets-blue)' }}>
                  ฿{rate.toFixed(1)}
                </div>
                <div className="text-mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>THB</div>
              </div>
            </div>
          </div>

          {/* Spending Summary */}
          <div
            className="animate-slide-up stagger-3"
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '16px',
            }}
          >
            <div style={{
              flex: 1,
              background: 'var(--card-bg)',
              border: '2.5px solid var(--border-color)',
              padding: '12px',
              textAlign: 'center',
            }}>
              <div className="text-mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{t('overseas.spent', language)} (SGD)</div>
              <div className="text-display" style={{ fontSize: '1.3rem', color: 'var(--nets-red)' }}>
                {formatCurrency(spendingSummary.totalSGD)}
              </div>
            </div>
            <div style={{
              flex: 1,
              background: 'var(--card-bg)',
              border: '2.5px solid var(--border-color)',
              padding: '12px',
              textAlign: 'center',
            }}>
              <div className="text-mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{t('overseas.spent', language)} (THB)</div>
              <div className="text-display" style={{ fontSize: '1.3rem', color: 'var(--nets-blue)' }}>
                ฿{spendingSummary.totalTHB.toFixed(0)}
              </div>
            </div>
            <div style={{
              flex: 1,
              background: 'var(--card-bg)',
              border: '2.5px solid var(--border-color)',
              padding: '12px',
              textAlign: 'center',
            }}>
              <div className="text-mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{t('home.payments', language)}</div>
              <div className="text-display" style={{ fontSize: '1.3rem', color: 'var(--hot-pink)' }}>
                {spendingSummary.transactionCount}
              </div>
            </div>
          </div>


          {/* Friends Paid Here */}
          <div className="section-header animate-slide-up stagger-5">{t('overseas.friendsPaid', language)}</div>
          {friendPayments.map((fp, i) => (
            <div
              key={fp.friend}
              className="zine-card animate-slide-up"
              style={{
                transform: `rotate(${i % 2 === 0 ? '-0.5' : '0.7'}deg)`,
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>{fp.emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {fp.friend} paid at {fp.merchant}
                  </div>
                  <div className="text-mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                    {fp.timeAgo}
                  </div>
                </div>
              </div>
              <div className="text-mono-bold" style={{ fontSize: '0.8rem', color: 'var(--nets-red)' }}>
                {formatCurrency(fp.amount)}
              </div>
            </div>
          ))}

          {/* Travel Tips */}
          <div className="section-header animate-slide-up stagger-6">{t('overseas.travelTips', language)}</div>
          <div className="animate-slide-up stagger-6" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {travelTips.map((tt, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  background: 'var(--card-bg)',
                  border: '2px solid var(--border-color)',
                  transform: `rotate(${i % 2 === 0 ? '-0.3' : '0.3'}deg)`,
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{tt.icon}</span>
                <span style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>{tt.tip}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* ===== HOME STATE — Planning a trip? ===== */
        <>
          <div className="animate-slide-up stagger-2" style={{ margin: '20px 0 16px' }}>
            <div className="text-display" style={{ fontSize: '1.8rem', lineHeight: '0.95' }}>
              {t('overseas.planningTrip', language)}<br /><span className="text-pink">{t('overseas.aTrip', language)}</span>
            </div>
            <div className="text-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              {t('overseas.seeWhere', language)}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {destinations.map((dest, i) => (
              <div
                key={dest.name}
                className="destination-card animate-slide-up"
                style={{
                  animationDelay: `${0.1 + i * 0.05}s`,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: '3px',
                    right: '-3px',
                    bottom: '-3px',
                    background: dest.color,
                    zIndex: -1,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '2rem' }}>{dest.flag}</span>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>{dest.name}</div>
                      <div className="text-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {dest.country}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      className="stamp-tag"
                      style={{
                        background: dest.color,
                        color: 'white',
                        borderColor: dest.color,
                        fontSize: '0.55rem',
                      }}
                    >
                      {dest.acceptance}
                    </span>
                    <div className="text-mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {dest.merchants} {t('general.merchants', language)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px', padding: '20px', border: '2px dashed var(--divider-color)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>✈️</div>
            <div className="text-display text-display-sm">{t('overseas.toggleOverseas', language)}</div>
            <div className="text-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t('overseas.whenArrive', language)}
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', margin: '24px 0 8px' }}>
        <div className="text-mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
          TAP ANYWHERE, PAY EVERYWHERE — NETS QUEST 2026
        </div>
      </div>
    </div>
  );
}
