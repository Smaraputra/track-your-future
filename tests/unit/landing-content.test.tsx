import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LandingContent, FEATURES } from '@/components/landing-content';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('LandingContent', () => {
  it('renders the hero title', () => {
    render(<LandingContent />);
    expect(screen.getByText('Track Your Future')).toBeDefined();
  });

  it('renders the hero tagline', () => {
    render(<LandingContent />);
    expect(
      screen.getAllByText(/job search command center/i).length,
    ).toBeGreaterThan(0);
  });

  it('renders Initialize System CTA linking to /register', () => {
    render(<LandingContent />);
    const link = screen.getByText('Initialize System');
    expect(link.closest('a')?.getAttribute('href')).toBe('/register');
  });

  it('renders all 6 feature items', () => {
    render(<LandingContent />);
    expect(FEATURES).toHaveLength(6);
    for (const feature of FEATURES) {
      expect(screen.getByText(feature.title)).toBeDefined();
      expect(screen.getByText(feature.description)).toBeDefined();
    }
  });

  it('renders System Capabilities heading', () => {
    render(<LandingContent />);
    expect(screen.getByText(/System Capabilities/)).toBeDefined();
  });

  it('renders Create Account CTA linking to /register', () => {
    render(<LandingContent />);
    const link = screen.getByText('Create Account');
    expect(link.closest('a')?.getAttribute('href')).toBe('/register');
  });

  it('renders View Pricing link', () => {
    render(<LandingContent />);
    const link = screen.getByText('View Pricing');
    expect(link.closest('a')?.getAttribute('href')).toBe('/pricing');
  });

  it('renders footer links to /privacy, /terms, /pricing', () => {
    render(<LandingContent />);
    const privacy = screen.getByText('Privacy Policy');
    expect(privacy.closest('a')?.getAttribute('href')).toBe('/privacy');
    const terms = screen.getByText('Terms of Service');
    expect(terms.closest('a')?.getAttribute('href')).toBe('/terms');
    // Pricing appears multiple times; check footer link exists
    const pricingLinks = screen.getAllByText('Pricing');
    const footerPricing = pricingLinks.find(
      (el) => el.closest('a')?.getAttribute('href') === '/pricing',
    );
    expect(footerPricing).toBeDefined();
  });
});
