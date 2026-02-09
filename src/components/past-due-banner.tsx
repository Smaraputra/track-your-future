'use client';

import { useSubscription } from '@/hooks/use-subscription';
import { RetroButton } from '@/components/retro-button';

export function PastDueBanner() {
  const { status } = useSubscription();

  if (status !== 'past_due') return null;

  async function handleUpdatePayment() {
    const res = await fetch('/api/billing/portal', { method: 'POST' });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <div className="border-destructive bg-destructive/10 flex items-center justify-between border-b px-4 py-2">
      <p className="font-body text-destructive text-sm">
        Your payment failed. Update your payment method to keep Pro features.
      </p>
      <RetroButton
        variant="destructive"
        size="sm"
        onClick={handleUpdatePayment}
      >
        Update Payment
      </RetroButton>
    </div>
  );
}
