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

describe('PricingTable', () => {
  it('renders Free and Pro plan headings', () => {
    render(<PricingTable currentTier="free" isAuthenticated={false} />);
    expect(screen.getByRole('heading', { name: 'Free' })).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Pro' })).toBeDefined();
  });

  it('renders $0 for free plan', () => {
    render(<PricingTable currentTier="free" isAuthenticated={false} />);
    expect(screen.getByText('$0')).toBeDefined();
  });

  it('renders monthly price for pro plan', () => {
    render(<PricingTable currentTier="free" isAuthenticated={false} />);
    expect(screen.getByText('$9')).toBeDefined();
  });

  it('shows Current Plan button for current tier', () => {
    render(<PricingTable currentTier="free" isAuthenticated={true} />);
    expect(screen.getAllByText('Current Plan').length).toBeGreaterThanOrEqual(1);
  });

  it('shows Current Plan for pro user on pro card', () => {
    render(<PricingTable currentTier="pro" isAuthenticated={true} />);
    expect(screen.getAllByText('Current Plan').length).toBe(1);
    expect(screen.getByText('Included')).toBeDefined();
  });

  it('shows Subscribe and Start Free Trial for non-pro authenticated users', () => {
    render(<PricingTable currentTier="free" isAuthenticated={true} />);
    expect(screen.getByText('Subscribe')).toBeDefined();
    expect(screen.getByText('Start Free Trial')).toBeDefined();
  });

  it('renders resource limits in comparison table', () => {
    render(<PricingTable currentTier="free" isAuthenticated={false} />);
    expect(screen.getByText('Applications')).toBeDefined();
    expect(screen.getByText('Documents')).toBeDefined();
    expect(screen.getByText('Storage')).toBeDefined();
    expect(screen.getByText('25')).toBeDefined();
    expect(screen.getByText('50 MB')).toBeDefined();
    expect(screen.getByText('2 GB')).toBeDefined();
  });

  it('renders AI feature limits in comparison table', () => {
    render(<PricingTable currentTier="free" isAuthenticated={false} />);
    expect(screen.getByText('CV Parses / mo')).toBeDefined();
    expect(screen.getByText('Cover Letters / mo')).toBeDefined();
    expect(screen.getByText('Interview Prep / mo')).toBeDefined();
  });

  it('shows Unlimited for pro unlimited features', () => {
    render(<PricingTable currentTier="free" isAuthenticated={false} />);
    expect(screen.getAllByText('Unlimited').length).toBeGreaterThan(0);
  });

  it('toggles to annual pricing', () => {
    render(<PricingTable currentTier="free" isAuthenticated={false} />);
    const annualBtn = screen.getByText('Annual');
    fireEvent.click(annualBtn);
    expect(screen.getByText('Save 27%')).toBeDefined();
  });

  it('shows 14-day trial message', () => {
    render(<PricingTable currentTier="free" isAuthenticated={false} />);
    expect(
      screen.getByText(/14-day free trial/i),
    ).toBeDefined();
  });
});

describe('Pricing page (source analysis)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/(public)/pricing/page.tsx'),
    'utf-8',
  );

  it('exports metadata with title', () => {
    expect(source).toContain("title: 'Pricing - Track Your Future'");
  });

  it('checks auth session', () => {
    expect(source).toContain('await auth()');
  });

  it('gets user subscription for authenticated users', () => {
    expect(source).toContain('getUserSubscription');
  });

  it('passes currentTier and isAuthenticated to PricingTable', () => {
    expect(source).toContain('currentTier={currentTier}');
    expect(source).toContain('isAuthenticated={!!session?.user}');
  });
});
