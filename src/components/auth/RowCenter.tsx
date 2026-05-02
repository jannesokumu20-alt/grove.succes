import { ReactNode } from 'react';

interface RowCenterProps {
  text: string;
  link: {
    text: string;
    onClick?: () => void;
  };
}

export function RowCenter({ text, link }: RowCenterProps) {
  return (
    <p className="text-center text-slate-400 text-sm">
      {text}{' '}
      <button
        onClick={link.onClick}
        className="text-green-500 hover:text-green-400 font-medium transition-colors"
      >
        {link.text}
      </button>
    </p>
  );
}
