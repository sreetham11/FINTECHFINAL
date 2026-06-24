'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getTransactionsByFilter } from '@/data/transactions';
import { searchFriends, Friend } from '@/data/friends';
import MomentCard from '@/components/MomentCard';
import FilterTabs from '@/components/FilterTabs';
import { useApp } from '@/context/AppContext';
import { t } from '@/data/translations';

const filters = ['All', 'Friends', 'Solo', 'Overseas'];

export default function MemoriesPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { allTransactions, language } = useApp();

  // Filter out non-memories first
  const memoryTransactions = allTransactions.filter(t => t.isMemory !== false);

  // Make sure we're filtering using the global transactions including simulated ones
  const getFiltered = (filter: string) => {
    switch (filter.toLowerCase()) {
      case 'friends':
        return memoryTransactions.filter(t => t.friendIds.length > 0 && !t.isOverseas);
      case 'solo':
        return memoryTransactions.filter(t => t.friendIds.length === 0);
      case 'overseas':
        return memoryTransactions.filter(t => t.isOverseas);
      default:
        return memoryTransactions;
    }
  };

  const filteredTransactions = getFiltered(activeFilter);
  const searchResults = searchFriends(searchQuery);

  return (
    <div className="page-content">
      {/* Header stamp */}
      <div className="animate-slap" style={{ margin: '20px 0 0' }}>
        <div
          className="stamp-tag stamp-tag-red"
          style={{
            fontSize: '0.7rem',
            padding: '6px 12px',
            transform: 'rotate(-1.5deg)',
            display: 'inline-block',
          }}
        >
          {t('memories.wallet', language)}
        </div>
      </div>

      {/* Title */}
      <div className="animate-slide-up stagger-1" style={{ margin: '12px 0 4px' }}>
        <div className="text-display" style={{ fontSize: '1.8rem', lineHeight: '0.95' }}>
          {t('memories.youveMade', language)}<br />
          <span className="text-red">{memoryTransactions.length} memories</span><br />
          {t('memories.withNets', language)}
        </div>
      </div>

      {/* Decorative line */}
      <div className="barcode animate-slide-up stagger-2" style={{ margin: '8px 0 4px' }}>
        {[3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 2].map((w, i) => (
          <span key={i} style={{ width: `${w}px`, height: `${6 + (i % 3) * 5}px` }} />
        ))}
      </div>

      {/* Friends Search Bar */}
      <div className="search-bar animate-slide-up stagger-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input 
          type="text" 
          placeholder={t('memories.searchPlaceholder', language)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="search-results-dropdown">
            {searchResults.map((friend) => (
              <Link 
                href={`/friends/${friend.username.substring(1)}`} 
                key={friend.id} 
                className="search-result-item"
                style={{ textDecoration: 'none' }}
              >
                <div 
                  style={{
                    width: '32px', height: '32px',
                    background: friend.color,
                    color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontWeight: 900,
                    border: '2px solid var(--border-color)',
                  }}
                >
                  {friend.avatar}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{friend.name}</div>
                  <div className="text-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{friend.username}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="animate-slide-up stagger-2">
        <FilterTabs
          tabs={[t('memories.all', language), t('memories.friends', language), t('memories.solo', language), t('memories.overseas', language)]}
          activeTab={t(`memories.${activeFilter.toLowerCase()}`, language)}
          onTabChange={(tab) => {
            // Map translated tab back to English filter key
            const filterKey = ['all', 'friends', 'solo', 'overseas'].find(k => t(`memories.${k}`, language) === tab) || 'All';
            setActiveFilter(filterKey);
          }}
        />
      </div>

      {/* Results count */}
      <div className="text-mono animate-slide-up stagger-3" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '12px 0 16px' }}>
        {t('memories.showing', language)} {filteredTransactions.length} {t(`memories.${activeFilter.toLowerCase()}`, language).toUpperCase()} MEMORIES
      </div>

      {/* Memory Timeline */}
      <div style={{ position: 'relative' }}>
        {/* Timeline line */}
        <div style={{
          position: 'absolute',
          left: '8px',
          top: 0,
          bottom: 0,
          width: '2.5px',
          background: 'var(--divider-color)',
          zIndex: 0,
        }} />

        {/* Cards */}
        <div style={{ paddingLeft: '24px' }}>
          {filteredTransactions.map((txn, index) => (
            <div key={txn.id} style={{ position: 'relative' }}>
              {/* Timeline dot */}
              <div style={{
                position: 'absolute',
                left: '-24px',
                top: '20px',
                width: '12px',
                height: '12px',
                background: index === 0 ? 'var(--nets-red)' : 'var(--card-bg)',
                border: '2.5px solid var(--border-color)',
                zIndex: 1,
              }} />
              <MomentCard transaction={txn} index={index} />
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filteredTransactions.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          border: '2.5px dashed var(--divider-color)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🫥</div>
          <div className="text-display text-display-sm">{t('memories.noMemories', language)}</div>
          <div className="text-mono" style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '4px' }}>
            {t('memories.startTapping', language)}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', margin: '24px 0 8px' }}>
        <div className="text-mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
          EVERY PAYMENT IS A STORY — NETS QUEST 2026
        </div>
      </div>
    </div>
  );
}
