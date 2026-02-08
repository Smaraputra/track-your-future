import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PrivacyPage from '@/app/(public)/privacy/page';
import TermsPage from '@/app/(public)/terms/page';

describe('Privacy Policy page', () => {
  it('renders Privacy Policy heading', () => {
    render(<PrivacyPage />);
    expect(screen.getByText('Privacy Policy')).toBeDefined();
  });

  it('renders key section headings', () => {
    render(<PrivacyPage />);
    const headings = [
      '1. Introduction',
      '2. Data We Collect',
      '3. How We Use Your Data',
      '4. Third-Party Services',
      '5. Data Retention',
      '6. Your Rights (GDPR)',
      '7. Cookies and Local Storage',
      '8. Security',
      '9. Changes to This Policy',
      '10. Contact',
    ];
    for (const heading of headings) {
      expect(screen.getByText(heading)).toBeDefined();
    }
  });

  it('mentions key data categories', () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/Account Information/)).toBeDefined();
    expect(screen.getByText(/Application Data/)).toBeDefined();
    expect(screen.getByText(/Documents/)).toBeDefined();
    expect(screen.getByText(/AI-Processed Data/)).toBeDefined();
    expect(screen.getByText(/Billing Data/)).toBeDefined();
  });

  it('exports metadata with title', async () => {
    const mod = await import('@/app/(public)/privacy/page');
    expect(mod.metadata).toBeDefined();
    expect(mod.metadata?.title).toContain('Privacy Policy');
  });
});

describe('Terms of Service page', () => {
  it('renders Terms of Service heading', () => {
    render(<TermsPage />);
    expect(screen.getByText('Terms of Service')).toBeDefined();
  });

  it('renders key section headings', () => {
    render(<TermsPage />);
    const headings = [
      '1. Acceptance of Terms',
      '2. Description of Service',
      '3. Accounts',
      '4. Subscription and Billing',
      '5. Acceptable Use',
      '6. Your Content',
      '7. AI Features',
      '8. Data and Privacy',
      '9. Service Availability',
      '10. Limitation of Liability',
      '11. Disclaimer of Warranties',
      '12. Termination',
      '13. Changes to Terms',
      '14. Governing Law',
      '15. Contact',
    ];
    for (const heading of headings) {
      expect(screen.getByText(heading)).toBeDefined();
    }
  });

  it('links to privacy policy', () => {
    render(<TermsPage />);
    const link = screen.getByText('Privacy Policy');
    expect(link.closest('a')?.getAttribute('href')).toBe('/privacy');
  });

  it('mentions Free and Pro tiers', () => {
    render(<TermsPage />);
    expect(screen.getAllByText(/Free tier/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Pro tier/).length).toBeGreaterThan(0);
  });

  it('exports metadata with title', async () => {
    const mod = await import('@/app/(public)/terms/page');
    expect(mod.metadata).toBeDefined();
    expect(mod.metadata?.title).toContain('Terms of Service');
  });
});
