import { ROLE_COLORS } from '@/lib/roles/constants';

interface RoleColorBadgeProps {
  color: string | null;
  className?: string;
}

export function RoleColorBadge({ color, className }: RoleColorBadgeProps) {
  const label = ROLE_COLORS.find((c) => c.value === color)?.label ?? 'Custom';

  return (
    <span className={className} title={label}>
      <span
        className="inline-block size-3 rounded-full"
        style={{ backgroundColor: color ?? '#6b7280' }}
      />
    </span>
  );
}
