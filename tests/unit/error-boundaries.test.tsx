import { render, screen, fireEvent } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import DashboardError from '@/app/(dashboard)/error';
import PublicError from '@/app/(public)/error';

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

// Mock lucide-react
vi.mock('lucide-react', () => ({}));

describe('DashboardError', () => {
  it('renders SYSTEM ERROR heading', () => {
    const reset = vi.fn();
    render(
      <DashboardError error={new Error('Test error')} reset={reset} />,
    );

    expect(screen.getByText('SYSTEM ERROR')).toBeDefined();
  });

  it('shows error message', () => {
    const reset = vi.fn();
    render(
      <DashboardError error={new Error('Something went wrong')} reset={reset} />,
    );

    expect(screen.getByText('Something went wrong')).toBeDefined();
  });

  it('shows fallback message for empty error', () => {
    const reset = vi.fn();
    render(
      <DashboardError error={new Error('')} reset={reset} />,
    );

    expect(screen.getByText('An unexpected error occurred')).toBeDefined();
  });

  it('shows error digest when present', () => {
    const reset = vi.fn();
    const error = Object.assign(new Error('fail'), { digest: 'abc123' });
    render(<DashboardError error={error} reset={reset} />);

    expect(screen.getByText('Error ID: abc123')).toBeDefined();
  });

  it('renders retry button', () => {
    const reset = vi.fn();
    render(
      <DashboardError error={new Error('fail')} reset={reset} />,
    );

    expect(screen.getByText('Retry')).toBeDefined();
  });

  it('calls reset on retry click', () => {
    const reset = vi.fn();
    render(
      <DashboardError error={new Error('fail')} reset={reset} />,
    );

    fireEvent.click(screen.getByText('Retry'));
    expect(reset).toHaveBeenCalledOnce();
  });
});

describe('PublicError', () => {
  it('renders SYSTEM ERROR heading', () => {
    const reset = vi.fn();
    render(
      <PublicError error={new Error('Test error')} reset={reset} />,
    );

    expect(screen.getByText('SYSTEM ERROR')).toBeDefined();
  });

  it('shows error message', () => {
    const reset = vi.fn();
    render(
      <PublicError error={new Error('Public error')} reset={reset} />,
    );

    expect(screen.getByText('Public error')).toBeDefined();
  });

  it('renders retry button', () => {
    const reset = vi.fn();
    render(
      <PublicError error={new Error('fail')} reset={reset} />,
    );

    expect(screen.getByText('Retry')).toBeDefined();
  });

  it('calls reset on retry click', () => {
    const reset = vi.fn();
    render(
      <PublicError error={new Error('fail')} reset={reset} />,
    );

    fireEvent.click(screen.getByText('Retry'));
    expect(reset).toHaveBeenCalledOnce();
  });

  it('shows error digest when present', () => {
    const reset = vi.fn();
    const error = Object.assign(new Error('fail'), { digest: 'xyz789' });
    render(<PublicError error={error} reset={reset} />);

    expect(screen.getByText('Error ID: xyz789')).toBeDefined();
  });
});
