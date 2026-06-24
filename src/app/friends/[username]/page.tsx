'use client';

import Link from 'next/link';
import { friends } from '@/data/friends';
import { useApp } from '@/context/AppContext';
import MomentCard from '@/components/MomentCard';
import { t } from '@/data/translations';

export default function FriendProfilePage({ params }: { params: { username: string } }) {
  const { allTransactions, language } = useApp();
  
  // Find friend by username
  const friend = friends.find(f => f.username === `@${params.username}`);

  if (!friend) {
    return <div className="page-content" style={{ textAlign: 'center', paddingTop: '100px' }}>Friend not found</div>;
  }

  // Get shared memories
  const sharedTransactions = allTransactions.filter(t => t.friendIds.includes(friend.id));
  const sharedCount = sharedTransactions.length;
  const lastPaidPlace = sharedTransactions[0]?.merchant || 'Nowhere yet';

  return (
    <div className="page-content">
      {/* Back button */}
      <Link href="/memories" style={{ display: 'inline-block', margin: '10px 0', textDecoration: 'none' }}>
        <div className="text-mono-bold" style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
          {t('friends.back', language)}
        </div>
      </Link>

      {/* Profile Header */}
      <div className="zine-card animate-slap" style={{ textAlign: 'center', marginTop: '10px' }}>
        <div 
          className="friend-avatar-large"
          style={{ background: friend.color, color: 'white', borderColor: 'var(--border-color)' }}
        >
          {friend.avatar}
        </div>
        
        <div className="text-display text-display-md" style={{ marginTop: '16px' }}>
          {friend.name}
        </div>
        <div className="text-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
          {friend.username}
        </div>

        <div className="divider-dashed" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <div className="text-mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
              {t('friends.sharedMemories', language)}
            </div>
            <div className="text-display" style={{ fontSize: '1.4rem', color: 'var(--nets-red)' }}>
              {sharedCount}
            </div>
          </div>
          <div>
            <div className="text-mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
              {t('friends.lastPaidTogether', language)}
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', marginTop: '4px', lineHeight: '1.2' }}>
              {lastPaidPlace}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {sharedTransactions.length > 0 && (
        <>
          <div className="section-header animate-slide-up stagger-2" style={{ marginTop: '30px' }}>
            {t('friends.timeline', language)}
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: '8px', top: 0, bottom: 0,
              width: '2.5px', background: 'var(--divider-color)', zIndex: 0,
            }} />

            <div style={{ paddingLeft: '24px' }}>
              {sharedTransactions.map((txn, index) => (
                <div key={txn.id} style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: '-24px', top: '20px',
                    width: '12px', height: '12px',
                    background: index === 0 ? friend.color : 'var(--card-bg)',
                    border: '2.5px solid var(--border-color)', zIndex: 1,
                  }} />
                  <MomentCard transaction={txn} index={index} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
