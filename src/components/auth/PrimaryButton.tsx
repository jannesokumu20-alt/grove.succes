interface PrimaryButtonProps {
  text: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export function PrimaryButton({
  text,
  onClick,
  type = 'button',
  disabled = false,
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors text-base"
    >
      {text}
    </button>
  );
}
