import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ApplicationDetail } from '@/components/applications/application-detail';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/applications/app-1',
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
  Pencil: (props: Record<string, unknown>) => (
    <svg data-testid="icon-pencil" {...props} />
  ),
  Trash2: (props: Record<string, unknown>) => (
    <svg data-testid="icon-trash" {...props} />
  ),
  ExternalLink: (props: Record<string, unknown>) => (
    <svg data-testid="icon-external" {...props} />
  ),
  Lock: (props: Record<string, unknown>) => (
    <svg data-testid="icon-lock" {...props} />
  ),
  FileText: (props: Record<string, unknown>) => (
    <svg data-testid="icon-file" {...props} />
  ),
  X: (props: Record<string, unknown>) => (
    <svg data-testid="icon-x" {...props} />
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
  Sparkles: (props: Record<string, unknown>) => (
    <svg data-testid="icon-sparkles" {...props} />
  ),
  Loader2: (props: Record<string, unknown>) => (
    <svg data-testid="icon-loader" {...props} />
  ),
}));

const mockApplication = {
  id: 'app-1',
  companyName: 'Acme Corp',
  jobTitle: 'Senior Engineer',
  jobUrl: 'https://acme.com/jobs/1',
  currentStatus: 'interview',
  appliedAt: '2025-01-15T10:00:00.000Z',
  roleCategoryId: 'role-1',
  roleCategoryName: 'Frontend Developer',
  roleCategoryColor: '#22c55e',
  createdAt: '2025-01-15T10:00:00.000Z',
  updatedAt: '2025-01-16T10:00:00.000Z',
  notes: 'Great opportunity with good culture.',
};

const mockStatusHistory = [
  {
    id: 'h-1',
    fromStatus: 'applied',
    toStatus: 'interview',
    changedAt: '2025-01-16T10:00:00.000Z',
  },
  {
    id: 'h-2',
    fromStatus: 'draft',
    toStatus: 'applied',
    changedAt: '2025-01-15T10:00:00.000Z',
  },
];

const mockLinkedDocuments = [
  {
    id: 'doc-1',
    fileName: 'resume.pdf',
    documentType: 'cv',
    customTypeName: null,
  },
];

const mockAvailableDocuments = [
  { id: 'doc-1', fileName: 'resume.pdf', documentType: 'cv' },
  { id: 'doc-2', fileName: 'cover-letter.pdf', documentType: 'cover_letter' },
];

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('ApplicationDetail', () => {
  it('renders company name as heading', () => {
    render(
      <ApplicationDetail
        application={mockApplication}
        statusHistory={mockStatusHistory}
        linkedDocuments={mockLinkedDocuments}
        availableDocuments={mockAvailableDocuments}
        isPro={false}
        hasParsedCv={false}
        jobAnalysis={null}
        matchScore={null}
      />,
    );
    expect(
      screen.getByRole('heading', { name: 'Acme Corp' }),
    ).toBeDefined();
  });

  it('renders job title', () => {
    render(
      <ApplicationDetail
        application={mockApplication}
        statusHistory={mockStatusHistory}
        linkedDocuments={mockLinkedDocuments}
        availableDocuments={mockAvailableDocuments}
        isPro={false}
        hasParsedCv={false}
        jobAnalysis={null}
        matchScore={null}
      />,
    );
    expect(screen.getByText('Senior Engineer')).toBeDefined();
  });

  it('has edit and delete buttons', () => {
    render(
      <ApplicationDetail
        application={mockApplication}
        statusHistory={mockStatusHistory}
        linkedDocuments={mockLinkedDocuments}
        availableDocuments={mockAvailableDocuments}
        isPro={false}
        hasParsedCv={false}
        jobAnalysis={null}
        matchScore={null}
      />,
    );
    expect(screen.getByText('Edit')).toBeDefined();
    expect(screen.getByText('Delete')).toBeDefined();
  });

  it('shows job URL link', () => {
    render(
      <ApplicationDetail
        application={mockApplication}
        statusHistory={mockStatusHistory}
        linkedDocuments={mockLinkedDocuments}
        availableDocuments={mockAvailableDocuments}
        isPro={false}
        hasParsedCv={false}
        jobAnalysis={null}
        matchScore={null}
      />,
    );
    const link = screen.getByText('View posting');
    expect(link.closest('a')?.getAttribute('href')).toBe(
      'https://acme.com/jobs/1',
    );
  });

  it('shows role category name', () => {
    render(
      <ApplicationDetail
        application={mockApplication}
        statusHistory={mockStatusHistory}
        linkedDocuments={mockLinkedDocuments}
        availableDocuments={mockAvailableDocuments}
        isPro={false}
        hasParsedCv={false}
        jobAnalysis={null}
        matchScore={null}
      />,
    );
    expect(screen.getByText('Frontend Developer')).toBeDefined();
  });

  it('shows notes section', () => {
    render(
      <ApplicationDetail
        application={mockApplication}
        statusHistory={mockStatusHistory}
        linkedDocuments={mockLinkedDocuments}
        availableDocuments={mockAvailableDocuments}
        isPro={false}
        hasParsedCv={false}
        jobAnalysis={null}
        matchScore={null}
      />,
    );
    expect(
      screen.getByText('Great opportunity with good culture.'),
    ).toBeDefined();
  });

  it('renders status history timeline', () => {
    render(
      <ApplicationDetail
        application={mockApplication}
        statusHistory={mockStatusHistory}
        linkedDocuments={mockLinkedDocuments}
        availableDocuments={mockAvailableDocuments}
        isPro={false}
        hasParsedCv={false}
        jobAnalysis={null}
        matchScore={null}
      />,
    );
    expect(
      screen.getByRole('heading', { name: 'Status History' }),
    ).toBeDefined();
  });

  it('renders linked documents section', () => {
    render(
      <ApplicationDetail
        application={mockApplication}
        statusHistory={mockStatusHistory}
        linkedDocuments={mockLinkedDocuments}
        availableDocuments={mockAvailableDocuments}
        isPro={false}
        hasParsedCv={false}
        jobAnalysis={null}
        matchScore={null}
      />,
    );
    expect(screen.getByText('resume.pdf')).toBeDefined();
  });

  it('renders Match Score section and AI placeholder cards', () => {
    render(
      <ApplicationDetail
        application={mockApplication}
        statusHistory={mockStatusHistory}
        linkedDocuments={mockLinkedDocuments}
        availableDocuments={mockAvailableDocuments}
        isPro={false}
        hasParsedCv={false}
        jobAnalysis={null}
        matchScore={null}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Match Score' })).toBeDefined();
    expect(screen.getByText('Cover Letter')).toBeDefined();
    expect(screen.getByText('Interview Prep')).toBeDefined();
    expect(screen.getByText('Resume Suggestions')).toBeDefined();
  });

  it('shows match score empty state when no CV and no JD', () => {
    render(
      <ApplicationDetail
        application={mockApplication}
        statusHistory={mockStatusHistory}
        linkedDocuments={mockLinkedDocuments}
        availableDocuments={mockAvailableDocuments}
        isPro={false}
        hasParsedCv={false}
        jobAnalysis={null}
        matchScore={null}
      />,
    );
    expect(
      screen.getByText('Parse a CV and extract the JD to enable match scoring'),
    ).toBeDefined();
  });
});
