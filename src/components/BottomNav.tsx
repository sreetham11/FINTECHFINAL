'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/memories', label: 'Memories', icon: 'memories' },
  { href: '/vault', label: 'Vault', icon: 'vault' },
  { href: '/scanner', label: 'Scan', icon: 'scanner' },
  { href: '/personality', label: 'Me', icon: 'personality' },
  { href: '/overseas', label: 'Overseas', icon: 'overseas' },
];

const NavIcon = ({ type, active }: { type: string; active: boolean }) => {
  const color = active ? '#C0001F' : '#1A1A1A';
  
  switch (type) {
    case 'home':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke={color}>
          <path d="M3 12L12 3l9 9" strokeLinecap="square" />
          <path d="M5 10v10h5v-6h4v6h5V10" strokeLinecap="square" />
        </svg>
      );
    case 'memories':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke={color}>
          <rect x="3" y="3" width="18" height="18" />
          <path d="M3 9h18M9 3v18" />
        </svg>
      );
    case 'vault':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke={color}>
          <rect x="2" y="6" width="20" height="14" />
          <path d="M6 6V4a6 6 0 0112 0v2" />
          <circle cx="12" cy="14" r="2" />
        </svg>
      );
    case 'personality':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke={color}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
        </svg>
      );
    case 'scanner':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke={color}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 12h18" strokeDasharray="4 4" />
          <path d="M12 8v8" />
        </svg>
      );
    case 'overseas':
      return (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke={color}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c-2 2.5-3 5.5-3 9s1 6.5 3 9c2-2.5 3-5.5 3-9s-1-6.5-3-9z" />
        </svg>
      );
    default:
      return null;
  }
};

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <NavIcon type={item.icon} active={isActive} />
            <span className="nav-item-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
