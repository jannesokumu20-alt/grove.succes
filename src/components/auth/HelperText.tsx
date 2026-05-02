interface HelperTextProps {
  text: string;
  color?: 'muted' | 'success' | 'error';
}

export function HelperText({ text, color = 'muted' }: HelperTextProps) {
  const colorClasses = {
    muted: 'text-slate-500',
    success: 'text-green-500',
    error: 'text-red-500',
  };

  return (
    <p className={`text-xs ${colorClasses[color]} mt-2`}>
      {text}
    </p>
  );
}
