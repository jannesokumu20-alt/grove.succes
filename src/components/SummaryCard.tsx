'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'green' | 'red' | 'blue' | 'purple';
  trend?: number;
  trendLabel?: string;
}

const colorMap = {
  green: 'bg-green-900/20 border-green-800 text-green-400',
  red: 'bg-red-900/20 border-red-800 text-red-400',
  blue: 'bg-blue-900/20 border-blue-800 text-blue-400',
  purple: 'bg-purple-900/20 border-purple-800 text-purple-400',
};

const iconColorMap = {
  green: 'text-green-400',
  red: 'text-red-400',
  blue: 'text-blue-400',
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
    <div className={cn('p-6 rounded-lg border', colorMap[color])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
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
        <div className={cn('text-4xl opacity-50', iconColorMap[color])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
