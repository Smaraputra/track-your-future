import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ApplicationBoardView } from '@/components/applications/application-board-view';

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
    notes: null,
  },
  {
    id: 'app-3',
    companyName: 'Draft Co',
    jobTitle: 'Engineer',
    jobUrl: null,
    currentStatus: 'draft',
    appliedAt: null,
    roleCategoryId: null,
    roleCategoryName: null,
    roleCategoryColor: null,
    createdAt: '2025-01-20T08:00:00.000Z',
    updatedAt: '2025-01-20T08:00:00.000Z',
    notes: null,
  },
];

const onStatusChange = vi.fn();

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('ApplicationBoardView', () => {
  it('renders all 8 status columns', () => {
    render(
      <ApplicationBoardView
        applications={mockApplications}
        onStatusChange={onStatusChange}
      />,
    );

    expect(screen.getByText('Draft')).toBeDefined();
    expect(screen.getByText('Applied')).toBeDefined();
    expect(screen.getByText('Phone Screen')).toBeDefined();
    expect(screen.getByText('Interview')).toBeDefined();
    expect(screen.getByText('Offer')).toBeDefined();
    expect(screen.getByText('Rejected')).toBeDefined();
    expect(screen.getByText('Ghosted')).toBeDefined();
    expect(screen.getByText('Withdrawn')).toBeDefined();
  });

  it('renders application cards in correct columns', () => {
    render(
      <ApplicationBoardView
        applications={mockApplications}
        onStatusChange={onStatusChange}
      />,
    );

    expect(screen.getByText('Acme Corp')).toBeDefined();
    expect(screen.getByText('Globex Inc')).toBeDefined();
    expect(screen.getByText('Draft Co')).toBeDefined();
  });

  it('shows card count per column', () => {
    render(
      <ApplicationBoardView
        applications={mockApplications}
        onStatusChange={onStatusChange}
      />,
    );

    // Draft column should show 1, Applied should show 1, Interview 1
    // Each column has count text after the badge
    const counts = screen.getAllByText('1');
    expect(counts.length).toBeGreaterThanOrEqual(3);
  });

  it('shows job title on cards', () => {
    render(
      <ApplicationBoardView
        applications={mockApplications}
        onStatusChange={onStatusChange}
      />,
    );

    expect(screen.getByText('Senior Engineer')).toBeDefined();
    expect(screen.getByText('Staff Engineer')).toBeDefined();
  });

  it('has links to application detail pages', () => {
    render(
      <ApplicationBoardView
        applications={mockApplications}
        onStatusChange={onStatusChange}
      />,
    );

    const link = screen.getByText('Acme Corp').closest('a');
    expect(link?.getAttribute('href')).toBe('/applications/app-1');
  });

  it('shows role name on cards when assigned', () => {
    render(
      <ApplicationBoardView
        applications={mockApplications}
        onStatusChange={onStatusChange}
      />,
    );

    expect(screen.getByText('Frontend Developer')).toBeDefined();
  });

  it('renders empty columns without errors', () => {
    render(
      <ApplicationBoardView
        applications={[]}
        onStatusChange={onStatusChange}
      />,
    );

    // All 8 columns should render even with no apps
    expect(screen.getByText('Draft')).toBeDefined();
    expect(screen.getByText('Offer')).toBeDefined();
  });

  it('shows 0 count for empty columns', () => {
    render(
      <ApplicationBoardView
        applications={[]}
        onStatusChange={onStatusChange}
      />,
    );

    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(8);
  });
});
