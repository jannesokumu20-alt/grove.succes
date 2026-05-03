import { ReactNode } from 'react';

interface InputFieldProps {
  label: string;
  placeholder: string;
  type?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onRightIconClick?: () => void;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

export function InputField({
  label,
  placeholder,
  type = 'text',
  leftIcon,
  rightIcon,
  onRightIconClick,
  value,
  onChange,
  error,
}: InputFieldProps) {
  return (
    <div>
      <label className="block text-base font-medium text-white mb-3">
        {label}
      </label>
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-3.5">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full ${leftIcon ? 'pl-12' : 'pl-4'} ${rightIcon ? 'pr-12' : 'pr-4'} py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all`}
        />
        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {rightIcon}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}
