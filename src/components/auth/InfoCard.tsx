import { ReactNode } from 'react';

interface InfoCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

export function InfoCard({ icon, title, subtitle }: InfoCardProps) {
  return (
    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 flex gap-3">
      <div className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
