import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { SubscriptionProvider } from '@/hooks/use-subscription';

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
vi.mock('lucide-react', () => ({
  Briefcase: (props: Record<string, unknown>) => (
    <svg data-testid="icon-briefcase" {...props} />
  ),
  Activity: (props: Record<string, unknown>) => (
    <svg data-testid="icon-activity" {...props} />
  ),
  Phone: (props: Record<string, unknown>) => (
    <svg data-testid="icon-phone" {...props} />
  ),
  Trophy: (props: Record<string, unknown>) => (
    <svg data-testid="icon-trophy" {...props} />
  ),
  AlertTriangle: (props: Record<string, unknown>) => (
    <svg data-testid="icon-alert" {...props} />
  ),
  Zap: (props: Record<string, unknown>) => (
    <svg data-testid="icon-zap" {...props} />
  ),
}));

const defaultStats = {
  total: 15,
  active: 8,
  interviews: 3,
  offers: 1,
};

const mockStaleApps = [
  {
    id: 'app-1',
    companyName: 'Acme Corp',
    jobTitle: 'Senior Engineer',
    currentStatus: 'applied',
    updatedAt: '2024-01-01T00:00:00.000Z',
    roleCategoryName: 'Frontend',
    roleCategoryColor: '#22c55e',
  },
];

const mockActivity = [
  {
    id: 'hist-1',
    applicationId: 'app-2',
    fromStatus: 'applied',
    toStatus: 'interview',
    changedAt: new Date().toISOString(),
    companyName: 'Globex Inc',
    jobTitle: 'Staff Engineer',
  },
  {
    id: 'hist-2',
    applicationId: 'app-3',
    fromStatus: null,
    toStatus: 'draft',
    changedAt: new Date(Date.now() - 86400000).toISOString(),
    companyName: 'Initech',
    jobTitle: 'Backend Dev',
  },
];

const mockRoles = [
  { id: 'role-1', name: 'Frontend Developer', color: '#22c55e', appCount: 5 },
  { id: 'role-2', name: 'Backend Developer', color: '#3b82f6', appCount: 3 },
];

const freeWrapper = ({ children }: { children: ReactNode }) => (
  <SubscriptionProvider
    value={{
      tier: 'free',
      status: 'active',
      trialEnd: null,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
    }}
  >
    {children}
  </SubscriptionProvider>
);

const proWrapper = ({ children }: { children: ReactNode }) => (
  <SubscriptionProvider
    value={{
      tier: 'pro',
      status: 'active',
      trialEnd: null,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
    }}
  >
    {children}
  </SubscriptionProvider>
);

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('DashboardContent', () => {
  it('renders stat cards with correct values', () => {
    render(
      <DashboardContent
        stats={defaultStats}
        staleApps={[]}
        recentActivity={[]}
        roleCategories={[]}
        tier="pro"
      />,
      { wrapper: proWrapper },
    );

    expect(screen.getByText('15')).toBeDefined();
    expect(screen.getByText('8')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByText('Total Applications')).toBeDefined();
    expect(screen.getByText('Active')).toBeDefined();
    expect(screen.getByText('Interviews')).toBeDefined();
    expect(screen.getByText('Offers')).toBeDefined();
  });

  it('renders stale apps section when stale apps exist', () => {
    render(
      <DashboardContent
        stats={defaultStats}
        staleApps={mockStaleApps}
        recentActivity={[]}
        roleCategories={[]}
        tier="pro"
      />,
      { wrapper: proWrapper },
    );

    expect(screen.getByText('Needs Attention (1)')).toBeDefined();
    expect(screen.getByText(/Acme Corp - Senior Engineer/)).toBeDefined();
  });

  it('does not render stale section when no stale apps', () => {
    render(
      <DashboardContent
        stats={defaultStats}
        staleApps={[]}
        recentActivity={[]}
        roleCategories={[]}
        tier="pro"
      />,
      { wrapper: proWrapper },
    );

    expect(screen.queryByText(/Needs Attention/)).toBeNull();
  });

  it('renders recent activity feed', () => {
    render(
      <DashboardContent
        stats={defaultStats}
        staleApps={[]}
        recentActivity={mockActivity}
        roleCategories={[]}
        tier="pro"
      />,
      { wrapper: proWrapper },
    );

    expect(screen.getByText('Recent Activity')).toBeDefined();
    expect(screen.getByText('Globex Inc')).toBeDefined();
    expect(screen.getByText('Initech')).toBeDefined();
  });

  it('renders activity with status transitions', () => {
    render(
      <DashboardContent
        stats={defaultStats}
        staleApps={[]}
        recentActivity={mockActivity}
        roleCategories={[]}
        tier="pro"
      />,
      { wrapper: proWrapper },
    );

    // applied -> interview transition
    expect(screen.getByText(/applied/)).toBeDefined();
    expect(screen.getByText(/interview/)).toBeDefined();
    // null -> draft (new app)
    expect(screen.getByText(/set to draft/)).toBeDefined();
  });

  it('renders empty activity message', () => {
    render(
      <DashboardContent
        stats={defaultStats}
        staleApps={[]}
        recentActivity={[]}
        roleCategories={[]}
        tier="pro"
      />,
      { wrapper: proWrapper },
    );

    expect(
      screen.getByText(/No recent activity/),
    ).toBeDefined();
  });

  it('renders role categories with app counts', () => {
    render(
      <DashboardContent
        stats={defaultStats}
        staleApps={[]}
        recentActivity={[]}
        roleCategories={mockRoles}
        tier="pro"
      />,
      { wrapper: proWrapper },
    );

    expect(screen.getByText('Roles')).toBeDefined();
    expect(screen.getByText('Frontend Developer')).toBeDefined();
    expect(screen.getByText('5 apps')).toBeDefined();
    expect(screen.getByText('Backend Developer')).toBeDefined();
    expect(screen.getByText('3 apps')).toBeDefined();
  });

  it('renders empty roles message with create link', () => {
    render(
      <DashboardContent
        stats={defaultStats}
        staleApps={[]}
        recentActivity={[]}
        roleCategories={[]}
        tier="pro"
      />,
      { wrapper: proWrapper },
    );

    expect(screen.getByText('Create your first role')).toBeDefined();
    const link = screen.getByText('Create your first role');
    expect(link.closest('a')?.getAttribute('href')).toBe('/roles');
  });

  it('renders quick navigation links', () => {
    render(
      <DashboardContent
        stats={defaultStats}
        staleApps={[]}
        recentActivity={[]}
        roleCategories={[]}
        tier="pro"
      />,
      { wrapper: proWrapper },
    );

    expect(screen.getByText('All Applications')).toBeDefined();
    expect(screen.getByText('All Roles')).toBeDefined();
    expect(screen.getByText('Documents')).toBeDefined();
  });

  it('shows upgrade CTA for free tier', () => {
    render(
      <DashboardContent
        stats={defaultStats}
        staleApps={[]}
        recentActivity={[]}
        roleCategories={[]}
        tier="free"
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('Upgrade to Pro')).toBeDefined();
    expect(screen.getByText('View Plans')).toBeDefined();
  });

  it('hides upgrade CTA for pro tier', () => {
    render(
      <DashboardContent
        stats={defaultStats}
        staleApps={[]}
        recentActivity={[]}
        roleCategories={[]}
        tier="pro"
      />,
      { wrapper: proWrapper },
    );

    expect(screen.queryByText('Upgrade to Pro')).toBeNull();
  });

  it('renders stale app links to application detail', () => {
    render(
      <DashboardContent
        stats={defaultStats}
        staleApps={mockStaleApps}
        recentActivity={[]}
        roleCategories={[]}
        tier="pro"
      />,
      { wrapper: proWrapper },
    );

    const link = screen.getByText(/Acme Corp/).closest('a');
    expect(link?.getAttribute('href')).toBe('/applications/app-1');
  });

  it('renders activity links to application detail', () => {
    render(
      <DashboardContent
        stats={defaultStats}
        staleApps={[]}
        recentActivity={mockActivity}
        roleCategories={[]}
        tier="pro"
      />,
      { wrapper: proWrapper },
    );

    const link = screen.getByText('Globex Inc').closest('a');
    expect(link?.getAttribute('href')).toBe('/applications/app-2');
  });

  it('renders role category color indicators', () => {
    render(
      <DashboardContent
        stats={defaultStats}
        staleApps={[]}
        recentActivity={[]}
        roleCategories={mockRoles}
        tier="pro"
      />,
      { wrapper: proWrapper },
    );

    const roleLink = screen.getByText('Frontend Developer').closest('a');
    const dot = roleLink?.querySelector('span[style]');
    expect(dot).toBeDefined();
  });

  it('renders singular "app" for count of 1', () => {
    const singleRole = [
      { id: 'role-1', name: 'Solo Role', color: '#fff', appCount: 1 },
    ];

    render(
      <DashboardContent
        stats={defaultStats}
        staleApps={[]}
        recentActivity={[]}
        roleCategories={singleRole}
        tier="pro"
      />,
      { wrapper: proWrapper },
    );

    expect(screen.getByText('1 app')).toBeDefined();
  });

  it('renders stale app days ago count', () => {
    render(
      <DashboardContent
        stats={defaultStats}
        staleApps={mockStaleApps}
        recentActivity={[]}
        roleCategories={[]}
        tier="pro"
      />,
      { wrapper: proWrapper },
    );

    expect(screen.getByText(/days since last update/)).toBeDefined();
  });

  it('renders all four stat card icons', () => {
    render(
      <DashboardContent
        stats={defaultStats}
        staleApps={[]}
        recentActivity={[]}
        roleCategories={[]}
        tier="pro"
      />,
      { wrapper: proWrapper },
    );

    expect(screen.getByTestId('icon-briefcase')).toBeDefined();
    expect(screen.getByTestId('icon-activity')).toBeDefined();
    expect(screen.getByTestId('icon-phone')).toBeDefined();
    expect(screen.getByTestId('icon-trophy')).toBeDefined();
  });

  it('renders with all zero stats', () => {
    render(
      <DashboardContent
        stats={{ total: 0, active: 0, interviews: 0, offers: 0 }}
        staleApps={[]}
        recentActivity={[]}
        roleCategories={[]}
        tier="free"
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getAllByText('0')).toHaveLength(4);
  });
});
