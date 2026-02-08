import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

const retroButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-body text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'border border-primary bg-transparent text-primary hover:bg-primary/10 hover:shadow-[0_0_12px_var(--primary)]',
        secondary:
          'border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'text-muted-foreground hover:text-foreground hover:bg-accent',
        destructive:
          'border border-destructive bg-transparent text-destructive hover:bg-destructive/10 hover:shadow-[0_0_12px_var(--destructive)]',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-10 px-6',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export type RetroButtonVariant = NonNullable<
  VariantProps<typeof retroButtonVariants>['variant']
>;

interface RetroButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof retroButtonVariants> {
  asChild?: boolean;
}

export function RetroButton({
  className,
  variant = 'primary',
  size = 'default',
  asChild = false,
  ...props
}: RetroButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      className={cn(retroButtonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { retroButtonVariants };
