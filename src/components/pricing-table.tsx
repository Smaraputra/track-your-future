'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RetroWindow } from '@/components/retro-window';
import { RetroButton } from '@/components/retro-button';
import { PLAN_LIMITS, PRICES } from '@/lib/billing/plans';
import type { Tier } from '@/lib/billing/plans';

interface PricingTableProps {
  currentTier: Tier;
  isAuthenticated: boolean;
}

function formatLimit(value: number | null): string {
  if (value === null) return 'Unlimited';
  return String(value);
}

function formatStorage(bytes: number | null): string {
  if (bytes === null) return 'Unlimited';
  if (bytes >= 1024 * 1024 * 1024) return `${bytes / (1024 * 1024 * 1024)} GB`;
  return `${bytes / (1024 * 1024)} MB`;
}

export function PricingTable({
  currentTier,
  isAuthenticated,
}: PricingTableProps) {
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const price =
    interval === 'monthly'
      ? PRICES.monthly.amountCents / 100
      : PRICES.annual.amountCents / 100;
  const perMonth =
    interval === 'monthly' ? price : Math.round((price / 12) * 100) / 100;

  async function handleSubscribe() {
    if (!isAuthenticated) {
      router.push('/register');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleStartTrial() {
    if (!isAuthenticated) {
      router.push('/register');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/billing/trial', { method: 'POST' });
      if (res.ok) {
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }

  const free = PLAN_LIMITS.free;
  const pro = PLAN_LIMITS.pro;

  const resources: Array<{
    label: string;
    free: string;
    pro: string;
  }> = [
    {
      label: 'Applications',
      free: formatLimit(free.resources.applications),
      pro: formatLimit(pro.resources.applications),
    },
    {
      label: 'Documents',
      free: formatLimit(free.resources.documents),
      pro: formatLimit(pro.resources.documents),
    },
    {
      label: 'Role Categories',
      free: formatLimit(free.resources.roleCategories),
      pro: formatLimit(pro.resources.roleCategories),
    },
    {
      label: 'Form Templates',
      free: formatLimit(free.resources.formFieldTemplates),
      pro: formatLimit(pro.resources.formFieldTemplates),
    },
    {
      label: 'Storage',
      free: formatStorage(free.resources.storageBytes),
      pro: formatStorage(pro.resources.storageBytes),
    },
  ];

  const aiFeatures: Array<{
    label: string;
    free: string;
    pro: string;
  }> = [
    {
      label: 'CV Parses / mo',
      free: formatLimit(free.ai.parse),
      pro: formatLimit(pro.ai.parse),
    },
    {
      label: 'JD Extractions / mo',
      free: formatLimit(free.ai.jd_extraction),
      pro: formatLimit(pro.ai.jd_extraction),
    },
    {
      label: 'Match Scores / mo',
      free: formatLimit(free.ai.match),
      pro: formatLimit(pro.ai.match),
    },
    {
      label: 'Cover Letters / mo',
      free: formatLimit(free.ai.cover_letter),
      pro: formatLimit(pro.ai.cover_letter),
    },
    {
      label: 'Interview Prep / mo',
      free: formatLimit(free.ai.interview_prep),
      pro: formatLimit(pro.ai.interview_prep),
    },
    {
      label: 'Resume Suggestions / mo',
      free: formatLimit(free.ai.resume_suggestions),
      pro: formatLimit(pro.ai.resume_suggestions),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Interval toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setInterval('monthly')}
          className={`font-body cursor-pointer text-sm transition-colors ${
            interval === 'monthly'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Monthly
        </button>
        <span className="text-muted-foreground font-body text-sm">/</span>
        <button
          onClick={() => setInterval('annual')}
          className={`font-body cursor-pointer text-sm transition-colors ${
            interval === 'annual'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Annual
        </button>
        {interval === 'annual' && (
          <span className="border-primary text-primary rounded-sm border px-1.5 py-0.5 text-xs">
            Save 27%
          </span>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Free Plan */}
        <RetroWindow title="plan://free">
          <div className="space-y-4">
            <div>
              <h3 className="font-heading text-foreground text-2xl">Free</h3>
              <p className="font-body text-muted-foreground text-sm">
                Get started with job tracking
              </p>
            </div>
            <div className="font-heading text-foreground text-3xl">
              $0
              <span className="font-body text-muted-foreground text-sm">
                {' '}
                / forever
              </span>
            </div>
            {currentTier === 'free' ? (
              <RetroButton variant="secondary" disabled className="w-full">
                Current Plan
              </RetroButton>
            ) : (
              <RetroButton
                variant="secondary"
                className="w-full"
                disabled
              >
                Included
              </RetroButton>
            )}
          </div>
        </RetroWindow>

        {/* Pro Plan */}
        <RetroWindow
          title="plan://pro"
          className="border-primary/50"
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-heading text-primary text-2xl">Pro</h3>
              <p className="font-body text-muted-foreground text-sm">
                Full power for serious job seekers
              </p>
            </div>
            <div className="font-heading text-foreground text-3xl">
              ${perMonth}
              <span className="font-body text-muted-foreground text-sm">
                {' '}
                / month
              </span>
              {interval === 'annual' && (
                <span className="font-body text-muted-foreground block text-xs">
                  ${price} billed annually
                </span>
              )}
            </div>
            {currentTier === 'pro' ? (
              <RetroButton variant="secondary" disabled className="w-full">
                Current Plan
              </RetroButton>
            ) : (
              <div className="flex gap-2">
                <RetroButton
                  variant="primary"
                  className="flex-1"
                  onClick={handleStartTrial}
                  disabled={loading}
                >
                  Start Free Trial
                </RetroButton>
                <RetroButton
                  variant="secondary"
                  className="flex-1"
                  onClick={handleSubscribe}
                  disabled={loading}
                >
                  Subscribe
                </RetroButton>
              </div>
            )}
            <p className="font-body text-muted-foreground text-center text-xs">
              {PRICES.trialDays}-day free trial, no credit card required
            </p>
          </div>
        </RetroWindow>
      </div>

      {/* Comparison table */}
      <RetroWindow title="comparison://features">
        <div className="space-y-4">
          <div>
            <h4 className="font-heading text-foreground mb-2 text-lg">
              Resources
            </h4>
            <table className="w-full">
              <thead>
                <tr className="border-border border-b">
                  <th className="font-body text-muted-foreground py-1.5 text-left text-xs font-normal">
                    Feature
                  </th>
                  <th className="font-body text-muted-foreground py-1.5 text-center text-xs font-normal">
                    Free
                  </th>
                  <th className="font-body text-primary py-1.5 text-center text-xs font-normal">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {resources.map((row) => (
                  <tr key={row.label} className="border-border/50 border-b">
                    <td className="font-body text-foreground py-1.5 text-sm">
                      {row.label}
                    </td>
                    <td className="font-body text-muted-foreground py-1.5 text-center text-sm">
                      {row.free}
                    </td>
                    <td className="font-body text-foreground py-1.5 text-center text-sm">
                      {row.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h4 className="font-heading text-foreground mb-2 text-lg">
              AI Features
            </h4>
            <table className="w-full">
              <thead>
                <tr className="border-border border-b">
                  <th className="font-body text-muted-foreground py-1.5 text-left text-xs font-normal">
                    Feature
                  </th>
                  <th className="font-body text-muted-foreground py-1.5 text-center text-xs font-normal">
                    Free
                  </th>
                  <th className="font-body text-primary py-1.5 text-center text-xs font-normal">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {aiFeatures.map((row) => (
                  <tr key={row.label} className="border-border/50 border-b">
                    <td className="font-body text-foreground py-1.5 text-sm">
                      {row.label}
                    </td>
                    <td className="font-body text-muted-foreground py-1.5 text-center text-sm">
                      {row.free}
                    </td>
                    <td className="font-body text-foreground py-1.5 text-center text-sm">
                      {row.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </RetroWindow>
    </div>
  );
}
