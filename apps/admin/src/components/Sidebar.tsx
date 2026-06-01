'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Overview' },
  { href: '/coupons', label: 'Coupons' },
  { href: '/bookings', label: 'Bookings' },
  { href: '/users', label: 'Users' },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-56 flex-col border-r border-white/10 bg-surface p-4">
      <div className="mb-8 flex items-center gap-2 px-2">
        <span className="text-xl text-primary">✦</span>
        <span className="text-lg font-bold">RideAI</span>
        <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-muted">
          admin
        </span>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-3 py-2 text-sm ${
                active ? 'bg-primary text-white' : 'text-muted hover:bg-white/5'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
