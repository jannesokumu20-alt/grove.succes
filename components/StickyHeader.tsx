'use client';

import { Bell } from 'lucide-react';

export default function StickyHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div
      className="fixed top-0 left-0 w-full z-40 md:left-64"
      style={{
        background: 'rgba(10,15,28,0.85)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {subtitle && (
            <p className="text-[#9CA3AF] text-xs">{subtitle}</p>
          )}
        </div>

        <div className="relative">
          <Bell className="text-[#9CA3AF]" size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-[#00FFB2] rounded-full" />
        </div>
      </div>
    </div>
  );
}
