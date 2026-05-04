'use client';

import { usePathname } from 'next/navigation';
import { Home, Users, DollarSign, CreditCard, BarChart2, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Members', href: '/members', icon: Users },
    { name: 'Contributions', href: '/contributions', icon: DollarSign },
    { name: 'Loans', href: '/loans', icon: CreditCard },
    { name: 'Reports', href: '/reports', icon: BarChart2 },
    { name: 'More', href: '/more', icon: MoreHorizontal },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 w-full z-50 md:hidden"
      style={{
        background: 'rgba(10, 15, 28, 0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex justify-around items-center h-[65px]">
        {items.map((item, i) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={i}
              href={item.href}
              className="flex flex-col items-center justify-center text-xs"
            >
              <Icon
                size={20}
                className={active ? 'text-[#00FFB2]' : 'text-[#9CA3AF]'}
                style={
                  active
                    ? { textShadow: '0 0 12px rgba(0,255,178,0.9)' }
                    : {}
                }
              />
              <span
                className={`mt-1 ${
                  active ? 'text-[#00FFB2]' : 'text-[#9CA3AF]'
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
