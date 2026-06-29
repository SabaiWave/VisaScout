'use client';

import { Slot } from '@radix-ui/react-slot';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ButtonHTMLAttributes, CSSProperties, forwardRef } from 'react';

function cn(...args: Parameters<typeof clsx>) {
  return twMerge(clsx(args));
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning' | 'admin';
type Size = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'text-center font-bold uppercase tracking-wider rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed',
  secondary:
    'text-center font-bold uppercase tracking-wider rounded-lg border transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed',
  ghost:
    'text-center font-bold uppercase tracking-wider rounded-lg border transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed',
  danger:
    'text-center font-bold uppercase tracking-wider rounded border transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed',
  warning:
    'text-center font-bold uppercase tracking-wider rounded border transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed',
  admin:
    'text-center font-bold uppercase tracking-wider rounded border transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed',
};

const variantStyles: Record<Variant, CSSProperties> = {
  primary: {
    background: 'var(--color-secondary)',
    color: '#ffffff',
    fontFamily: 'var(--font-mono)',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--color-text-primary)',
    borderColor: 'var(--color-border-strong)',
    fontFamily: 'var(--font-mono)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    borderColor: 'var(--color-border)',
    fontFamily: 'var(--font-mono)',
  },
  danger: {
    background: 'rgba(239,68,68,0.08)',
    color: 'var(--color-error)',
    borderColor: 'rgba(239,68,68,0.4)',
    fontFamily: 'var(--font-mono)',
  },
  warning: {
    background: 'rgba(245,158,11,0.08)',
    color: 'var(--color-amber)',
    borderColor: 'rgba(245,158,11,0.4)',
    fontFamily: 'var(--font-mono)',
  },
  admin: {
    background: 'rgba(99,102,241,0.08)',
    color: 'var(--color-secondary-light)',
    borderColor: 'rgba(99,102,241,0.3)',
    fontFamily: 'var(--font-mono)',
  },
};

const sizeClasses: Record<Size, string> = {
  xs: 'text-[0.65rem] px-[0.6rem] py-[0.2rem]',
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-8 py-4',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', asChild = false, className, style, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref as React.Ref<HTMLButtonElement>}
        className={cn(variantClasses[variant], sizeClasses[size], className)}
        style={{ ...variantStyles[variant], ...style }}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
