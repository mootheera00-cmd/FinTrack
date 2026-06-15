import React from 'react';
import { clsx } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:     'bg-neutral-900 hover:bg-neutral-800 text-white active:bg-neutral-800',
  secondary:   'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200',
  ghost:       'bg-transparent hover:bg-neutral-100 text-neutral-600',
  destructive: 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-xl min-h-[36px]',
  md: 'px-4 py-2.5 text-sm rounded-2xl min-h-[44px]',
  lg: 'px-6 py-3.5 text-base rounded-2xl min-h-[52px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold',
        'transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
