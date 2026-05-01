'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  DollarSign,
  Banknote,
  BarChart3,
  Settings,
  AlertCircle,
  Calendar,
  Megaphone,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Contributions', href: '/contributions', icon: DollarSign },
  { name: 'Loans', href: '/loans', icon: Banknote },
  { name: 'Fines', href: '/fines', icon: AlertCircle },
  { name: 'Meetings', href: '/meetings', icon: Calendar },
  { name: 'Announcements', href: '/announcements', icon: Megaphone },
  { name: 'Reminders', href: '/reminders', icon: Clock },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-slate-900 border-t border-slate-800 z-40">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-3 flex-1 transition',
                isActive ? 'text-grove-accent' : 'text-slate-400'
              )}
            >
              <Icon size={20} />
              <span className="text-xs font-medium hidden">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
