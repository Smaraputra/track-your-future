import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { NAV_ITEMS } from '@/components/nav-items';
import { ThemeToggle } from '@/components/theme-toggle';
import { UpgradeGate } from '@/components/upgrade-gate';
import { ThemeProvider } from '@/hooks/use-theme';
import { SubscriptionProvider } from '@/hooks/use-subscription';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

// Mock radix-ui (portals don't work in jsdom)
vi.mock('radix-ui', () => {
  const passthrough = ({ children }: { children?: ReactNode }) => children ?? null;
  const passthroughWithProps = ({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>;
  return {
    Tooltip: {
      Provider: passthrough,
      Root: passthrough,
      Trigger: ({ children, asChild }: { children: ReactNode; asChild?: boolean }) => {
        if (asChild) return children;
        return <button>{children}</button>;
      },
      Portal: passthrough,
      Content: passthroughWithProps,
      Arrow: () => null,
    },
    DropdownMenu: {
      Root: passthrough,
      Trigger: ({ children, ...props }: { children?: ReactNode; className?: string }) => <button {...props}>{children}</button>,
      Portal: passthrough,
      Content: passthroughWithProps,
      Group: passthrough,
      Item: ({ children, onClick, asChild, ...props }: { children?: ReactNode; onClick?: () => void; asChild?: boolean; [key: string]: unknown }) => {
        if (asChild) return children;
        return <div role="menuitem" onClick={onClick} {...props}>{children}</div>;
      },
      Label: passthroughWithProps,
      Separator: () => <hr />,
    },
    Avatar: {
      Root: passthroughWithProps,
      Image: ({ alt, ...props }: { alt?: string; [key: string]: unknown }) => <img alt={alt} {...props} />,
      Fallback: passthroughWithProps,
    },
  };
});

const themeWrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('NAV_ITEMS', () => {
  it('has 6 navigation items', () => {
    expect(NAV_ITEMS).toHaveLength(6);
  });

  it('each item has label, href, and icon', () => {
    for (const item of NAV_ITEMS) {
      expect(item.label).toBeTruthy();
      expect(item.href).toMatch(/^\//);
      expect(item.icon).toBeDefined();
    }
  });

  it('includes expected routes', () => {
    const hrefs = NAV_ITEMS.map((i) => i.href);
    expect(hrefs).toContain('/dashboard');
    expect(hrefs).toContain('/applications');
    expect(hrefs).toContain('/roles');
    expect(hrefs).toContain('/documents');
    expect(hrefs).toContain('/settings');
  });
});

describe('BottomDock', async () => {
  const { BottomDock } = await import('@/components/dock');

  it('renders all 6 nav items as links', () => {
    render(<BottomDock />, { wrapper: themeWrapper });
    for (const item of NAV_ITEMS) {
      const links = screen.getAllByRole('link');
      const match = links.find((l) => l.getAttribute('href') === item.href);
      expect(match).toBeDefined();
    }
  });

  it('has navigation role', () => {
    render(<BottomDock />, { wrapper: themeWrapper });
    expect(screen.getByRole('navigation')).toBeDefined();
  });

  it('has data-testid="dock"', () => {
    render(<BottomDock />, { wrapper: themeWrapper });
    expect(screen.getByTestId('dock')).toBeDefined();
  });

  it('shows active indicator on current route', () => {
    render(<BottomDock />, { wrapper: themeWrapper });
    // /dashboard link should have the active class
    const links = screen.getAllByRole('link');
    const dashboardLink = links.find((l) => l.getAttribute('href') === '/dashboard');
    expect(dashboardLink?.className).toContain('dock-item-active');
  });
});

describe('DockStatusBar', async () => {
  const { DockStatusBar } = await import('@/components/dock-status-bar');

  it('renders ThemeToggle', () => {
    render(<DockStatusBar />, { wrapper: themeWrapper });
    const toggle = screen.getByLabelText(/Switch to (amber|green) theme/);
    expect(toggle).toBeDefined();
  });

  it('renders NotificationBell', () => {
    render(<DockStatusBar />, { wrapper: themeWrapper });
    expect(screen.getByLabelText('Notifications')).toBeDefined();
  });

  it('renders UserMenu', () => {
    render(
      <DockStatusBar userName="Test User" userEmail="test@example.com" />,
      { wrapper: themeWrapper },
    );
    // UserMenu renders an avatar with initials
    expect(screen.getByText('TU')).toBeDefined();
  });

  it('has data-testid="dock-status-bar"', () => {
    render(<DockStatusBar />, { wrapper: themeWrapper });
    expect(screen.getByTestId('dock-status-bar')).toBeDefined();
  });
});

describe('ThemeToggle', () => {
  it('renders current theme label', () => {
    render(<ThemeToggle />, { wrapper: themeWrapper });
    expect(screen.getByText('[amber]')).toBeDefined();
  });
});

describe('UpgradeGate', () => {
  it('renders children normally for pro tier', () => {
    render(
      <SubscriptionProvider value={{ tier: 'pro', status: 'active', trialEnd: null, cancelAtPeriodEnd: false, currentPeriodEnd: null }}>
        <UpgradeGate>
          <div data-testid="content">Pro Feature</div>
        </UpgradeGate>
      </SubscriptionProvider>
    );
    const content = screen.getByTestId('content');
    expect(content).not.toHaveClass('opacity-40');
    expect(content).toHaveTextContent('Pro Feature');
  });

  it('dims content and shows lock for free tier', () => {
    render(
      <SubscriptionProvider value={{ tier: 'free', status: null, trialEnd: null, cancelAtPeriodEnd: false, currentPeriodEnd: null }}>
        <UpgradeGate>
          <div data-testid="content">Pro Feature</div>
        </UpgradeGate>
      </SubscriptionProvider>
    );
    const dimmedWrapper = screen.getByTestId('content').parentElement;
    expect(dimmedWrapper).toHaveClass('opacity-40');
    expect(screen.getByText('Pro')).toBeDefined();
  });

  it('defaults to free tier without provider', () => {
    render(
      <UpgradeGate>
        <div data-testid="content">Pro Feature</div>
      </UpgradeGate>
    );
    const dimmedWrapper = screen.getByTestId('content').parentElement;
    expect(dimmedWrapper).toHaveClass('opacity-40');
  });
});
