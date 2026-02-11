import { cn } from '@/lib/utils';

interface TypewriterTextProps {
  text: string;
  className?: string;
}

export function TypewriterText({ text, className }: TypewriterTextProps) {
  return (
    <span
      className={cn('typewriter', className)}
      style={{ '--char-count': text.length } as React.CSSProperties}
      aria-label={text}
    >
      {text}
    </span>
  );
}
