import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'success' | 'danger' | 'outline' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variants = {
  primary: 'bg-bleu-rca text-white hover:bg-bleu-rca/90',
  gold: 'bg-or-solaire text-white hover:bg-or-solaire/90',
  success: 'bg-vert-espoir text-white hover:bg-vert-espoir/90',
  danger: 'bg-rouge-solidarite text-white hover:bg-rouge-solidarite/90',
  secondary: 'bg-bleu-ciel text-white hover:bg-bleu-ciel/90',
  outline: 'border-2 border-gray-200 text-gray-700 hover:bg-gray-50',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
};

const sizes = {
  small: 'px-3 py-1.5 text-sm',
  medium: 'px-4 py-2 text-base',
  large: 'px-6 py-3 text-lg font-semibold',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'medium',
      loading = false,
      icon,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={loading || disabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200 font-medium active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-bleu-rca/50',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          (loading || disabled) && 'opacity-60 cursor-not-allowed active:scale-100',
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" size={18} />}
        {!loading && icon && <span className="shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
