import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { LoginForm } from '@/app/(public)/login/login-form';

// Mock next-auth/react
const mockSignIn = vi.fn();
vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

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

// Mock lucide-react icons (used by OAuthButtons)
vi.mock('lucide-react', () => ({
  Chrome: (props: Record<string, unknown>) => <svg data-testid="icon-chrome" {...props} />,
  Github: (props: Record<string, unknown>) => <svg data-testid="icon-github" {...props} />,
}));

describe('LoginForm', () => {
  beforeEach(() => {
    mockSignIn.mockReset();
  });

  it('renders login heading', () => {
    render(<LoginForm />);
    expect(screen.getByRole('heading', { name: 'Login' })).toBeDefined();
  });

  it('renders email and password fields', () => {
    render(<LoginForm />);
    expect(screen.getByPlaceholderText('user@example.com')).toBeDefined();
    expect(screen.getByPlaceholderText('Enter password')).toBeDefined();
  });

  it('renders submit button', () => {
    render(<LoginForm />);
    expect(screen.getByRole('button', { name: 'Login' })).toBeDefined();
  });

  it('renders forgot password link', () => {
    render(<LoginForm />);
    const link = screen.getByText('Forgot password?');
    expect(link.closest('a')?.getAttribute('href')).toBe('/reset-password');
  });

  it('renders register link', () => {
    render(<LoginForm />);
    const link = screen.getByText('Register');
    expect(link.closest('a')?.getAttribute('href')).toBe('/register');
  });

  it('renders OAuth buttons', () => {
    render(<LoginForm />);
    expect(screen.getByText('Google')).toBeDefined();
    expect(screen.getByText('GitHub')).toBeDefined();
  });

  it('displays initialError when provided', () => {
    render(<LoginForm initialError="Invalid email or password" />);
    expect(screen.getByText('Invalid email or password')).toBeDefined();
  });

  it('shows validation error for empty email', async () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeDefined();
    });
  });

  it('shows validation error for empty password', async () => {
    render(<LoginForm />);
    // Fill in valid email to isolate password validation
    fireEvent.change(screen.getByPlaceholderText('user@example.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeDefined();
    });
  });

  it('calls signIn with credentials on valid submit', async () => {
    mockSignIn.mockResolvedValue(undefined);
    render(<LoginForm />);
    fireEvent.change(screen.getByPlaceholderText('user@example.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirectTo: '/dashboard',
      });
    });
  });

  it('uses callbackUrl when provided', async () => {
    mockSignIn.mockResolvedValue(undefined);
    render(<LoginForm callbackUrl="/settings" />);
    fireEvent.change(screen.getByPlaceholderText('user@example.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirectTo: '/settings',
      });
    });
  });
});
