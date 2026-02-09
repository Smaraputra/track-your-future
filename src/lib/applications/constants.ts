import { STATUS_COLORS, STATUS_LABELS } from '@/components/retro-status-badge';

export const APPLICATION_STATUSES = [
  'draft',
  'applied',
  'phone_screen',
  'interview',
  'offer',
  'rejected',
  'ghosted',
  'withdrawn',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface StatusConfig {
  label: string;
  order: number;
  colorClass: string;
  isTerminal: boolean;
}

export const STATUS_CONFIG: Record<ApplicationStatus, StatusConfig> = {
  draft: { label: 'Draft', order: 0, colorClass: STATUS_COLORS.draft, isTerminal: false },
  applied: { label: 'Applied', order: 1, colorClass: STATUS_COLORS.applied, isTerminal: false },
  phone_screen: { label: 'Phone Screen', order: 2, colorClass: STATUS_COLORS.phone_screen, isTerminal: false },
  interview: { label: 'Interview', order: 3, colorClass: STATUS_COLORS.interview, isTerminal: false },
  offer: { label: 'Offer', order: 4, colorClass: STATUS_COLORS.offer, isTerminal: true },
  rejected: { label: 'Rejected', order: 5, colorClass: STATUS_COLORS.rejected, isTerminal: true },
  ghosted: { label: 'Ghosted', order: 6, colorClass: STATUS_COLORS.ghosted, isTerminal: true },
  withdrawn: { label: 'Withdrawn', order: 7, colorClass: STATUS_COLORS.withdrawn, isTerminal: true },
};

export { STATUS_COLORS, STATUS_LABELS };
