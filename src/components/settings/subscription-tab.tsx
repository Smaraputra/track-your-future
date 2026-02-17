'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { RetroButton } from '@/components/retro-button';

interface SubscriptionTabProps {
  subscription: {
    tier: 'free' | 'pro';
    status: string | null;
    trialEnd: string | null;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
  };
  billingDisabled?: boolean;
}

export function SubscriptionTab({ subscription, billingDisabled = false }: SubscriptionTabProps) {
  const [loading, setLoading] = useState(false);

  const handlePortal = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // portal error
    } finally {
      setLoading(false);
    }
  }, []);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-primary text-sm">Current Plan</h3>
        <div className="border-border mt-2 space-y-2 rounded-md border p-4">
          <div className="flex items-center justify-between">
            <span className="font-body text-muted-foreground text-sm">Plan</span>
            <span className="font-body text-foreground text-sm font-medium uppercase">
              {billingDisabled ? 'Pro (Free Access)' : subscription.tier}
            </span>
          </div>

          {billingDisabled ? (
            <p className="font-body text-muted-foreground text-xs">
              All features are currently unlocked at no cost.
            </p>
          ) : (
            <>
              {subscription.status && (
                <div className="flex items-center justify-between">
                  <span className="font-body text-muted-foreground text-sm">Status</span>
                  <span className="font-body text-foreground text-sm capitalize">
                    {subscription.status}
                  </span>
                </div>
              )}

              {subscription.trialEnd && (
                <div className="flex items-center justify-between">
                  <span className="font-body text-muted-foreground text-sm">Trial ends</span>
                  <span className="font-body text-foreground text-sm">
                    {formatDate(subscription.trialEnd)}
                  </span>
                </div>
              )}

              {subscription.currentPeriodEnd && (
                <div className="flex items-center justify-between">
                  <span className="font-body text-muted-foreground text-sm">
                    {subscription.cancelAtPeriodEnd ? 'Access until' : 'Renews on'}
                  </span>
                  <span className="font-body text-foreground text-sm">
                    {formatDate(subscription.currentPeriodEnd)}
                  </span>
                </div>
              )}

              {subscription.cancelAtPeriodEnd && (
                <p className="font-body text-destructive text-xs">
                  Subscription will cancel at end of period
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {!billingDisabled && (
        <div className="flex gap-2">
          {subscription.tier === 'free' ? (
            <RetroButton asChild>
              <Link href="/pricing">Upgrade to Pro</Link>
            </RetroButton>
          ) : (
            <RetroButton onClick={handlePortal} disabled={loading}>
              {loading ? 'Loading...' : 'Manage Subscription'}
            </RetroButton>
          )}
        </div>
      )}

      <div>
        <h3 className="font-heading text-primary text-sm">AI Usage (This Month)</h3>
        <AiUsageDisplay />
      </div>
    </div>
  );
}

function AiUsageDisplay() {
  const [usage, setUsage] = useState<Array<{ feature: string; count: number }> | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadUsage = useCallback(async () => {
    if (loaded) return;
    try {
      const res = await fetch('/api/settings/ai-usage');
      if (res.ok) {
        const data = await res.json();
        setUsage(data.usage);
      }
    } catch {
      // silent
    } finally {
      setLoaded(true);
    }
  }, [loaded]);

  if (!loaded) {
    return (
      <RetroButton variant="ghost" size="sm" onClick={loadUsage} className="mt-2">
        Load AI Usage
      </RetroButton>
    );
  }

  if (!usage || usage.length === 0) {
    return (
      <p className="font-body text-muted-foreground mt-2 text-sm">
        No AI usage this month
      </p>
    );
  }

  const featureLabels: Record<string, string> = {
    parse: 'CV Parsing',
    jd_extraction: 'JD Extraction',
    match: 'Match Scoring',
    cover_letter: 'Cover Letters',
    interview_prep: 'Interview Prep',
    resume_suggestions: 'Resume Suggestions',
  };

  return (
    <div className="border-border mt-2 space-y-1 rounded-md border p-3">
      {usage.map((u) => (
        <div key={u.feature} className="flex items-center justify-between">
          <span className="font-body text-muted-foreground text-xs">
            {featureLabels[u.feature] ?? u.feature}
          </span>
          <span className="font-body text-foreground text-xs">{u.count}</span>
        </div>
      ))}
    </div>
  );
}
