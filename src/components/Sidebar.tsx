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
} from 'lucide-react';
import { useChamaStore } from '@/store/useChamaStore';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Contributions', href: '/contributions', icon: DollarSign },
  { name: 'Loans', href: '/loans', icon: Banknote },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const chama = useChamaStore((state) => state.chama);

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-grove-accent">🌿 Grove</h1>
        <p className="text-xs text-slate-400 mt-1">Tech-Powered Savings</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition',
                isActive
                  ? 'bg-grove-primary text-white'
                  : 'text-slate-400 hover:bg-slate-800'
              )}
            >
              <Icon size={20} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Chama Info */}
      <div className="border-t border-slate-800 p-4">
        {chama && (
          <div className="text-xs">
            <p className="text-slate-500 mb-1">Current Chama</p>
            <p className="text-white font-semibold">{chama.name}</p>
            <p className="text-slate-400 mt-2">Code: {chama.invite_code}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
