'use client';

import type { Tier } from '@/lib/billing/plans';
import { StatusDistributionChart } from './status-distribution-chart';
import { ConversionFunnel } from './conversion-funnel';
import { RoleBreakdown } from './role-breakdown';
import { DateRangeInfo } from './date-range-info';

interface AnalyticsContentProps {
  statusDistribution: { status: string; count: number }[];
  funnelData: { stage: string; count: number }[];
  roleBreakdown: { name: string; color: string | null; count: number }[];
  tier: Tier;
  dateFilter: string | null;
}

export function AnalyticsContent({
  statusDistribution,
  funnelData,
  roleBreakdown,
  tier,
  dateFilter,
}: AnalyticsContentProps) {
  const hasData =
    statusDistribution.length > 0 ||
    funnelData.some((d) => d.count > 0) ||
    roleBreakdown.length > 0;

  return (
    <div className="space-y-6">
      <DateRangeInfo tier={tier} dateFilter={dateFilter} />

      {!hasData ? (
        <p className="font-body text-muted-foreground text-sm">
          No data to display. Create applications to see analytics.
        </p>
      ) : (
        <>
          <section>
            <h2 className="font-heading text-primary mb-3 text-sm">
              Status Distribution
            </h2>
            <StatusDistributionChart data={statusDistribution} />
          </section>

          <section>
            <h2 className="font-heading text-primary mb-3 text-sm">
              Conversion Funnel
            </h2>
            <ConversionFunnel data={funnelData} />
          </section>

          <section>
            <h2 className="font-heading text-primary mb-3 text-sm">
              By Role Category
            </h2>
            <RoleBreakdown data={roleBreakdown} />
          </section>
        </>
      )}
    </div>
  );
}
