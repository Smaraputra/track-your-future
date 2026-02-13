'use client';

import { cn } from '@/lib/utils';
import { useBootContext } from '@/components/boot-sequence';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: 0 | 200 | 400 | 600 | 800;
}

export function Reveal({
  children,
  className,
  delay = 0,
}: RevealProps) {
  const { wasBooted } = useBootContext();

  // If user didn't watch boot this session, show content immediately
  if (!wasBooted) {
    return <div className={className}>{children}</div>;
  }

  // Map delay to CSS class
  const delayClass = `delay-${delay}` as const;

  return (
    <div
      className={cn(
        'animate-fade-in-up',
        delayClass,
        className
      )}
    >
      {children}
    </div>
  );
}
