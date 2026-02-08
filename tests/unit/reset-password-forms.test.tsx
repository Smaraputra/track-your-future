import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ResetPasswordForm } from '@/app/(public)/reset-password/reset-password-form';
import { ResetPasswordConfirmForm } from '@/app/(public)/reset-password/confirm/reset-password-confirm-form';
import ResetPasswordConfirmPage from '@/app/(public)/reset-password/confirm/page';

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

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('renders heading', () => {
    render(<ResetPasswordForm />);
    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeDefined();
  });

  it('renders email field', () => {
    render(<ResetPasswordForm />);
    expect(screen.getByPlaceholderText('user@example.com')).toBeDefined();
  });

  it('renders submit button', () => {
    render(<ResetPasswordForm />);
    expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeDefined();
  });

  it('renders back to login link', () => {
    render(<ResetPasswordForm />);
    const links = screen.getAllByText('Back to login');
    const loginLink = links.find(
      (el) => el.closest('a')?.getAttribute('href') === '/login',
    );
    expect(loginLink).toBeDefined();
  });

  it('shows validation error for invalid email', async () => {
    render(<ResetPasswordForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));
    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeDefined();
    });
  });

  it('shows success message after submission', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    render(<ResetPasswordForm />);
    fireEvent.change(screen.getByPlaceholderText('user@example.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeDefined();
    });
  });

  it('shows error for rate limiting', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: 'rate limited' }),
    });

    render(<ResetPasswordForm />);
    fireEvent.change(screen.getByPlaceholderText('user@example.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
      expect(screen.getByText('Too many requests. Please try again later.')).toBeDefined();
    });
  });

  it('sends correct data to API', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    render(<ResetPasswordForm />);
    fireEvent.change(screen.getByPlaceholderText('user@example.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
    });
  });
});

describe('ResetPasswordConfirmForm', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('renders heading', () => {
    render(<ResetPasswordConfirmForm token="test-token" />);
    expect(screen.getByRole('heading', { name: 'Set New Password' })).toBeDefined();
  });

  it('renders password and confirm password fields', () => {
    render(<ResetPasswordConfirmForm token="test-token" />);
    expect(screen.getByPlaceholderText('Min. 8 characters')).toBeDefined();
    expect(screen.getByPlaceholderText('Confirm password')).toBeDefined();
  });

  it('renders submit button', () => {
    render(<ResetPasswordConfirmForm token="test-token" />);
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeDefined();
  });

  it('shows validation error for short password', async () => {
    render(<ResetPasswordConfirmForm token="test-token" />);
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), {
      target: { value: 'short' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
      target: { value: 'short' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeDefined();
    });
  });

  it('shows validation error for mismatched passwords', async () => {
    render(<ResetPasswordConfirmForm token="test-token" />);
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
      target: { value: 'different123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeDefined();
    });
  });

  it('shows success message on valid submission', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'ok' }),
    });

    render(<ResetPasswordConfirmForm token="test-token" />);
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), {
      target: { value: 'newpassword123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
      target: { value: 'newpassword123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Password Reset' })).toBeDefined();
    });
  });

  it('shows error on API failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid or already used token' }),
    });

    render(<ResetPasswordConfirmForm token="test-token" />);
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), {
      target: { value: 'newpassword123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
      target: { value: 'newpassword123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid or already used token')).toBeDefined();
    });
  });

  it('sends token and password to API', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'ok' }),
    });

    render(<ResetPasswordConfirmForm token="my-reset-token" />);
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), {
      target: { value: 'newpassword123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
      target: { value: 'newpassword123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'my-reset-token', password: 'newpassword123' }),
      });
    });
  });
});

describe('ResetPasswordConfirmPage', () => {
  it('shows error when no token provided', async () => {
    const page = await ResetPasswordConfirmPage({
      searchParams: Promise.resolve({}),
    });
    render(page);
    expect(screen.getByRole('heading', { name: 'Invalid Link' })).toBeDefined();
    expect(
      screen.getByText('No reset token provided. Please request a new password reset link.'),
    ).toBeDefined();
  });

  it('shows "Request reset link" on missing token', async () => {
    const page = await ResetPasswordConfirmPage({
      searchParams: Promise.resolve({}),
    });
    render(page);
    const link = screen.getByText('Request reset link');
    expect(link.closest('a')?.getAttribute('href')).toBe('/reset-password');
  });

  it('renders confirm form when token provided', async () => {
    const page = await ResetPasswordConfirmPage({
      searchParams: Promise.resolve({ token: 'valid-token' }),
    });
    render(page);
    expect(screen.getByRole('heading', { name: 'Set New Password' })).toBeDefined();
  });
});
