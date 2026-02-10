import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import DashboardLoading from '@/app/(dashboard)/loading';
import DashboardNotFound from '@/app/(dashboard)/not-found';
import GlobalNotFound from '@/app/not-found';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('DashboardLoading', () => {
  it('renders loading text', () => {
    render(<DashboardLoading />);

    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('renders in a RetroWindow', () => {
    render(<DashboardLoading />);

    expect(screen.getByText('sys://loading')).toBeDefined();
  });

  it('renders pulse indicators', () => {
    const { container } = render(<DashboardLoading />);

    const pulses = container.querySelectorAll('.animate-pulse');
    expect(pulses.length).toBe(3);
  });
});

describe('DashboardNotFound', () => {
  it('renders 404 heading', () => {
    render(<DashboardNotFound />);

    expect(screen.getByText('404 -- NOT FOUND')).toBeDefined();
  });

  it('renders in a RetroWindow', () => {
    render(<DashboardNotFound />);

    expect(screen.getByText('sys://404')).toBeDefined();
  });

  it('has link back to dashboard', () => {
    render(<DashboardNotFound />);

    const link = screen.getByText('Back to Dashboard');
    expect(link.closest('a')?.getAttribute('href')).toBe('/dashboard');
  });
});

describe('GlobalNotFound', () => {
  it('renders 404 heading', () => {
    render(<GlobalNotFound />);

    expect(screen.getByText('404')).toBeDefined();
  });

  it('shows not found message', () => {
    render(<GlobalNotFound />);

    expect(screen.getByText(/Page not found/)).toBeDefined();
  });

  it('has link back to home', () => {
    render(<GlobalNotFound />);

    const link = screen.getByText('Return Home');
    expect(link.closest('a')?.getAttribute('href')).toBe('/');
  });
});
