import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...args: Parameters<typeof clsx>) {
  return twMerge(clsx(args));
}

type Size = 'sm' | 'md' | 'lg';
type HeadingTag = 'h1' | 'h2' | 'h3';

interface SectionHeadingProps {
  children: React.ReactNode;
  subtitle?: string;
  size?: Size;
  as?: HeadingTag;
  className?: string;
}

const sizeClasses: Record<Size, string> = {
  sm: 'text-lg sm:text-xl',
  md: 'text-xl sm:text-2xl',
  lg: 'text-2xl sm:text-3xl',
};

export function SectionHeading({
  children,
  subtitle,
  size = 'lg',
  as: Tag = 'h2',
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn(className)}>
      <Tag
        className={cn(sizeClasses[size], 'font-bold mb-3')}
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}
      >
        <span style={{ color: 'var(--color-secondary)', marginRight: '0.4rem' }}>//</span>
        {children}
      </Tag>
      <div
        className={cn('h-px section-heading-line', subtitle ? 'mb-4' : '')}
        style={{ background: 'linear-gradient(to right, rgba(99,102,241,0.5), transparent)' }}
      />
      {subtitle && (
        <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
