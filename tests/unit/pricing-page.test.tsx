import { readFileSync } from 'fs';
import { resolve } from 'path';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PricingTable } from '@/components/pricing-table';

const ROOT = resolve(__dirname, '../..');

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('PricingTable (Stripe provider)', () => {
  it('renders Free and Pro plan headings', () => {
    render(
      <PricingTable currentTier="free" isAuthenticated={false} billingProvider="stripe" />,
    );
    expect(screen.getByRole('heading', { name: 'Free' })).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Pro' })).toBeDefined();
  });

  it('renders $0 for free plan', () => {
    render(
      <PricingTable currentTier="free" isAuthenticated={false} billingProvider="stripe" />,
    );
    expect(screen.getByText('$0')).toBeDefined();
  });

  it('renders monthly price for pro plan', () => {
    render(
      <PricingTable currentTier="free" isAuthenticated={false} billingProvider="stripe" />,
    );
    expect(screen.getByText('$9')).toBeDefined();
  });

  it('shows Current Plan button for current tier', () => {
    render(
      <PricingTable currentTier="free" isAuthenticated={true} billingProvider="stripe" />,
    );
    expect(screen.getAllByText('Current Plan').length).toBeGreaterThanOrEqual(1);
  });

  it('shows Current Plan for pro user on pro card', () => {
    render(
      <PricingTable currentTier="pro" isAuthenticated={true} billingProvider="stripe" />,
    );
    expect(screen.getAllByText('Current Plan').length).toBe(1);
    expect(screen.getByText('Included')).toBeDefined();
  });

  it('shows Subscribe and Start Free Trial for Stripe provider', () => {
    render(
      <PricingTable currentTier="free" isAuthenticated={true} billingProvider="stripe" />,
    );
    expect(screen.getByText('Subscribe')).toBeDefined();
    expect(screen.getByText('Start Free Trial')).toBeDefined();
  });

  it('renders resource limits in comparison table', () => {
    render(
      <PricingTable currentTier="free" isAuthenticated={false} billingProvider="stripe" />,
    );
    expect(screen.getByText('Applications')).toBeDefined();
    expect(screen.getByText('Documents')).toBeDefined();
    expect(screen.getByText('Storage')).toBeDefined();
    expect(screen.getByText('25')).toBeDefined();
    expect(screen.getByText('50 MB')).toBeDefined();
    expect(screen.getByText('200 MB')).toBeDefined();
  });

  it('renders AI feature limits in comparison table', () => {
    render(
      <PricingTable currentTier="free" isAuthenticated={false} billingProvider="stripe" />,
    );
    expect(screen.getByText('CV Parses / mo')).toBeDefined();
    expect(screen.getByText('Cover Letters / mo')).toBeDefined();
    expect(screen.getByText('Interview Prep / mo')).toBeDefined();
  });

  it('shows Unlimited for pro unlimited features', () => {
    render(
      <PricingTable currentTier="free" isAuthenticated={false} billingProvider="stripe" />,
    );
    expect(screen.getAllByText('Unlimited').length).toBeGreaterThan(0);
  });

  it('toggles to annual pricing', () => {
    render(
      <PricingTable currentTier="free" isAuthenticated={false} billingProvider="stripe" />,
    );
    const annualBtn = screen.getByText('Annual');
    fireEvent.click(annualBtn);
    expect(screen.getByText('Save 27%')).toBeDefined();
  });

  it('shows no-credit-card trial message for Stripe', () => {
    render(
      <PricingTable currentTier="free" isAuthenticated={false} billingProvider="stripe" />,
    );
    expect(
      screen.getByText(/no credit card required/i),
    ).toBeDefined();
  });
});

describe('PricingTable (Polar provider)', () => {
  it('shows Subscribe button but NOT Start Free Trial', () => {
    render(
      <PricingTable currentTier="free" isAuthenticated={true} billingProvider="polar" />,
    );
    expect(screen.getByText('Subscribe')).toBeDefined();
    expect(screen.queryByText('Start Free Trial')).toBeNull();
  });

  it('shows trial-included message instead of no-CC message', () => {
    render(
      <PricingTable currentTier="free" isAuthenticated={false} billingProvider="polar" />,
    );
    expect(
      screen.getByText(/free trial included/i),
    ).toBeDefined();
    expect(screen.queryByText(/no credit card required/i)).toBeNull();
  });

  it('still shows plan comparison tables', () => {
    render(
      <PricingTable currentTier="free" isAuthenticated={false} billingProvider="polar" />,
    );
    expect(screen.getByText('Applications')).toBeDefined();
    expect(screen.getByText('CV Parses / mo')).toBeDefined();
  });
});

describe('Pricing page (source analysis)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/(public)/pricing/page.tsx'),
    'utf-8',
  );

  it('exports metadata with title', () => {
    expect(source).toContain("title: 'Pricing - Tracked Your Future'");
  });

  it('checks auth session', () => {
    expect(source).toContain('await auth()');
  });

  it('gets user subscription for authenticated users', () => {
    expect(source).toContain('getUserSubscription');
  });

  it('passes billingProvider to PricingTable', () => {
    expect(source).toContain('getBillingProviderName');
    expect(source).toContain('billingProvider={getBillingProviderName()}');
  });

  it('passes currentTier and isAuthenticated to PricingTable', () => {
    expect(source).toContain('currentTier={currentTier}');
    expect(source).toContain('isAuthenticated={!!session?.user}');
  });
});
