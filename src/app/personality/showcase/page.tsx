'use client';

import Link from 'next/link';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
} from 'recharts';

// ── Hardcoded example personalities (clearly marked "Example") ──────────────────
interface Example {
  personality: string;
  title: string;
  accent: string; // card accent colour
  traits: string[];
  story: string;
  categories: { label: string; percent: number; color: string }[];
  heatmap: { x: number; y: number; day: string; time: string; value: number }[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIMES = ['Morn', 'Aft', 'Eve', 'Night'];
const hm = (x: number, y: number, value: number) => ({ x, y, day: DAYS[x], time: TIMES[y], value });

const EXAMPLES: Example[] = [
  {
    personality: 'THE_EXPLORER',
    title: 'Midnight Hawker',
    accent: '#C0001F',
    traits: ['Night Owl', 'Small & Frequent', 'Hawker Loyalist', 'Supper Runs'],
    story: 'you paid for the group again, classic. your card knows the way to Geylang at 1am better than google maps does.',
    categories: [
      { label: 'Hawker', percent: 48, color: '#C0001F' },
      { label: 'Supper', percent: 24, color: '#4A1D6E' },
      { label: 'Transport', percent: 18, color: '#2A2A2A' },
      { label: 'Others', percent: 10, color: '#8B5CF6' },
    ],
    heatmap: [hm(5, 3, 6), hm(6, 3, 8), hm(4, 3, 4), hm(0, 3, 5), hm(5, 2, 3), hm(6, 2, 4), hm(3, 3, 2)],
  },
  {
    personality: 'THE_PLANNER',
    title: 'Tactical Spender',
    accent: '#0033A0',
    traits: ['Low Frequency', 'High Value', 'Planned', 'Zero Impulse'],
    story: 'you don’t tap, you deploy. three payments this month, each one calculated to the cent. respect.',
    categories: [
      { label: 'Shopping', percent: 40, color: '#FF2D87' },
      { label: 'Bills', percent: 30, color: '#0033A0' },
      { label: 'Transport', percent: 18, color: '#2A2A2A' },
      { label: 'Food', percent: 12, color: '#C0001F' },
    ],
    heatmap: [hm(1, 1, 5), hm(3, 1, 4), hm(5, 0, 3), hm(1, 0, 2)],
  },
  {
    personality: 'THE_SOCIAL_SPENDER',
    title: 'Vault Vibes',
    accent: '#FF2D87',
    traits: ['Group Trips', 'Always Splitting', 'Squad Funded', 'Social Butterfly'],
    story: 'every payment has a group chat attached. you’re the human GroupPay button and honestly the trip wouldn’t happen without you.',
    categories: [
      { label: 'Sightseeing', percent: 34, color: '#10B981' },
      { label: 'Food', percent: 30, color: '#C0001F' },
      { label: 'Shopping', percent: 22, color: '#FF2D87' },
      { label: 'Transport', percent: 14, color: '#2A2A2A' },
    ],
    heatmap: [hm(6, 2, 7), hm(0, 2, 6), hm(6, 1, 5), hm(5, 3, 4), hm(0, 1, 3)],
  },
  {
    personality: 'THE_EXPLORER',
    title: 'Overseas Explorer',
    accent: '#0B6B3A',
    traits: ['Travel-Triggered', 'Multi-Currency', 'New Merchants', 'Passport Ready'],
    story: 'your spending has a boarding pass. the second you land, the taps start — street food, trains, that one suspicious ATM fee.',
    categories: [
      { label: 'Overseas', percent: 52, color: '#0B6B3A' },
      { label: 'Food', percent: 24, color: '#C0001F' },
      { label: 'Transport', percent: 16, color: '#2A2A2A' },
      { label: 'Others', percent: 8, color: '#8B5CF6' },
    ],
    heatmap: [hm(2, 1, 5), hm(3, 2, 6), hm(4, 1, 4), hm(2, 3, 3), hm(4, 2, 4), hm(3, 0, 2)],
  },
  {
    personality: 'THE_SAVER',
    title: 'Quiet Saver',
    accent: '#2A2A2A',
    traits: ['Rare Taps', 'Essentials Only', 'Budget Boss', 'Delayed Gratification'],
    story: 'your card gets more rest than you do. when you do spend, it’s groceries and a single oat latte reward. iconic restraint.',
    categories: [
      { label: 'Groceries', percent: 46, color: '#10B981' },
      { label: 'Bills', percent: 28, color: '#0033A0' },
      { label: 'Transport', percent: 16, color: '#2A2A2A' },
      { label: 'Café', percent: 10, color: '#8B5CF6' },
    ],
    heatmap: [hm(6, 1, 4), hm(0, 1, 3), hm(3, 0, 2)],
  },
  {
    personality: 'THE_IMPULSIVE',
    title: 'Cart Whisperer',
    accent: '#F5C800',
    traits: ['Impulse Prone', 'Retail Therapy', 'Flash Sales', 'Treat Culture'],
    story: 'saw it, wanted it, tapped it. your memories are 60% "a treat" and we are not judging — okay maybe a little.',
    categories: [
      { label: 'Shopping', percent: 50, color: '#FF2D87' },
      { label: 'Café', percent: 22, color: '#0033A0' },
      { label: 'Food', percent: 18, color: '#C0001F' },
      { label: 'Others', percent: 10, color: '#8B5CF6' },
    ],
    heatmap: [hm(5, 2, 6), hm(6, 2, 5), hm(4, 2, 4), hm(2, 1, 3), hm(5, 1, 4)],
  },
];

function renderTitle(title: string) {
  const words = title.split(' ');
  if (words.length < 2) return title;
  return (
    <>
      {words[0]}<br />
      <span className="text-red">{words.slice(1).join(' ')}</span>
    </>
  );
}

function ExampleCard({ ex, index }: { ex: Example; index: number }) {
  const rotation = index % 2 === 0 ? -1.2 : 1.2;
  return (
    <div style={{ position: 'relative' }}>
      {/* offset shadow block */}
      <div style={{ position: 'absolute', top: 6, left: 6, right: -6, bottom: -6, background: '#1A1A1A', zIndex: 0 }} />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          background: '#FBF9F5',
          border: '3px solid #1A1A1A',
          padding: 20,
          transform: `rotate(${rotation}deg)`,
        }}
      >
        {/* Example stamp badge */}
        <span
          style={{
            position: 'absolute', top: -12, right: 14, zIndex: 3,
            fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.55rem',
            textTransform: 'uppercase', letterSpacing: '0.14em',
            background: '#F5C800', color: '#1A1A1A',
            border: '2.5px solid #1A1A1A', boxShadow: '2px 2px 0 0 #1A1A1A',
            padding: '3px 8px', transform: 'rotate(6deg)',
          }}
        >
          ★ Example
        </span>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <span className="stamp-tag stamp-tag-pink" style={{ fontSize: '0.55rem', transform: 'rotate(-2deg)' }}>
            Sample personality
          </span>
        </div>

        <div className="personality-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#1A1A1A', letterSpacing: '-0.02em', lineHeight: 0.95, marginTop: 4 }}>
          {renderTitle(ex.title)}
        </div>

        {/* accent divider */}
        <div style={{ height: 8, background: ex.accent, position: 'relative', overflow: 'hidden', margin: '12px 0' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '4px 4px', opacity: 0.6 }} />
        </div>

        {/* traits */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {ex.traits.map((tr, i) => (
            <span
              key={tr}
              style={{
                background: '#F7F4EF', color: '#1A1A1A', border: '2px solid #1A1A1A',
                padding: '3px 8px', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700,
                boxShadow: '2px 2px 0 0 #1A1A1A',
                transform: `rotate(${(i % 2 === 0 ? 1 : -1) * 1.2}deg)`,
              }}
            >
              ⚡ {tr}
            </span>
          ))}
        </div>

        {/* charts row */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ width: 110, height: 110, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ex.categories} cx="50%" cy="50%" innerRadius={28} outerRadius={48} paddingAngle={3} dataKey="percent">
                  {ex.categories.map((c) => <Cell key={c.label} fill={c.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: 1, height: 110 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 6, right: 6, bottom: 0, left: -20 }}>
                <XAxis type="number" dataKey="x" tickFormatter={(v) => DAYS[v]?.[0] ?? ''} tick={{ fill: '#555', fontSize: 8, fontFamily: 'monospace' }} tickLine={false} axisLine={false} domain={[-0.5, 6.5]} tickCount={7} />
                <YAxis type="number" dataKey="y" tickFormatter={(v) => TIMES[v] ?? ''} tick={{ fill: '#555', fontSize: 8, fontFamily: 'monospace' }} tickLine={false} axisLine={false} domain={[-0.5, 3.5]} tickCount={4} reversed />
                <ZAxis type="number" dataKey="value" range={[30, 160]} />
                <Scatter data={ex.heatmap} fill={ex.accent} fillOpacity={0.8} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* legend */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontFamily: 'var(--font-mono)', fontSize: '0.6rem', margin: '8px 0 12px' }}>
          {ex.categories.map((c) => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
              <span>{c.label} ({c.percent}%)</span>
            </div>
          ))}
        </div>

        {/* AI narrative */}
        <div style={{ background: '#FFFCEB', border: '2px solid #1A1A1A', padding: 12, boxShadow: '3px 3px 0 0 #1A1A1A' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            🔮 AI Spending Narrative
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', lineHeight: 1.5 }}>{ex.story}</div>
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: '#777', textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 10, textAlign: 'right' }}>
          {ex.personality}
        </div>
      </div>
    </div>
  );
}

export default function PersonalityShowcasePage() {
  return (
    <div className="page-content" style={{ background: '#F7F4EF', minHeight: '100dvh', padding: '80px 16px 90px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="animate-slap" style={{ marginBottom: 6 }}>
          <span className="stamp-tag stamp-tag-yellow" style={{ transform: 'rotate(-3deg)' }}>Gallery · Examples</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 0.9, color: '#1A1A1A', margin: '6px 0 8px' }}>
          Example<br /><span className="text-red">Personalities</span>
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#555', marginBottom: 4, lineHeight: 1.5 }}>
          A peek at the cards NETS Quest generates from your real payments. These are samples — yours unlocks once you’ve made a few taps.
        </p>
        <Link href="/personality" className="auth-link" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
          ← Back to my personality
        </Link>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 28,
            marginTop: 28,
          }}
        >
          {EXAMPLES.map((ex, i) => (
            <ExampleCard key={ex.title} ex={ex} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
