'use client';

import { Badge } from '@/components/ui/badge';

const TYPE_LABELS: Record<string, string> = {
  cv: 'CV',
  cover_letter: 'Cover Letter',
  summary: 'Summary',
  custom: 'Custom',
};

interface DocumentTypeBadgeProps {
  documentType: string;
  customTypeName?: string | null;
}

export function DocumentTypeBadge({ documentType, customTypeName }: DocumentTypeBadgeProps) {
  const label = documentType === 'custom' && customTypeName
    ? customTypeName
    : TYPE_LABELS[documentType] ?? documentType;

  return (
    <Badge variant="outline" className="font-body text-xs">
      {label}
    </Badge>
  );
}
