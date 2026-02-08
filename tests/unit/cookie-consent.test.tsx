import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CookieConsent, COOKIE_CONSENT_KEY } from '@/components/cookie-consent';

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

describe('CookieConsent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders when no consent stored', () => {
    render(<CookieConsent />);
    expect(screen.getByTestId('cookie-consent')).toBeDefined();
    expect(screen.getByText(/cookies for authentication/)).toBeDefined();
  });

  it('renders Accept and Decline buttons', () => {
    render(<CookieConsent />);
    expect(screen.getByText('Accept')).toBeDefined();
    expect(screen.getByText('Decline')).toBeDefined();
  });

  it('links to privacy policy', () => {
    render(<CookieConsent />);
    const link = screen.getByText('Privacy Policy');
    expect(link.closest('a')?.getAttribute('href')).toBe('/privacy');
  });

  it('hides after Accept is clicked', () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByText('Accept'));
    expect(screen.queryByTestId('cookie-consent')).toBeNull();
    expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBe('accepted');
  });

  it('hides after Decline is clicked', () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByText('Decline'));
    expect(screen.queryByTestId('cookie-consent')).toBeNull();
    expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBe('declined');
  });

  it('does not render when already accepted', () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    render(<CookieConsent />);
    expect(screen.queryByTestId('cookie-consent')).toBeNull();
  });

  it('does not render when already declined', () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    render(<CookieConsent />);
    expect(screen.queryByTestId('cookie-consent')).toBeNull();
  });
});
