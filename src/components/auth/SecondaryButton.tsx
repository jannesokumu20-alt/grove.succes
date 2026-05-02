import { ReactNode } from 'react';

interface SecondaryButtonProps {
  text: string;
  icon?: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

export function SecondaryButton({
  text,
  icon,
  onClick,
  type = 'button',
}: SecondaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="w-full py-4 border border-slate-700 rounded-lg text-white font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-3"
    >
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <span>{text}</span>
    </button>
  );
}
