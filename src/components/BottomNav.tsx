'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems, NavIcon } from '@/components/nav-items';

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
