'use client';

import Link from 'next/link';
import type { Tier } from '@/lib/billing/plans';

interface DateRangeInfoProps {
  tier: Tier;
  dateFilter: string | null;
}

export function DateRangeInfo({ tier, dateFilter }: DateRangeInfoProps) {
  if (tier === 'pro') {
    return (
      <p className="font-body text-muted-foreground text-xs">
        Showing all-time data.
      </p>
    );
  }

  const startDate = dateFilter ? new Date(dateFilter) : new Date();
  const monthName = startDate.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <p className="font-body text-muted-foreground text-xs">
      Showing data for {monthName} only.{' '}
      <Link href="/pricing" className="text-primary hover:underline">
        Upgrade to Pro
      </Link>{' '}
      for all-time analytics.
    </p>
  );
}
