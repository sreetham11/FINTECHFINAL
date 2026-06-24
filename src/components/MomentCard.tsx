'use client';

import { useState } from 'react';
import { Transaction } from '@/data/transactions';
import { getFriendsByIds } from '@/data/friends';
import { formatCurrency, formatDate, formatTime, getRandomRotation, getCategoryColor } from '@/lib/utils';
import Typewriter from '@/components/Typewriter';

interface MomentCardProps {
  variant?: "default" | "red";
  transaction: Transaction;
  index: number;
  showRotation?: boolean;
}

export default function MomentCard({ transaction, index, showRotation = true, variant = "default" }: MomentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const friends = getFriendsByIds(transaction.friendIds);
  const rotation = showRotation ? getRandomRotation(index) : 0;
  const categoryColor = getCategoryColor(transaction.category);

  const shadowColors = ['#C0001F', '#0033A0', '#FF2D87', '#F5C800', '#1A1A1A'];
  const shadowColor = shadowColors[index % shadowColors.length];
  let cardClass = "";
  if (variant === "red" || shadowColor === '#C0001F') cardClass = "card-red";
  else if (shadowColor === '#0033A0') cardClass = "card-blue";
  else if (shadowColor === '#1A1A1A') cardClass = "card-dark";
  else if (shadowColor === '#FF2D87') cardClass = "card-pink";
  else if (shadowColor === '#F5C800') cardClass = "card-yellow";

  return (
    <div
      className={`moment-card ${cardClass} animate-slide-up stagger-${Math.min(index + 1, 8)}`}
      style={{
        transform: `rotate(${rotation}deg)`,
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div
        style={{
          content: '',
          position: 'absolute',
          top: '4px',
          left: '4px',
          right: '-4px',
          bottom: '-4px',
          background: shadowColor,
          zIndex: -1,
        }}
      />

      <div className="moment-card-header">
        <div>
          <div className="moment-merchant">{transaction.merchant}</div>
          <div className="moment-meta" style={{ marginTop: '6px' }}>
            <span className="stamp-tag stamp-tag-outline" style={{ borderColor: categoryColor, color: categoryColor }}>
              {transaction.area}
            </span>
            <span className="text-mono moment-timestamp" style={{ color: '#999' }}>
              {formatDate(transaction.date)} · {formatTime(transaction.time)}
            </span>
          </div>
        </div>
        <div className="moment-emoji">{transaction.moodEmoji}</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="moment-amount" style={{ color: categoryColor }}>
          {formatCurrency(transaction.amount)}
          {transaction.foreignAmount && (
            <span style={{ color: '#999', fontWeight: 400, fontSize: '0.75rem' }}>
              {' '}({formatCurrency(transaction.foreignAmount, transaction.foreignCurrency || 'THB')})
            </span>
          )}
        </div>
        {transaction.splitAmount && (
          <span className="stamp-tag stamp-tag-yellow" style={{ transform: 'rotate(2deg)' }}>
            SPLIT {formatCurrency(transaction.splitAmount)}/ea
          </span>
        )}
      </div>

      {friends.length > 0 && (
        <div className="moment-friends">
          {friends.map((friend) => (
            <span
              key={friend.id}
              className="friend-tag"
              style={{ borderColor: friend.color, color: friend.color }}
            >
              <span
                className="friend-avatar-badge"
                style={{
                  width: '14px',
                  height: '14px',
                  background: friend.color,
                  color: 'white',
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

      <div className="moment-memory-line">
        &ldquo;<Typewriter text={transaction.memoryLine} />&rdquo;
      </div>

      {expanded && (
        <div className="moment-expanded animate-slap">
          <div className="moment-map-pin">
            <span style={{ zIndex: 2, position: 'relative' }}>
              📍 {transaction.location}, {transaction.area}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="stamp-tag" style={{ background: '#fff', transform: 'rotate(-1deg)' }}>
              MOOD: {transaction.mood}
            </span>
            <span className="stamp-tag" style={{ background: '#fff', transform: 'rotate(2deg)' }}>
              {transaction.category.toUpperCase()}
            </span>
            {transaction.isOverseas && (
              <span className="stamp-tag stamp-tag-pink" style={{ transform: 'rotate(-2deg)' }}>
                OVERSEAS
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
