'use client';

import { Transaction } from '@/data/transactions';
import { getFriendsByIds } from '@/data/friends';
import { formatCurrency, formatDate, formatTime, getRandomRotation } from '@/lib/utils';
import {
  MEMORY_CATEGORY_COLOR,
  MEMORY_CATEGORY_LABEL,
  spendContextLabel,
  toMemoryCategory,
} from '@/lib/memory';
import Typewriter from '@/components/Typewriter';

interface MomentCardProps {
  variant?: 'default' | 'red';
  transaction: Transaction;
  index: number;
  showRotation?: boolean;
  /** Explorer tier: memory cards render greyscale until Adventurer is unlocked. */
  dimmed?: boolean;
}

export default function MomentCard({ transaction, index, showRotation = true, dimmed = false }: MomentCardProps) {
  const friends = getFriendsByIds(transaction.friendIds);
  const rotation = showRotation ? getRandomRotation(index) : 0;

  // Card is themed by its memory category (Step 5).
  const memCategory = toMemoryCategory(transaction.category, transaction.isOverseas);
  const cardColor = MEMORY_CATEGORY_COLOR[memCategory];
  // Entertainment (dirty yellow) is a light background — use ink text for contrast.
  const textColor = memCategory === 'entertainment' ? '#1A1A1A' : '#FFFFFF';
  const subtleColor = memCategory === 'entertainment' ? 'rgba(26,26,26,0.65)' : 'rgba(255,255,255,0.75)';

  const contextLabel = transaction.spendContext ? spendContextLabel(transaction.spendContext) : null;
  const visitCount = transaction.visitCount ?? 0;
  const showStreak = visitCount >= 3;

  const stamp = (label: string, key: string) => (
    <span
      key={key}
      style={{
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        fontSize: '0.58rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: '3px 8px',
        border: `1.5px solid ${textColor}`,
        color: textColor,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );

  return (
    <div
      className={`moment-card animate-slide-up stagger-${Math.min(index + 1, 8)}`}
      style={{
        position: 'relative',
        background: cardColor,
        color: textColor,
        border: '2.5px solid #1A1A1A',
        padding: '18px 16px 16px',
        marginBottom: '16px',
        transform: `rotate(${rotation}deg)`,
        filter: dimmed ? 'grayscale(1) opacity(0.9)' : undefined,
      }}
    >
      {/* offset shadow block */}
      <div
        style={{
          position: 'absolute',
          top: '4px',
          left: '4px',
          right: '-4px',
          bottom: '-4px',
          background: '#0A0A0A',
          zIndex: -1,
        }}
      />

      {/* Miles earned badge (top-left) */}
      {typeof transaction.milesEarned === 'number' && transaction.milesEarned > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '10px',
            left: '12px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: '0.6rem',
            color: '#F5C800',
            background: '#1A1A1A',
            padding: '2px 7px',
            letterSpacing: '0.04em',
          }}
        >
          ✦ +{transaction.milesEarned}
        </span>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '8px',
          marginTop: typeof transaction.milesEarned === 'number' && transaction.milesEarned > 0 ? '18px' : 0,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.15rem', letterSpacing: '-0.01em', color: textColor }}>
            {transaction.merchant}
          </div>
          <div className="text-mono" style={{ fontSize: '0.62rem', color: subtleColor, marginTop: '4px' }}>
            {MEMORY_CATEGORY_LABEL[memCategory]} · {formatDate(transaction.date)} · {formatTime(transaction.time)}
          </div>
        </div>
        <div style={{ fontSize: '1.6rem', flexShrink: 0 }}>
          {transaction.isOverseas ? '✈️' : transaction.moodEmoji}
        </div>
      </div>

      {/* Amount */}
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.6rem', marginTop: '10px', color: textColor }}>
        {formatCurrency(transaction.amount)}
        {transaction.foreignAmount && (
          <span style={{ color: subtleColor, fontWeight: 400, fontSize: '0.8rem' }}>
            {' '}({formatCurrency(transaction.foreignAmount, transaction.foreignCurrency || 'THB')})
          </span>
        )}
      </div>

      {/* Stamp badges */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px', alignItems: 'center' }}>
        {transaction.area && stamp(transaction.area, 'area')}
        {contextLabel && stamp(contextLabel, 'context')}
        {transaction.isNewDiscovery && stamp('🌱 First time', 'new')}
        {showStreak && stamp(`Your ${visitCount}${ordinal(visitCount)} time 🔁`, 'streak')}
      </div>

      {/* Friends as avatar chips */}
      {friends.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
          {friends.map((friend) => (
            <span
              key={friend.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                fontWeight: 700,
                padding: '2px 8px 2px 2px',
                border: `1.5px solid ${textColor}`,
                color: textColor,
              }}
            >
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  background: friend.color,
                  color: '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.5rem',
                  fontWeight: 900,
                }}
              >
                {friend.avatar}
              </span>
              {friend.name}
            </span>
          ))}
        </div>
      )}

      {/* AI one-liner */}
      {transaction.memoryLine && (
        <>
          <div style={{ borderTop: `1.5px dashed ${subtleColor}`, margin: '12px 0 10px' }} />
          <div style={{ fontStyle: 'italic', fontSize: '0.85rem', lineHeight: 1.4, color: textColor }}>
            &ldquo;<Typewriter text={transaction.memoryLine} />&rdquo;
          </div>
        </>
      )}
    </div>
  );
}

function ordinal(n: number): string {
  const rem10 = n % 10;
  const rem100 = n % 100;
  if (rem10 === 1 && rem100 !== 11) return 'st';
  if (rem10 === 2 && rem100 !== 12) return 'nd';
  if (rem10 === 3 && rem100 !== 13) return 'rd';
  return 'th';
}
