'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { currentUser } from '@/data/user';
import { navItems, NavIcon } from '@/components/nav-items';

/**
 * Desktop-only left navigation rail. Hidden below the `lg` breakpoint (see
 * globals.css), where the fixed top Header + bottom nav take over. Hidden
 * entirely on the pre-login auth / onboarding flow.
 */
export default function Sidebar() {
  const pathname = usePathname();

  const hidden = pathname.startsWith('/auth') || pathname.startsWith('/onboarding');
  if (hidden) return null;

  return (
    <aside className="app-sidebar" aria-label="Primary">
      <Link href="/" className="app-sidebar-brand">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
          <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4" strokeLinecap="square" />
        </svg>
        <span>
          <span className="nets">NETS</span> <span className="quest">Quest</span>
        </span>
      </Link>

      <nav className="app-sidebar-nav">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`app-sidebar-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <NavIcon type={item.icon} active={isActive} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="app-sidebar-footer">
        <Link href="/notifications" className="app-sidebar-item">
          <svg className="nav-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span>Alerts</span>
          {currentUser.notifications > 0 && <span className="app-sidebar-dot" />}
        </Link>
        <Link href="/profile" className="app-sidebar-item">
          <span className="app-sidebar-avatar">{currentUser.avatar}</span>
          <span>Profile</span>
        </Link>
      </div>
    </aside>
  );
}
