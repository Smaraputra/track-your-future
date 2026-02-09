import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DocumentsPageContent } from '@/components/documents/documents-page-content';
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
  Upload: (props: Record<string, unknown>) => (
    <svg data-testid="icon-upload" {...props} />
  ),
  FileText: (props: Record<string, unknown>) => (
    <svg data-testid="icon-file-text" {...props} />
  ),
  Download: (props: Record<string, unknown>) => (
    <svg data-testid="icon-download" {...props} />
  ),
  Trash2: (props: Record<string, unknown>) => (
    <svg data-testid="icon-trash" {...props} />
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
  XIcon: (props: Record<string, unknown>) => (
    <svg data-testid="icon-x" {...props} />
  ),
  Sparkles: (props: Record<string, unknown>) => (
    <svg data-testid="icon-sparkles" {...props} />
  ),
  Loader2: (props: Record<string, unknown>) => (
    <svg data-testid="icon-loader" {...props} />
  ),
}));

const mockDocs = [
  {
    id: 'doc-1',
    fileName: 'resume.pdf',
    documentType: 'cv',
    customTypeName: null,
    mimeType: 'application/pdf',
    fileSizeBytes: 102400,
    version: 1,
    createdAt: '2024-01-15T10:00:00Z',
    roleCategoryId: 'role-1',
    roleCategoryName: 'Frontend',
    roleCategoryColor: '#22c55e',
    parsedProfileId: null,
  },
  {
    id: 'doc-2',
    fileName: 'cover.docx',
    documentType: 'cover_letter',
    customTypeName: null,
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSizeBytes: 51200,
    version: 2,
    createdAt: '2024-01-14T10:00:00Z',
    roleCategoryId: null,
    roleCategoryName: null,
    roleCategoryColor: null,
    parsedProfileId: null,
  },
];

const mockRoles = [
  { id: 'role-1', name: 'Frontend', color: '#22c55e' },
  { id: 'role-2', name: 'Backend', color: '#3b82f6' },
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

describe('DocumentsPageContent', () => {
  it('renders document count', () => {
    render(
      <DocumentsPageContent
        initialDocuments={mockDocs}
        roles={mockRoles}
        documentCount={2}
        documentLimit={10}
        storageUsed={153600}
        storageLimit={50 * 1024 * 1024}
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('2 documents / 10')).toBeDefined();
  });

  it('renders document file names', () => {
    render(
      <DocumentsPageContent
        initialDocuments={mockDocs}
        roles={mockRoles}
        documentCount={2}
        documentLimit={10}
        storageUsed={153600}
        storageLimit={50 * 1024 * 1024}
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('resume.pdf')).toBeDefined();
    expect(screen.getByText('cover.docx')).toBeDefined();
  });

  it('renders document type badges', () => {
    render(
      <DocumentsPageContent
        initialDocuments={mockDocs}
        roles={mockRoles}
        documentCount={2}
        documentLimit={10}
        storageUsed={153600}
        storageLimit={50 * 1024 * 1024}
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('CV')).toBeDefined();
    expect(screen.getByText('Cover Letter')).toBeDefined();
  });

  it('renders role badge for documents with role', () => {
    render(
      <DocumentsPageContent
        initialDocuments={mockDocs}
        roles={mockRoles}
        documentCount={2}
        documentLimit={10}
        storageUsed={153600}
        storageLimit={50 * 1024 * 1024}
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('Frontend')).toBeDefined();
  });

  it('shows version for documents with version > 1', () => {
    render(
      <DocumentsPageContent
        initialDocuments={mockDocs}
        roles={mockRoles}
        documentCount={2}
        documentLimit={10}
        storageUsed={153600}
        storageLimit={50 * 1024 * 1024}
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('v2')).toBeDefined();
  });

  it('renders empty state when no documents', () => {
    render(
      <DocumentsPageContent
        initialDocuments={[]}
        roles={mockRoles}
        documentCount={0}
        documentLimit={10}
        storageUsed={0}
        storageLimit={50 * 1024 * 1024}
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('No Documents Yet')).toBeDefined();
    expect(
      screen.getByText(
        'Upload CVs, cover letters, and other documents to get started.',
      ),
    ).toBeDefined();
  });

  it('shows storage indicator', () => {
    render(
      <DocumentsPageContent
        initialDocuments={mockDocs}
        roles={mockRoles}
        documentCount={2}
        documentLimit={10}
        storageUsed={153600}
        storageLimit={50 * 1024 * 1024}
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('Storage')).toBeDefined();
  });

  it('shows upgrade message when at limit on free plan', () => {
    render(
      <DocumentsPageContent
        initialDocuments={mockDocs}
        roles={mockRoles}
        documentCount={10}
        documentLimit={10}
        storageUsed={153600}
        storageLimit={50 * 1024 * 1024}
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('Upgrade to Pro')).toBeDefined();
  });

  it('does not show upgrade message for pro users', () => {
    render(
      <DocumentsPageContent
        initialDocuments={mockDocs}
        roles={mockRoles}
        documentCount={10}
        documentLimit={null}
        storageUsed={153600}
        storageLimit={2 * 1024 * 1024 * 1024}
      />,
      { wrapper: proWrapper },
    );

    expect(screen.queryByText('Upgrade to Pro')).toBeNull();
  });
});
