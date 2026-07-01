'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { formatCurrency } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { t } from '@/data/translations';
import { useRouter } from 'next/navigation';

const NETSMap = dynamic(() => import('@/components/overseas/NETSMap'), { 
  ssr: false,
  loading: () => <div className="skeleton-pulse" style={{width: '100%', height: '400px'}} />
});

const destinations = [
  { code: 'MY', name: 'Kuala Lumpur', country: 'Malaysia', flag: '🇲🇾', acceptance: 'HIGH', color: '#00A86B', merchants: '3,100+' },
  { code: 'TH', name: 'Bangkok', country: 'Thailand', flag: '🇹🇭', acceptance: 'HIGH', color: '#00A86B', merchants: '2,400+' },
  { code: 'JP', name: 'Tokyo', country: 'Japan', flag: '🇯🇵', acceptance: 'MEDIUM', color: '#F5C800', merchants: '800+' },
  { code: 'ID', name: 'Bali', country: 'Indonesia', flag: '🇮🇩', acceptance: 'MEDIUM', color: '#F5C800', merchants: '600+' },
];

export default function OverseasPage() {
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [briefing, setBriefing] = useState('');
  const { language } = useApp();
  const router = useRouter();

  // Load active session
  useEffect(() => {
    fetch('/api/overseas/active')
      .then(res => {
        if (res.status === 401) {
          router.push('/auth/login');
          return;
        }
        return res.json();
      })
      .then(data => {
        if (data && data.session) {
          setActiveSession(data.session);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [router]);

  const startOverseasMode = async (countryCode: string) => {
    setToggling(true);
    setBriefing('');
    try {
      const res = await fetch('/api/overseas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCode }),
      });

      if (!res.ok) throw new Error('Failed to start overseas session');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                const text = JSON.parse(line.slice(2));
                setBriefing(prev => prev + text);
              } catch {
                setBriefing(prev => prev + line.slice(2).replace(/^"|"$/g, ''));
              }
            } else if (!line.includes(':')) {
              setBriefing(prev => prev + line);
            }
          }
        }
      }

      // Re-fetch active session
      const activeRes = await fetch('/api/overseas/active');
      const activeData = await activeRes.json();
      if (activeData && activeData.session) {
        setActiveSession(activeData.session);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  const endOverseasMode = async () => {
    setToggling(true);
    try {
      const res = await fetch('/api/overseas/active', {
        method: 'POST',
      });
      if (res.ok) {
        setActiveSession(null);
        setBriefing('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content min-height-100dvh flex justify-center items-center" style={{ background: '#F7F4EF' }}>
        <div className="font-space-mono text-xs uppercase tracking-widest text-[#C0001F] animate-pulse">
          Loading Travel Settings... ✈️
        </div>
      </div>
    );
  }

  const isOverseas = !!activeSession;
  const currentDest = destinations.find(d => d.code === activeSession?.countryCode) || destinations[1];

  return (
    <div className="page-content min-height-100dvh py-8 px-4" style={{ background: '#F7F4EF', paddingTop: '90px', paddingBottom: '90px' }}>
      <div className="max-w-xl mx-auto space-y-6">

        {/* Header Tag */}
        <div className="animate-slap">
          <div className="stamp-tag stamp-tag-pink surface-pink uppercase tracking-widest text-xs py-1.5 px-4 font-bold border-2 border-[#1A1A1A]">
            Overseas travel Mode
          </div>
        </div>

        {/* Dynamic Map Component */}
        <NETSMap isOverseasMode={isOverseas} />

        {isOverseas ? (
          /* ================= OVERSEAS ACTIVE STATE ================= */
          <div className="space-y-6 animate-slide-up">
            
            {/* Active Session Card */}
            <div className="bg-white border-[3px] border-[#1A1A1A] p-6 box-shadow-[6px_6px_0_0_#1A1A1A] space-y-4">
              <div className="flex justify-between items-center border-b-2 border-[#1A1A1A] pb-3">
                <div>
                  <h2 className="text-2xl font-black text-[#1A1A1A] font-outfit uppercase">
                    Traveling in {currentDest.name} {currentDest.flag}
                  </h2>
                  <p className="text-xs font-space-mono text-[#777] mt-0.5">
                    Currency: {activeSession.currency} · Session Active
                  </p>
                </div>
                <button
                  onClick={endOverseasMode}
                  disabled={toggling}
                  className="bg-[#C0001F] text-white border-2 border-[#1A1A1A] py-1.5 px-4 font-space-mono text-[0.65rem] font-bold uppercase hover:bg-[#A00018]"
                >
                  {toggling ? 'Ending...' : 'End Trip'}
                </button>
              </div>

              {/* Tips Culture Card */}
              <div className="surface-yellow p-4 border border-[#1A1A1A] text-xs font-space-mono">
                <div className="font-bold uppercase mb-1">💡 Tipping Culture:</div>
                <p className="leading-relaxed">{activeSession.tipCulture || 'No custom tipping guidelines specified for this region.'}</p>
              </div>
            </div>

            {/* AI Travel Briefing Display */}
            {(briefing || toggling) && (
              <div className="surface-blue border-[3px] border-[#1A1A1A] p-6 box-shadow-[6px_6px_0_0_#1A1A1A] space-y-4">
                <h3 className="font-space-mono text-xs font-black uppercase border-b border-[#1A1A1A] pb-1.5">
                  🔮 AI Travel briefing & Safety Playbook
                </h3>
                <div className="font-space-mono text-xs leading-relaxed whitespace-pre-wrap">
                  {briefing || 'Building payment playbooks for you... 📲'}
                </div>
              </div>
            )}

          </div>
        ) : (
          /* ================= HOME STATE - SELECT TRIP ================= */
          <div className="space-y-6 animate-slide-up">
            
            <div className="bg-white border-[3px] border-[#1A1A1A] p-6 box-shadow-[6px_6px_0_0_#1A1A1A]">
              <h2 className="text-3xl font-extrabold text-[#1A1A1A] font-outfit uppercase">
                {t('overseas.planningTrip', language)} <span className="text-[#C0001F]">{t('overseas.aTrip', language)}</span>
              </h2>
              <p className="text-xs font-space-mono text-[#555] mt-2">
                Click a destination to unlock exchange rates, local tipping culture briefs, and scan-to-pay safety checklists.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {destinations.map((dest, i) => (
                <button
                  key={dest.code}
                  onClick={() => startOverseasMode(dest.code)}
                  disabled={toggling}
                  className="bg-white text-left p-5 border-[3.5px] border-[#1A1A1A] box-shadow-[5px_5px_0_0_#1A1A1A] hover:bg-[#F7F4EF] active:translate-y-0.5 transition-colors relative overflow-hidden group"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{dest.flag}</span>
                      <div>
                        <div className="font-black text-lg text-[#1A1A1A] font-outfit uppercase">{dest.name}</div>
                        <div className="text-xs font-space-mono text-[#777]">{dest.country}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="stamp-tag stamp-tag-green font-mono text-[0.6rem] uppercase tracking-wider">
                        {dest.acceptance} ACCEPTANCE
                      </span>
                      <div className="text-[0.6rem] font-mono text-[#777] mt-1.5">{dest.merchants} NETS Merchants</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', margin: '24px 0 8px' }}>
          <div className="text-mono" style={{ fontSize: '0.55rem', color: '#999' }}>
            TAP ANYWHERE, PAY EVERYWHERE — NETS QUEST 2026
          </div>
        </div>

      </div>
    </div>
  );
}
