export interface RoleColor {
  value: string;
  label: string;
}

export const ROLE_COLORS: RoleColor[] = [
  { value: '#22c55e', label: 'Green' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#ef4444', label: 'Red' },
  { value: '#a855f7', label: 'Purple' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#f97316', label: 'Orange' },
];

export const DEFAULT_ROLE_COLOR = ROLE_COLORS[0].value;
