'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'green' | 'red' | 'blue' | 'indigo' | 'purple';
  trend?: number;
  trendLabel?: string;
}

const colorMap = {
  green: 'bg-gradient-to-br from-green-900/40 to-green-900/20 border-green-700/50 text-green-400 shadow-lg shadow-green-900/20',
  red: 'bg-gradient-to-br from-red-900/40 to-red-900/20 border-red-700/50 text-red-400 shadow-lg shadow-red-900/20',
  blue: 'bg-gradient-to-br from-blue-900/40 to-blue-900/20 border-blue-700/50 text-blue-400 shadow-lg shadow-blue-900/20',
  indigo: 'bg-gradient-to-br from-indigo-900/40 to-indigo-900/20 border-indigo-700/50 text-indigo-400 shadow-lg shadow-indigo-900/20',
  purple: 'bg-gradient-to-br from-purple-900/40 to-purple-900/20 border-purple-700/50 text-purple-400 shadow-lg shadow-purple-900/20',
};

const iconColorMap = {
  green: 'text-green-400',
  red: 'text-red-400',
  blue: 'text-blue-400',
  indigo: 'text-indigo-400',
  purple: 'text-purple-400',
};

export default function SummaryCard({
  title,
  value,
  icon,
  color,
  trend,
  trendLabel,
}: SummaryCardProps) {
  const isPositive = trend && trend > 0;

  return (
    <div className={cn('p-5 rounded-lg border backdrop-blur-sm transition-all duration-300 hover:shadow-lg', colorMap[color])} style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '120px'
    }}>
      <div className="flex items-start justify-between flex-1">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-white mt-2">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              {isPositive ? (
                <TrendingUp size={14} className="text-green-400" />
              ) : (
                <TrendingDown size={14} className="text-red-400" />
              )}
              <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
                {Math.abs(trend)}% {trendLabel || 'vs last month'}
              </span>
            </div>
          )}
        </div>
        <div className={cn('text-4xl opacity-70 flex-shrink-0 ml-3', iconColorMap[color])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
