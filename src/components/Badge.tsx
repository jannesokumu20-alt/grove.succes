'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'red' | 'blue' | 'yellow' | 'purple' | 'gray';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  className,
}) => {
  const variants = {
    green: 'bg-green-900 text-green-200',
    red: 'bg-red-900 text-red-200',
    blue: 'bg-blue-900 text-blue-200',
    yellow: 'bg-yellow-900 text-yellow-200',
    purple: 'bg-purple-900 text-purple-200',
    gray: 'bg-slate-700 text-slate-200',
  };

  return (
    <span
      className={cn(
        'px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
