import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  rightText?: string;
  onBackClick?: () => void;
  showLogo?: boolean;
  subtitle?: string;
}

export function Header({
  title,
  showBack = false,
  rightText,
  onBackClick,
  showLogo = false,
  subtitle,
}: HeaderProps) {
  return (
    <div className="px-6 pt-4 pb-6 bg-slate-900 border-b border-slate-800">
      <div className="flex items-start justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={onBackClick}
              className="text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          {showLogo && (
            <h1 className="text-2xl font-bold text-green-500">✓ Grove</h1>
          )}
          {title && !showBack && (
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          )}
          {title && showBack && (
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          )}
        </div>

        {/* Right */}
        {rightText && (
          <span className="text-3xl flex-shrink-0">{rightText}</span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-slate-400 mt-1 ml-9">{subtitle}</p>
      )}
    </div>
  );
}
