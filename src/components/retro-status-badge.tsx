import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  draft: 'border-dimmed text-dimmed',
  applied: 'border-primary text-primary',
  phone_screen: 'border-cyan-500 text-cyan-500',
  interview: 'border-blue-500 text-blue-500',
  offer: 'border-green-500 text-green-500',
  rejected: 'border-red-500 text-red-500',
  ghosted: 'border-gray-500 text-gray-500',
  withdrawn: 'border-yellow-500 text-yellow-500',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  applied: 'Applied',
  phone_screen: 'Phone Screen',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  ghosted: 'Ghosted',
  withdrawn: 'Withdrawn',
};

interface RetroStatusBadgeProps extends React.ComponentProps<'span'> {
  status: string;
}

export function RetroStatusBadge({
  status,
  className,
  ...props
}: RetroStatusBadgeProps) {
  const colors = STATUS_COLORS[status] ?? 'border-dimmed text-dimmed';
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span
      className={cn(
        'font-body inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium',
        colors,
        className
      )}
      {...props}
    >
      {label}
    </span>
  );
}

export { STATUS_COLORS, STATUS_LABELS };
