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
import { useRBAC } from '@/hooks/useRBAC';
import { cn } from '@/lib/utils';

const allNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['owner'] },
  { name: 'My Dashboard', href: '/member', icon: Home, roles: ['member'] },
  { name: 'Members', href: '/members', icon: Users, roles: ['owner'] },
  { name: 'Contributions', href: '/contributions', icon: DollarSign, roles: ['owner', 'member'] },
  { name: 'Loans', href: '/loans', icon: Banknote, roles: ['owner', 'member'] },
  { name: 'Fines', href: '/fines', icon: AlertCircle, roles: ['owner'] },
  { name: 'Meetings', href: '/meetings', icon: Calendar, roles: ['owner'] },
  { name: 'Announcements', href: '/announcements', icon: Megaphone, roles: ['owner', 'member'] },
  { name: 'Reminders', href: '/reminders', icon: Clock, roles: ['owner', 'member'] },
  { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['owner'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['owner', 'member'] },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { role } = useRBAC();

  // Filter nav items based on user role (showing top 5 most important for mobile)
  const navItems = allNavItems
    .filter((item) => role && item.roles.includes(role as any))
    .slice(0, 5); // Show only first 5 items on mobile

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
