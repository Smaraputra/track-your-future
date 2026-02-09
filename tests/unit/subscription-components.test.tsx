import { readFileSync } from 'fs';
import { resolve } from 'path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  SubscriptionProvider,
  useSubscription,
} from '@/hooks/use-subscription';
import { PastDueBanner } from '@/components/past-due-banner';

const ROOT = resolve(__dirname, '../..');

function SubscriptionDisplay() {
  const sub = useSubscription();
  return (
    <div>
      <span data-testid="tier">{sub.tier}</span>
      <span data-testid="status">{sub.status ?? 'none'}</span>
    </div>
  );
}

describe('SubscriptionProvider', () => {
  it('provides default free tier without explicit value', () => {
    render(
      <SubscriptionProvider>
        <SubscriptionDisplay />
      </SubscriptionProvider>,
    );
    expect(screen.getByTestId('tier').textContent).toBe('free');
    expect(screen.getByTestId('status').textContent).toBe('none');
  });

  it('provides custom subscription value', () => {
    render(
      <SubscriptionProvider
        value={{
          tier: 'pro',
          status: 'active',
          trialEnd: null,
          cancelAtPeriodEnd: false,
          currentPeriodEnd: null,
        }}
      >
        <SubscriptionDisplay />
      </SubscriptionProvider>,
    );
    expect(screen.getByTestId('tier').textContent).toBe('pro');
    expect(screen.getByTestId('status').textContent).toBe('active');
  });
});

describe('useSubscription', () => {
  it('returns free tier as default outside provider', () => {
    render(<SubscriptionDisplay />);
    expect(screen.getByTestId('tier').textContent).toBe('free');
  });
});

describe('PastDueBanner', () => {
  it('does not render for free users', () => {
    const { container } = render(
      <SubscriptionProvider>
        <PastDueBanner />
      </SubscriptionProvider>,
    );
    expect(container.innerHTML).toBe('');
  });

  it('does not render for active pro users', () => {
    const { container } = render(
      <SubscriptionProvider
        value={{
          tier: 'pro',
          status: 'active',
          trialEnd: null,
          cancelAtPeriodEnd: false,
          currentPeriodEnd: null,
        }}
      >
        <PastDueBanner />
      </SubscriptionProvider>,
    );
    expect(container.innerHTML).toBe('');
  });

  it('does not render for trialing users', () => {
    const { container } = render(
      <SubscriptionProvider
        value={{
          tier: 'pro',
          status: 'trialing',
          trialEnd: new Date(Date.now() + 86400000).toISOString(),
          cancelAtPeriodEnd: false,
          currentPeriodEnd: null,
        }}
      >
        <PastDueBanner />
      </SubscriptionProvider>,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders warning banner for past_due users', () => {
    render(
      <SubscriptionProvider
        value={{
          tier: 'pro',
          status: 'past_due',
          trialEnd: null,
          cancelAtPeriodEnd: false,
          currentPeriodEnd: null,
        }}
      >
        <PastDueBanner />
      </SubscriptionProvider>,
    );
    expect(screen.getByText(/payment failed/i)).toBeDefined();
    expect(screen.getByText('Update Payment')).toBeDefined();
  });
});

describe('Dashboard layout (source analysis)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/(dashboard)/layout.tsx'),
    'utf-8',
  );

  it('imports and uses SubscriptionProvider', () => {
    expect(source).toContain('SubscriptionProvider');
    expect(source).toContain('<SubscriptionProvider');
  });

  it('calls getUserSubscription', () => {
    expect(source).toContain('getUserSubscription');
    expect(source).toContain('session.user.id');
  });

  it('serializes dates to ISO strings', () => {
    expect(source).toContain('toISOString()');
  });

  it('includes PastDueBanner', () => {
    expect(source).toContain('PastDueBanner');
    expect(source).toContain('<PastDueBanner');
  });
});
