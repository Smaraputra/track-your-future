import { cn } from '@/lib/utils';

export function RetroInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'font-body placeholder:text-muted-foreground border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm transition-[color,box-shadow] outline-none',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:shadow-[0_0_8px_var(--primary)]',
        'disabled:pointer-events-none disabled:opacity-50',
        'caret-primary',
        className
      )}
      {...props}
    />
  );
}
