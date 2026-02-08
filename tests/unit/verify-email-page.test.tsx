import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

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

// Mock the verifyEmail function
const mockVerifyEmail = vi.fn();
vi.mock('@/lib/auth/verify-email', () => ({
  verifyEmail: (...args: unknown[]) => mockVerifyEmail(...args),
}));

// Import after mocks
import VerifyEmailPage from '@/app/(public)/verify-email/page';

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    mockVerifyEmail.mockReset();
  });

  it('renders heading', async () => {
    const page = await VerifyEmailPage({
      searchParams: Promise.resolve({}),
    });
    render(page);
    expect(screen.getByRole('heading', { name: 'Email Verification' })).toBeDefined();
  });

  it('shows error when no token provided', async () => {
    const page = await VerifyEmailPage({
      searchParams: Promise.resolve({}),
    });
    render(page);
    expect(screen.getByText('No verification token provided.')).toBeDefined();
  });

  it('shows "Register again" link on error', async () => {
    const page = await VerifyEmailPage({
      searchParams: Promise.resolve({}),
    });
    render(page);
    const link = screen.getByText('Register again');
    expect(link.closest('a')?.getAttribute('href')).toBe('/register');
  });

  it('shows success message on valid token', async () => {
    mockVerifyEmail.mockResolvedValue({ success: true });
    const page = await VerifyEmailPage({
      searchParams: Promise.resolve({ token: 'valid-token' }),
    });
    render(page);
    expect(
      screen.getByText('Your email has been verified. You can now log in.'),
    ).toBeDefined();
  });

  it('shows "Go to login" link on success', async () => {
    mockVerifyEmail.mockResolvedValue({ success: true });
    const page = await VerifyEmailPage({
      searchParams: Promise.resolve({ token: 'valid-token' }),
    });
    render(page);
    const link = screen.getByText('Go to login');
    expect(link.closest('a')?.getAttribute('href')).toBe('/login');
  });

  it('shows error message on invalid token', async () => {
    mockVerifyEmail.mockResolvedValue({
      success: false,
      error: 'Invalid or expired verification link.',
    });
    const page = await VerifyEmailPage({
      searchParams: Promise.resolve({ token: 'bad-token' }),
    });
    render(page);
    expect(screen.getByText('Invalid or expired verification link.')).toBeDefined();
  });

  it('shows expired token error', async () => {
    mockVerifyEmail.mockResolvedValue({
      success: false,
      error: 'This verification link has expired. Please register again.',
    });
    const page = await VerifyEmailPage({
      searchParams: Promise.resolve({ token: 'expired-token' }),
    });
    render(page);
    expect(
      screen.getByText('This verification link has expired. Please register again.'),
    ).toBeDefined();
  });

  it('calls verifyEmail with the token', async () => {
    mockVerifyEmail.mockResolvedValue({ success: true });
    const page = await VerifyEmailPage({
      searchParams: Promise.resolve({ token: 'test-token-123' }),
    });
    render(page);
    expect(mockVerifyEmail).toHaveBeenCalledWith('test-token-123');
  });

  it('does not call verifyEmail when no token', async () => {
    const page = await VerifyEmailPage({
      searchParams: Promise.resolve({}),
    });
    render(page);
    expect(mockVerifyEmail).not.toHaveBeenCalled();
  });
});
