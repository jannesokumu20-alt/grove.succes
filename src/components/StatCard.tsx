'use client';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'emerald' | 'blue' | 'cyan' | 'orange' | 'purple';
  trend?: number;
  trendLabel?: string;
}

const colorMap = {
  emerald: 'from-emerald-900/40 to-emerald-900/20 border-emerald-700/50 hover:border-emerald-600/70',
  blue: 'from-blue-900/40 to-blue-900/20 border-blue-700/50 hover:border-blue-600/70',
  cyan: 'from-cyan-900/40 to-cyan-900/20 border-cyan-700/50 hover:border-cyan-600/70',
  orange: 'from-orange-900/40 to-orange-900/20 border-orange-700/50 hover:border-orange-600/70',
  purple: 'from-purple-900/40 to-purple-900/20 border-purple-700/50 hover:border-purple-600/70',
};

const iconColorMap = {
  emerald: 'text-emerald-400',
  blue: 'text-blue-400',
  cyan: 'text-cyan-400',
  orange: 'text-orange-400',
  purple: 'text-purple-400',
};

export default function StatCard({
  title,
  value,
  icon,
  color,
  trend,
  trendLabel,
}: StatCardProps) {
  return (
    <div
      className={`bg-gradient-to-br ${colorMap[color]} border rounded-lg p-6 transition`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg bg-slate-800/50 flex items-center justify-center ${iconColorMap[color]}`}>
          {icon}
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-2 text-xs">
          <span className={trend > 0 ? 'text-emerald-400' : 'text-red-400'}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-slate-400">{trendLabel || 'vs last month'}</span>
        </div>
      )}
    </div>
  );
}
