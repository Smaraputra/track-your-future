import { cn } from '@/lib/utils';

interface AuthMessageProps {
  variant: 'success' | 'error';
  message: string;
}

export function AuthMessage({ variant, message }: AuthMessageProps) {
  return (
    <div
      className={cn(
        'font-body rounded-md border px-3 py-2 text-sm',
        variant === 'success' && 'border-primary/50 text-primary bg-primary/5',
        variant === 'error' && 'border-destructive/50 text-destructive bg-destructive/5',
      )}
    >
      {message}
    </div>
  );
}
