import { render, screen, fireEvent } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ApplicationsPageContent } from '@/components/applications/applications-page-content';
import { SubscriptionProvider } from '@/hooks/use-subscription';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/applications',
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

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Plus: (props: Record<string, unknown>) => (
    <svg data-testid="icon-plus" {...props} />
  ),
  Briefcase: (props: Record<string, unknown>) => (
    <svg data-testid="icon-briefcase" {...props} />
  ),
  Pencil: (props: Record<string, unknown>) => (
    <svg data-testid="icon-pencil" {...props} />
  ),
  Trash2: (props: Record<string, unknown>) => (
    <svg data-testid="icon-trash" {...props} />
  ),
  List: (props: Record<string, unknown>) => (
    <svg data-testid="icon-list" {...props} />
  ),
  LayoutGrid: (props: Record<string, unknown>) => (
    <svg data-testid="icon-grid" {...props} />
  ),
  XIcon: (props: Record<string, unknown>) => (
    <svg data-testid="icon-x" {...props} />
  ),
  CheckIcon: (props: Record<string, unknown>) => (
    <svg data-testid="icon-check" {...props} />
  ),
  ChevronDownIcon: (props: Record<string, unknown>) => (
    <svg data-testid="icon-chevron-down" {...props} />
  ),
  ChevronUpIcon: (props: Record<string, unknown>) => (
    <svg data-testid="icon-chevron-up" {...props} />
  ),
}));

const mockRoles = [
  { id: 'role-1', name: 'Frontend Developer', color: '#22c55e' },
  { id: 'role-2', name: 'Backend Developer', color: '#3b82f6' },
];

const mockApplications = [
  {
    id: 'app-1',
    companyName: 'Acme Corp',
    jobTitle: 'Senior Engineer',
    jobUrl: 'https://acme.com/jobs/1',
    currentStatus: 'applied',
    appliedAt: '2025-01-15T10:00:00.000Z',
    roleCategoryId: 'role-1',
    roleCategoryName: 'Frontend Developer',
    roleCategoryColor: '#22c55e',
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2025-01-16T10:00:00.000Z',
    notes: null,
  },
  {
    id: 'app-2',
    companyName: 'Globex Inc',
    jobTitle: 'Staff Engineer',
    jobUrl: null,
    currentStatus: 'interview',
    appliedAt: '2025-01-10T08:00:00.000Z',
    roleCategoryId: null,
    roleCategoryName: null,
    roleCategoryColor: null,
    createdAt: '2025-01-10T08:00:00.000Z',
    updatedAt: '2025-01-12T08:00:00.000Z',
    notes: 'Good company',
  },
];

const freeWrapper = ({ children }: { children: ReactNode }) => (
  <SubscriptionProvider
    value={{
      tier: 'free',
      status: null,
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

describe('ApplicationsPageContent', () => {
  it('shows empty state when no applications', () => {
    render(
      <ApplicationsPageContent
        initialApplications={[]}
        roles={mockRoles}
        applicationCount={0}
        applicationLimit={25}
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('No Applications Yet')).toBeDefined();
    expect(
      screen.getByText('Create your first application to start tracking.'),
    ).toBeDefined();
  });

  it('shows application count with limit for free tier', () => {
    render(
      <ApplicationsPageContent
        initialApplications={mockApplications}
        roles={mockRoles}
        applicationCount={2}
        applicationLimit={25}
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('2 applications / 25')).toBeDefined();
  });

  it('shows application count without limit for pro tier', () => {
    render(
      <ApplicationsPageContent
        initialApplications={mockApplications}
        roles={mockRoles}
        applicationCount={2}
        applicationLimit={null}
      />,
      { wrapper: proWrapper },
    );

    expect(screen.getByText('2 applications')).toBeDefined();
  });

  it('renders application list with company names', () => {
    render(
      <ApplicationsPageContent
        initialApplications={mockApplications}
        roles={mockRoles}
        applicationCount={2}
        applicationLimit={25}
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('Acme Corp')).toBeDefined();
    expect(screen.getByText('Globex Inc')).toBeDefined();
  });

  it('renders job titles', () => {
    render(
      <ApplicationsPageContent
        initialApplications={mockApplications}
        roles={mockRoles}
        applicationCount={2}
        applicationLimit={25}
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('Senior Engineer')).toBeDefined();
    expect(screen.getByText('Staff Engineer')).toBeDefined();
  });

  it('renders status badges', () => {
    render(
      <ApplicationsPageContent
        initialApplications={mockApplications}
        roles={mockRoles}
        applicationCount={2}
        applicationLimit={25}
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('Applied')).toBeDefined();
    expect(screen.getByText('Interview')).toBeDefined();
  });

  it('renders role name when assigned', () => {
    render(
      <ApplicationsPageContent
        initialApplications={mockApplications}
        roles={mockRoles}
        applicationCount={2}
        applicationLimit={25}
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('Frontend Developer')).toBeDefined();
  });

  it('has view toggle buttons', () => {
    render(
      <ApplicationsPageContent
        initialApplications={mockApplications}
        roles={mockRoles}
        applicationCount={2}
        applicationLimit={25}
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByLabelText('List view')).toBeDefined();
    expect(screen.getByLabelText('Board view')).toBeDefined();
  });

  it('has edit links for each application', () => {
    render(
      <ApplicationsPageContent
        initialApplications={mockApplications}
        roles={mockRoles}
        applicationCount={2}
        applicationLimit={25}
      />,
      { wrapper: freeWrapper },
    );

    // Switch to list view (board is default)
    fireEvent.click(screen.getByLabelText('List view'));

    const editLink = screen.getByLabelText('Edit Acme Corp');
    expect(editLink.closest('a')?.getAttribute('href')).toBe(
      '/applications/app-1/edit',
    );
  });

  it('has delete buttons for each application', () => {
    render(
      <ApplicationsPageContent
        initialApplications={mockApplications}
        roles={mockRoles}
        applicationCount={2}
        applicationLimit={25}
      />,
      { wrapper: freeWrapper },
    );

    // Switch to list view (board is default)
    fireEvent.click(screen.getByLabelText('List view'));

    expect(screen.getByLabelText('Delete Acme Corp')).toBeDefined();
    expect(screen.getByLabelText('Delete Globex Inc')).toBeDefined();
  });

  it('shows limit message when at free tier limit', () => {
    render(
      <ApplicationsPageContent
        initialApplications={mockApplications}
        roles={mockRoles}
        applicationCount={25}
        applicationLimit={25}
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText(/Free plan application limit reached/)).toBeDefined();
    expect(screen.getByText('Upgrade to Pro')).toBeDefined();
  });

  it('does not show limit message for pro users', () => {
    render(
      <ApplicationsPageContent
        initialApplications={mockApplications}
        roles={mockRoles}
        applicationCount={2}
        applicationLimit={null}
      />,
      { wrapper: proWrapper },
    );

    expect(screen.queryByText(/Free plan application limit reached/)).toBeNull();
  });
});
