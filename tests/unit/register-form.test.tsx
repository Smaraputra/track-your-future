import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RegisterForm } from '@/app/(public)/register/register-form';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
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

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Chrome: (props: Record<string, unknown>) => <svg data-testid="icon-chrome" {...props} />,
  Github: (props: Record<string, unknown>) => <svg data-testid="icon-github" {...props} />,
}));

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('RegisterForm', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('renders register heading', () => {
    render(<RegisterForm />);
    expect(screen.getByRole('heading', { name: 'Register' })).toBeDefined();
  });

  it('renders name, email, and password fields', () => {
    render(<RegisterForm />);
    expect(screen.getByPlaceholderText('Your name')).toBeDefined();
    expect(screen.getByPlaceholderText('user@example.com')).toBeDefined();
    expect(screen.getByPlaceholderText('Min. 8 characters')).toBeDefined();
  });

  it('renders submit button', () => {
    render(<RegisterForm />);
    expect(screen.getByRole('button', { name: 'Register' })).toBeDefined();
  });

  it('renders login link', () => {
    render(<RegisterForm />);
    const link = screen.getByText('Login');
    expect(link.closest('a')?.getAttribute('href')).toBe('/login');
  });

  it('renders OAuth buttons', () => {
    render(<RegisterForm />);
    expect(screen.getByText('Google')).toBeDefined();
    expect(screen.getByText('GitHub')).toBeDefined();
  });

  it('shows validation error for empty name', async () => {
    render(<RegisterForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeDefined();
    });
  });

  it('shows validation error for short password', async () => {
    render(<RegisterForm />);
    fireEvent.change(screen.getByPlaceholderText('Your name'), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByPlaceholderText('user@example.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), {
      target: { value: 'short' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeDefined();
    });
  });

  it('shows success message on successful registration', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Check your email' }),
    });

    render(<RegisterForm />);
    fireEvent.change(screen.getByPlaceholderText('Your name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('user@example.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeDefined();
    });
  });

  it('shows error for duplicate email (409)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ error: 'exists' }),
    });

    render(<RegisterForm />);
    fireEvent.change(screen.getByPlaceholderText('Your name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('user@example.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(screen.getByText('An account with this email already exists.')).toBeDefined();
    });
  });

  it('shows error for rate limiting (429)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: 'rate limited' }),
    });

    render(<RegisterForm />);
    fireEvent.change(screen.getByPlaceholderText('Your name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('user@example.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(screen.getByText('Too many requests. Please try again later.')).toBeDefined();
    });
  });

  it('sends correct data to API', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'ok' }),
    });

    render(<RegisterForm />);
    fireEvent.change(screen.getByPlaceholderText('Your name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('user@example.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        }),
      });
    });
  });
});
