import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RetroFormField } from '@/components/retro-form-field';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { AuthMessage } from '@/components/auth/auth-message';

// Mock next-auth/react
const mockSignIn = vi.fn();
vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Chrome: (props: Record<string, unknown>) => <svg data-testid="icon-chrome" {...props} />,
  Github: (props: Record<string, unknown>) => <svg data-testid="icon-github" {...props} />,
}));

describe('RetroFormField', () => {
  it('renders label and children', () => {
    render(
      <RetroFormField label="Email">
        <input data-testid="input" />
      </RetroFormField>,
    );
    expect(screen.getByText('Email')).toBeDefined();
    expect(screen.getByTestId('input')).toBeDefined();
  });

  it('renders error message when provided', () => {
    render(
      <RetroFormField label="Email" error="Invalid email">
        <input />
      </RetroFormField>,
    );
    expect(screen.getByText('Invalid email')).toBeDefined();
  });

  it('does not render error element when no error', () => {
    const { container } = render(
      <RetroFormField label="Email">
        <input />
      </RetroFormField>,
    );
    expect(container.querySelector('.text-destructive')).toBeNull();
  });
});

describe('OAuthButtons', () => {
  it('renders Google and GitHub buttons', () => {
    render(<OAuthButtons />);
    expect(screen.getByText('Google')).toBeDefined();
    expect(screen.getByText('GitHub')).toBeDefined();
  });

  it('renders "or" divider', () => {
    render(<OAuthButtons />);
    expect(screen.getByText('or')).toBeDefined();
  });

  it('calls signIn with google on Google button click', () => {
    render(<OAuthButtons />);
    fireEvent.click(screen.getByText('Google'));
    expect(mockSignIn).toHaveBeenCalledWith('google', { redirectTo: '/dashboard' });
  });

  it('calls signIn with github on GitHub button click', () => {
    render(<OAuthButtons />);
    fireEvent.click(screen.getByText('GitHub'));
    expect(mockSignIn).toHaveBeenCalledWith('github', { redirectTo: '/dashboard' });
  });

  it('renders provider icons', () => {
    render(<OAuthButtons />);
    expect(screen.getByTestId('icon-chrome')).toBeDefined();
    expect(screen.getByTestId('icon-github')).toBeDefined();
  });
});

describe('AuthMessage', () => {
  it('renders success message with correct styling', () => {
    const { container } = render(
      <AuthMessage variant="success" message="Email verified" />,
    );
    expect(screen.getByText('Email verified')).toBeDefined();
    const el = container.firstElementChild!;
    expect(el.className).toContain('border-primary/50');
    expect(el.className).toContain('text-primary');
  });

  it('renders error message with correct styling', () => {
    const { container } = render(
      <AuthMessage variant="error" message="Invalid credentials" />,
    );
    expect(screen.getByText('Invalid credentials')).toBeDefined();
    const el = container.firstElementChild!;
    expect(el.className).toContain('border-destructive/50');
    expect(el.className).toContain('text-destructive');
  });
});
