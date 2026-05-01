'use client';

import { useAuth } from '@/hooks/useAuth';
import Button from './Button';
import { LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 right-0 left-0 lg:left-64 bg-slate-900 border-b border-slate-800 z-40">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">Logged in as</p>
          <p className="text-white font-medium">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          icon={<LogOut size={16} />}
        >
          Logout
        </Button>
      </div>
    </nav>
  );
}
