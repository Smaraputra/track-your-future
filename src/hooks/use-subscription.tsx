'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Tier } from '@/lib/billing/plans';

export interface SubscriptionContextValue {
  tier: Tier;
  status: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}

const defaultValue: SubscriptionContextValue = {
  tier: 'free',
  status: null,
  trialEnd: null,
  cancelAtPeriodEnd: false,
  currentPeriodEnd: null,
};

const SubscriptionContext =
  createContext<SubscriptionContextValue>(defaultValue);

export function SubscriptionProvider({
  children,
  value,
}: {
  children: ReactNode;
  value?: SubscriptionContextValue;
}) {
  return (
    <SubscriptionContext.Provider value={value ?? defaultValue}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  return useContext(SubscriptionContext);
}
