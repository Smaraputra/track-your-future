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

// Mock MatrixRain (client component with canvas)
vi.mock('@/components/matrix-rain', () => ({
  MatrixRain: () => <canvas data-testid="matrix-rain" />,
}));

// Mock TypewriterText (avoid CSS animation in jsdom)
vi.mock('@/components/typewriter-text', () => ({
  TypewriterText: ({ text }: { text: string }) => <span>{text}</span>,
}));

describe('LandingContent', () => {
  it('renders the hero title', () => {
    render(<LandingContent />);
    expect(screen.getByText('Track Your Future')).toBeDefined();
  });

  it('renders the hero subtitle with typewriter text', () => {
    render(<LandingContent />);
    expect(
      screen.getByText(/Track applications, manage documents, get AI-powered insights/),
    ).toBeDefined();
  });

  it('renders terminal prompt lines', () => {
    render(<LandingContent />);
    expect(screen.getByText(/\.\/launch --system/)).toBeDefined();
    expect(screen.getByText(/ls -la \/sys\/modules\//)).toBeDefined();
    expect(screen.getByText(/cat \/etc\/system\.conf/)).toBeDefined();
  });

  it('renders MatrixRain in hero', () => {
    render(<LandingContent />);
    expect(screen.getByTestId('matrix-rain')).toBeDefined();
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
      // Features appear in both desktop and mobile views
      const titles = screen.getAllByText(feature.title);
      expect(titles.length).toBeGreaterThan(0);
      const descriptions = screen.getAllByText(feature.description);
      expect(descriptions.length).toBeGreaterThan(0);
    }
  });

  it('renders capabilities section', () => {
    render(<LandingContent />);
    expect(screen.getByText('25')).toBeDefined();
    expect(screen.getByText('Applications')).toBeDefined();
    expect(screen.getByText('10')).toBeDefined();
    expect(screen.getByText('Documents')).toBeDefined();
    expect(screen.getByText('6')).toBeDefined();
    expect(screen.getByText('AI Tools')).toBeDefined();
  });

  it('renders Create Account CTA linking to /register', () => {
    render(<LandingContent />);
    const link = screen.getByText('Create Account');
    expect(link.closest('a')?.getAttribute('href')).toBe('/register');
  });

  it('renders View Pricing links', () => {
    render(<LandingContent />);
    const pricingLinks = screen.getAllByText('View Pricing');
    const found = pricingLinks.find(
      (el) => el.closest('a')?.getAttribute('href') === '/pricing',
    );
    expect(found).toBeDefined();
  });

  it('renders footer links to /privacy, /terms, /pricing', () => {
    render(<LandingContent />);
    const privacy = screen.getByText('Privacy');
    expect(privacy.closest('a')?.getAttribute('href')).toBe('/privacy');
    const terms = screen.getByText('Terms');
    expect(terms.closest('a')?.getAttribute('href')).toBe('/terms');
    // Pricing appears multiple times; check footer link exists
    const pricingLinks = screen.getAllByText('Pricing');
    const footerPricing = pricingLinks.find(
      (el) => el.closest('a')?.getAttribute('href') === '/pricing',
    );
    expect(footerPricing).toBeDefined();
  });
});
