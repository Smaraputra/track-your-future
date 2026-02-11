'use client';

import { Briefcase, Activity, Phone, Trophy } from 'lucide-react';
import type { Tier } from '@/lib/billing/plans';
import { StatCard } from './stat-card';
import { StaleAppsList } from './stale-apps-list';
import { ActivityFeed } from './activity-feed';
import { QuickLinks } from './quick-links';
import { UpgradeCta } from './upgrade-cta';

interface DashboardStats {
  total: number;
  active: number;
  interviews: number;
  offers: number;
}

interface StaleApp {
  id: string;
  companyName: string;
  jobTitle: string;
  currentStatus: string;
  updatedAt: string;
  roleCategoryName: string | null;
  roleCategoryColor: string | null;
}

interface ActivityItem {
  id: string;
  applicationId: string;
  fromStatus: string | null;
  toStatus: string;
  changedAt: string;
  companyName: string;
  jobTitle: string;
}

interface RoleCategory {
  id: string;
  name: string;
  color: string | null;
  appCount: number;
}

interface DashboardContentProps {
  stats: DashboardStats;
  staleApps: StaleApp[];
  recentActivity: ActivityItem[];
  roleCategories: RoleCategory[];
  tier: Tier;
}

export function DashboardContent({
  stats,
  staleApps,
  recentActivity,
  roleCategories,
  tier,
}: DashboardContentProps) {
  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <p className="font-body text-muted-foreground text-xs">user@tyf:~$ cat /sys/status</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total Applications"
          value={stats.total}
          icon={<Briefcase className="size-5" />}
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={<Activity className="size-5" />}
        />
        <StatCard
          label="Interviews"
          value={stats.interviews}
          icon={<Phone className="size-5" />}
        />
        <StatCard
          label="Offers"
          value={stats.offers}
          icon={<Trophy className="size-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* Stale apps */}
          {staleApps.length > 0 && (
            <section>
              <p className="font-body text-muted-foreground text-xs mb-1">user@tyf:~$ cat /var/log/alerts</p>
              <h2 className="font-heading text-primary text-shadow-glow mb-3 text-sm">
                Needs Attention ({staleApps.length})
              </h2>
              <StaleAppsList apps={staleApps} />
            </section>
          )}

          {/* Recent activity */}
          <section>
            <p className="font-body text-muted-foreground text-xs mb-1">user@tyf:~$ tail -f /var/log/activity</p>
            <h2 className="font-heading text-primary text-shadow-glow mb-3 text-sm">
              Recent Activity
            </h2>
            <ActivityFeed items={recentActivity} />
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Role categories */}
          <section>
            <p className="font-body text-muted-foreground text-xs mb-1">user@tyf:~$ ls /sys/roles/</p>
            <h2 className="font-heading text-primary text-shadow-glow mb-3 text-sm">
              Roles
            </h2>
            <QuickLinks roleCategories={roleCategories} />
          </section>

          {/* Upgrade CTA for free users */}
          {tier === 'free' && <UpgradeCta />}
        </div>
      </div>
    </div>
  );
}
