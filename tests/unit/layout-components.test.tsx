import { render, screen, fireEvent } from '@testing-library/react';
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NAV_ITEMS } from '@/components/nav-items';
import { ThemeToggle } from '@/components/theme-toggle';
import { UpgradeGate } from '@/components/upgrade-gate';
import { ThemeProvider } from '@/hooks/use-theme';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

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
    expect(hrefs).toContain('/documents');
    expect(hrefs).toContain('/settings');
  });
});

describe('Sidebar', async () => {
  // Dynamic import to ensure mock is applied
  const { Sidebar } = await import('@/components/sidebar');

  beforeEach(() => {
    localStorage.clear();
  });

  it('renders all nav items', () => {
    render(<Sidebar />, { wrapper: themeWrapper });
    for (const item of NAV_ITEMS) {
      expect(screen.getByText(item.label)).toBeDefined();
    }
  });

  it('has navigation role', () => {
    render(<Sidebar />, { wrapper: themeWrapper });
    expect(screen.getByRole('navigation')).toBeDefined();
  });

  it('collapse button toggles sidebar width', () => {
    render(<Sidebar />, { wrapper: themeWrapper });
    const collapseBtn = screen.getByLabelText('Collapse sidebar');
    fireEvent.click(collapseBtn);
    // After collapse, TYF text should not be visible
    expect(screen.queryByText('TYF')).toBeNull();
    // Expand button should now be visible
    expect(screen.getByLabelText('Expand sidebar')).toBeDefined();
  });

  it('persists collapse state to localStorage', () => {
    render(<Sidebar />, { wrapper: themeWrapper });
    fireEvent.click(screen.getByLabelText('Collapse sidebar'));
    expect(localStorage.getItem('tyf-sidebar-collapsed')).toBe('true');
  });
});

describe('ThemeToggle', () => {
  it('renders current theme label', () => {
    render(<ThemeToggle />, { wrapper: themeWrapper });
    expect(screen.getByText('[green]')).toBeDefined();
  });

  it('calls toggleTheme on click', () => {
    render(<ThemeToggle />, { wrapper: themeWrapper });
    const btn = screen.getByLabelText('Switch to amber theme');
    fireEvent.click(btn);
    expect(screen.getByText('[amber]')).toBeDefined();
  });
});

describe('Header', async () => {
  const { Header } = await import('@/components/header');

  it('renders page title', () => {
    render(<Header title="Dashboard" />, { wrapper: themeWrapper });
    expect(screen.getByText('Dashboard')).toBeDefined();
  });

  it('renders theme toggle', () => {
    render(<Header />, { wrapper: themeWrapper });
    // Theme toggle button should exist with either theme's aria-label
    const toggle = screen.getByLabelText(/Switch to (amber|green) theme/);
    expect(toggle).toBeDefined();
  });

  it('renders notification bell', () => {
    render(<Header />, { wrapper: themeWrapper });
    expect(screen.getByLabelText('Notifications')).toBeDefined();
  });

  it('renders mobile menu button', () => {
    render(<Header />, { wrapper: themeWrapper });
    expect(screen.getByLabelText('Open menu')).toBeDefined();
  });
});

describe('UpgradeGate', () => {
  it('renders children normally for pro tier', () => {
    render(
      <UpgradeGate tier="pro">
        <div data-testid="content">Pro Feature</div>
      </UpgradeGate>
    );
    const content = screen.getByTestId('content');
    expect(content).not.toHaveClass('opacity-40');
    expect(content).toHaveTextContent('Pro Feature');
  });

  it('dims content and shows lock for free tier', () => {
    render(
      <UpgradeGate tier="free">
        <div data-testid="content">Pro Feature</div>
      </UpgradeGate>
    );
    // Content should be dimmed
    const dimmedWrapper = screen.getByTestId('content').parentElement;
    expect(dimmedWrapper).toHaveClass('opacity-40');
    // Lock label should appear
    expect(screen.getByText('Pro')).toBeDefined();
  });
});
