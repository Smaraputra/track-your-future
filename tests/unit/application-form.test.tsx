import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ApplicationForm } from '@/components/applications/application-form';

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

// Mock lucide-react (needed by RetroSelect via shadcn Select)
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
  XIcon: (props: Record<string, unknown>) => (
    <svg data-testid="icon-x" {...props} />
  ),
}));

const mockRoles = [
  { id: 'role-1', name: 'Frontend Developer' },
  { id: 'role-2', name: 'Backend Developer' },
];

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('ApplicationForm', () => {
  it('renders create mode heading', () => {
    render(<ApplicationForm mode="create" roles={mockRoles} />);
    expect(screen.getByRole('heading', { name: 'New Application' })).toBeDefined();
  });

  it('renders edit mode heading', () => {
    render(
      <ApplicationForm
        mode="edit"
        applicationId="app-1"
        roles={mockRoles}
        defaultValues={{ companyName: 'Acme', jobTitle: 'Engineer' }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Edit Application' })).toBeDefined();
  });

  it('renders all form fields', () => {
    render(<ApplicationForm mode="create" roles={mockRoles} />);
    expect(screen.getByPlaceholderText('e.g. Acme Corp')).toBeDefined();
    expect(screen.getByPlaceholderText('e.g. Software Engineer')).toBeDefined();
    expect(screen.getByPlaceholderText('https://example.com/job/123')).toBeDefined();
    expect(screen.getByPlaceholderText('Notes about this application...')).toBeDefined();
  });

  it('renders create button in create mode', () => {
    render(<ApplicationForm mode="create" roles={mockRoles} />);
    expect(screen.getByRole('button', { name: 'Create Application' })).toBeDefined();
  });

  it('renders save button in edit mode', () => {
    render(
      <ApplicationForm
        mode="edit"
        applicationId="app-1"
        roles={mockRoles}
        defaultValues={{ companyName: 'Acme', jobTitle: 'Engineer' }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDefined();
  });

  it('renders cancel button', () => {
    render(<ApplicationForm mode="create" roles={mockRoles} />);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDefined();
  });

  it('populates default values in edit mode', () => {
    render(
      <ApplicationForm
        mode="edit"
        applicationId="app-1"
        roles={mockRoles}
        defaultValues={{
          companyName: 'Acme Corp',
          jobTitle: 'Senior Engineer',
          jobUrl: 'https://example.com/job',
          notes: 'Great opportunity',
        }}
      />,
    );

    const companyInput = screen.getByPlaceholderText('e.g. Acme Corp') as HTMLInputElement;
    const titleInput = screen.getByPlaceholderText('e.g. Software Engineer') as HTMLInputElement;
    const urlInput = screen.getByPlaceholderText('https://example.com/job/123') as HTMLInputElement;

    expect(companyInput.value).toBe('Acme Corp');
    expect(titleInput.value).toBe('Senior Engineer');
    expect(urlInput.value).toBe('https://example.com/job');
  });

  it('renders field labels', () => {
    render(<ApplicationForm mode="create" roles={mockRoles} />);
    expect(screen.getByText('Company Name')).toBeDefined();
    expect(screen.getByText('Job Title')).toBeDefined();
    expect(screen.getByText('Job URL')).toBeDefined();
    expect(screen.getByText('Role Category')).toBeDefined();
    expect(screen.getByText('Status')).toBeDefined();
    expect(screen.getByText('Applied At')).toBeDefined();
    expect(screen.getByText('Notes')).toBeDefined();
  });

  it('renders description text for each mode', () => {
    const { unmount } = render(
      <ApplicationForm mode="create" roles={mockRoles} />,
    );
    expect(screen.getByText('Track a new job application')).toBeDefined();
    unmount();

    render(
      <ApplicationForm
        mode="edit"
        applicationId="app-1"
        roles={mockRoles}
        defaultValues={{ companyName: 'Acme', jobTitle: 'Engineer' }}
      />,
    );
    expect(screen.getByText('Update application details')).toBeDefined();
  });
});
