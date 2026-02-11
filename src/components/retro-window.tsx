import { cn } from '@/lib/utils';

interface RetroWindowProps extends React.ComponentProps<'div'> {
  title?: string;
}

export function RetroWindow({
  title,
  className,
  children,
  ...props
}: RetroWindowProps) {
  return (
    <div
      className={cn('border-border bg-surface rounded-md border crt-screen', className)}
      {...props}
    >
      <div className="border-border flex items-center gap-2 border-b px-3 py-2">
        <div className="flex gap-1.5">
          <span className="block size-2.5 rounded-full bg-red-500" />
          <span className="block size-2.5 rounded-full bg-yellow-500" />
          <span className="block size-2.5 rounded-full bg-green-500" />
        </div>
        {title && (
          <span className="font-heading text-muted-foreground text-sm">
            {title}
          </span>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
