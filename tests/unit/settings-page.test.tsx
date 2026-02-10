import { render, screen, fireEvent } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SettingsContent } from '@/components/settings/settings-content';
import { AppearanceTab } from '@/components/settings/appearance-tab';
import { ProfileTab } from '@/components/settings/profile-tab';
import { SecurityTab } from '@/components/settings/security-tab';
import { SubscriptionTab } from '@/components/settings/subscription-tab';
import { DataTab } from '@/components/settings/data-tab';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

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

// Mock use-theme hook
vi.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    theme: 'green',
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

const defaultProps = {
  user: {
    id: 'user-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    hasPassword: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  linkedProviders: ['google'],
  subscription: {
    tier: 'free' as const,
    status: null,
    trialEnd: null,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
  },
};

describe('SettingsContent tabs', () => {
  it('renders all tab triggers', () => {
    render(<SettingsContent {...defaultProps} />);

    expect(screen.getByText('Appearance')).toBeDefined();
    expect(screen.getByText('Profile')).toBeDefined();
    expect(screen.getByText('Security')).toBeDefined();
    expect(screen.getByText('Subscription')).toBeDefined();
    expect(screen.getByText('Data')).toBeDefined();
  });

  it('shows appearance tab by default', () => {
    render(<SettingsContent {...defaultProps} />);

    expect(screen.getByText('Theme')).toBeDefined();
    expect(screen.getByText('CRT Overlay')).toBeDefined();
  });

  it('has correct tab roles', () => {
    render(<SettingsContent {...defaultProps} />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(5);
  });
});

describe('AppearanceTab', () => {
  it('renders theme options', () => {
    render(<AppearanceTab />);

    expect(screen.getByText('Theme')).toBeDefined();
    expect(screen.getByText('Green')).toBeDefined();
    expect(screen.getByText('Amber')).toBeDefined();
  });

  it('renders CRT overlay toggle', () => {
    render(<AppearanceTab />);

    expect(screen.getByText('CRT Overlay')).toBeDefined();
    // Initial state is disabled
    expect(screen.getByText('Disabled')).toBeDefined();
  });
});

describe('ProfileTab', () => {
  it('shows name input with initial value', () => {
    render(<ProfileTab name="Jane Doe" email="jane@example.com" />);

    expect(screen.getByDisplayValue('Jane Doe')).toBeDefined();
  });

  it('shows email', () => {
    render(<ProfileTab name="Jane" email="jane@example.com" />);

    expect(screen.getByText('jane@example.com')).toBeDefined();
  });

  it('shows display name heading', () => {
    render(<ProfileTab name="" email="test@test.com" />);

    expect(screen.getByText('Display Name')).toBeDefined();
  });

  it('disables save when name unchanged', () => {
    render(<ProfileTab name="Jane" email="test@test.com" />);

    const saveButton = screen.getByText('Save');
    expect(saveButton.hasAttribute('disabled')).toBe(true);
  });

  it('enables save when name changed', () => {
    render(<ProfileTab name="Jane" email="test@test.com" />);

    fireEvent.change(screen.getByDisplayValue('Jane'), {
      target: { value: 'Jane Doe' },
    });

    const saveButton = screen.getByText('Save');
    expect(saveButton.hasAttribute('disabled')).toBe(false);
  });
});

describe('SecurityTab', () => {
  it('shows password change form for users with password', () => {
    render(<SecurityTab hasPassword={true} linkedProviders={[]} />);

    expect(screen.getByRole('heading', { name: 'Change Password' })).toBeDefined();
    expect(screen.getByPlaceholderText('Current password')).toBeDefined();
    expect(screen.getByPlaceholderText('New password (min 8 chars)')).toBeDefined();
  });

  it('hides password form for OAuth-only users', () => {
    render(<SecurityTab hasPassword={false} linkedProviders={['google']} />);

    expect(screen.queryByText('Change Password')).toBeNull();
    expect(screen.getByText(/OAuth login only/)).toBeDefined();
  });

  it('shows linked providers', () => {
    render(<SecurityTab hasPassword={false} linkedProviders={['google', 'github']} />);

    expect(screen.getByText('google')).toBeDefined();
    expect(screen.getByText('github')).toBeDefined();
  });

  it('shows no linked accounts message when empty', () => {
    render(<SecurityTab hasPassword={true} linkedProviders={[]} />);

    expect(screen.getByText('No linked OAuth accounts')).toBeDefined();
  });

  it('disables change button with invalid input', () => {
    render(<SecurityTab hasPassword={true} linkedProviders={[]} />);

    const button = screen.getByRole('button', { name: 'Change Password' });
    expect(button.hasAttribute('disabled')).toBe(true);
  });
});

describe('SubscriptionTab', () => {
  it('shows free plan with upgrade link', () => {
    render(
      <SubscriptionTab
        subscription={{
          tier: 'free',
          status: null,
          trialEnd: null,
          cancelAtPeriodEnd: false,
          currentPeriodEnd: null,
        }}
      />,
    );

    expect(screen.getByText('free')).toBeDefined();
    expect(screen.getByText('Upgrade to Pro')).toBeDefined();
  });

  it('shows pro plan with manage button', () => {
    render(
      <SubscriptionTab
        subscription={{
          tier: 'pro',
          status: 'active',
          trialEnd: null,
          cancelAtPeriodEnd: false,
          currentPeriodEnd: '2026-03-01T00:00:00.000Z',
        }}
      />,
    );

    expect(screen.getByText('pro')).toBeDefined();
    expect(screen.getByText('Manage Subscription')).toBeDefined();
  });

  it('shows trial end date', () => {
    render(
      <SubscriptionTab
        subscription={{
          tier: 'pro',
          status: 'trialing',
          trialEnd: '2026-02-15T00:00:00.000Z',
          cancelAtPeriodEnd: false,
          currentPeriodEnd: '2026-03-01T00:00:00.000Z',
        }}
      />,
    );

    expect(screen.getByText('Trial ends')).toBeDefined();
  });

  it('shows cancellation notice', () => {
    render(
      <SubscriptionTab
        subscription={{
          tier: 'pro',
          status: 'active',
          trialEnd: null,
          cancelAtPeriodEnd: true,
          currentPeriodEnd: '2026-03-01T00:00:00.000Z',
        }}
      />,
    );

    expect(
      screen.getByText('Subscription will cancel at end of period'),
    ).toBeDefined();
  });

  it('shows load AI usage button', () => {
    render(
      <SubscriptionTab
        subscription={{
          tier: 'free',
          status: null,
          trialEnd: null,
          cancelAtPeriodEnd: false,
          currentPeriodEnd: null,
        }}
      />,
    );

    expect(screen.getByText('Load AI Usage')).toBeDefined();
  });

  it('shows renews on date for active subscription', () => {
    render(
      <SubscriptionTab
        subscription={{
          tier: 'pro',
          status: 'active',
          trialEnd: null,
          cancelAtPeriodEnd: false,
          currentPeriodEnd: '2026-03-01T00:00:00.000Z',
        }}
      />,
    );

    expect(screen.getByText('Renews on')).toBeDefined();
  });

  it('shows access until date for canceling subscription', () => {
    render(
      <SubscriptionTab
        subscription={{
          tier: 'pro',
          status: 'active',
          trialEnd: null,
          cancelAtPeriodEnd: true,
          currentPeriodEnd: '2026-03-01T00:00:00.000Z',
        }}
      />,
    );

    expect(screen.getByText('Access until')).toBeDefined();
  });
});

describe('DataTab', () => {
  it('shows account creation date', () => {
    render(<DataTab createdAt="2025-01-01T00:00:00.000Z" />);

    expect(screen.getByText(/January 1, 2025/)).toBeDefined();
  });

  it('shows export data button', () => {
    render(<DataTab createdAt="2025-01-01T00:00:00.000Z" />);

    expect(screen.getByRole('button', { name: 'Export Data' })).toBeDefined();
  });

  it('shows danger zone', () => {
    render(<DataTab createdAt="2025-01-01T00:00:00.000Z" />);

    expect(screen.getByText('Danger Zone')).toBeDefined();
  });

  it('shows delete account button', () => {
    render(<DataTab createdAt="2025-01-01T00:00:00.000Z" />);

    expect(screen.getByText('Delete Account')).toBeDefined();
  });

  it('shows confirmation input after clicking delete', () => {
    render(<DataTab createdAt="2025-01-01T00:00:00.000Z" />);

    fireEvent.click(screen.getByText('Delete Account'));
    expect(screen.getByPlaceholderText('DELETE MY ACCOUNT')).toBeDefined();
    expect(screen.getByText('Confirm Delete')).toBeDefined();
  });

  it('shows cancel button in delete confirmation', () => {
    render(<DataTab createdAt="2025-01-01T00:00:00.000Z" />);

    fireEvent.click(screen.getByText('Delete Account'));
    expect(screen.getByText('Cancel')).toBeDefined();
  });

  it('hides confirmation when cancel clicked', () => {
    render(<DataTab createdAt="2025-01-01T00:00:00.000Z" />);

    fireEvent.click(screen.getByText('Delete Account'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('DELETE MY ACCOUNT')).toBeNull();
  });

  it('disables confirm when text does not match', () => {
    render(<DataTab createdAt="2025-01-01T00:00:00.000Z" />);

    fireEvent.click(screen.getByText('Delete Account'));
    const confirmBtn = screen.getByText('Confirm Delete');
    expect(confirmBtn.hasAttribute('disabled')).toBe(true);
  });
});
