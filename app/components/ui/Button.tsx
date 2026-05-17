'use client';

import { Slot } from '@radix-ui/react-slot';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ButtonHTMLAttributes, CSSProperties, forwardRef } from 'react';

function cn(...args: Parameters<typeof clsx>) {
  return twMerge(clsx(args));
}

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

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
};

const sizeClasses: Record<Size, string> = {
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
