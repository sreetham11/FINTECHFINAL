'use client';

import Link from 'next/link';
import { currentUser } from '@/data/user';

export default function Header() {
  return (
    <header className="app-header">
      <Link href="/" style={{ textDecoration: 'none' }}>
        <div className="logo-wordmark">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
            <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4" strokeLinecap="square" />
          </svg>
          <span>
            <span className="nets">NETS</span>{' '}
            <span className="quest">Quest</span>
          </span>
        </div>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/notifications" style={{ textDecoration: 'none' }}>
          <div className="notification-bell">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            {currentUser.notifications > 0 && <div className="notification-dot" />}
          </div>
        </Link>
        
        <Link href="/profile" style={{ textDecoration: 'none' }}>
          <div className="user-avatar">
            {currentUser.avatar}
          </div>
        </Link>
      </div>
    </header>
  );
}
