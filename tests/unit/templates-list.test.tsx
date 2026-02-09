import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TemplateList } from '@/components/templates/template-list';
import { SubscriptionProvider } from '@/hooks/use-subscription';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/roles/role-1',
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
  ChevronUp: (props: Record<string, unknown>) => (
    <svg data-testid="icon-chevron-up" {...props} />
  ),
  ChevronDown: (props: Record<string, unknown>) => (
    <svg data-testid="icon-chevron-down" {...props} />
  ),
  Pencil: (props: Record<string, unknown>) => (
    <svg data-testid="icon-pencil" {...props} />
  ),
  Trash2: (props: Record<string, unknown>) => (
    <svg data-testid="icon-trash" {...props} />
  ),
  Plus: (props: Record<string, unknown>) => (
    <svg data-testid="icon-plus" {...props} />
  ),
  Copy: (props: Record<string, unknown>) => (
    <svg data-testid="icon-copy" {...props} />
  ),
  Check: (props: Record<string, unknown>) => (
    <svg data-testid="icon-check" {...props} />
  ),
  XIcon: (props: Record<string, unknown>) => (
    <svg data-testid="icon-x" {...props} />
  ),
}));

const mockTemplates = [
  {
    id: 'tpl-1',
    fieldKey: 'Years of experience',
    fieldValue: '5 years in frontend development',
    position: 0,
  },
  {
    id: 'tpl-2',
    fieldKey: 'Salary expectation',
    fieldValue: '120k-140k',
    position: 1,
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

describe('TemplateList', () => {
  it('shows empty state when no templates', () => {
    render(
      <TemplateList
        roleId="role-1"
        initialTemplates={[]}
        globalTemplateCount={0}
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('No Templates Yet')).toBeDefined();
    expect(screen.getByText('Add Your First Field')).toBeDefined();
  });

  it('renders template list with keys and values', () => {
    render(
      <TemplateList
        roleId="role-1"
        initialTemplates={mockTemplates}
        globalTemplateCount={2}
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('Years of experience')).toBeDefined();
    expect(screen.getByText('5 years in frontend development')).toBeDefined();
    expect(screen.getByText('Salary expectation')).toBeDefined();
    expect(screen.getByText('120k-140k')).toBeDefined();
  });

  it('shows template count with global limit for free tier', () => {
    render(
      <TemplateList
        roleId="role-1"
        initialTemplates={mockTemplates}
        globalTemplateCount={5}
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('2 templates (5 / 20 total)')).toBeDefined();
  });

  it('shows template count without limit for pro tier', () => {
    render(
      <TemplateList
        roleId="role-1"
        initialTemplates={mockTemplates}
        globalTemplateCount={5}
      />,
      { wrapper: proWrapper },
    );

    expect(screen.getByText('2 templates')).toBeDefined();
  });

  it('shows singular "template" for single item', () => {
    render(
      <TemplateList
        roleId="role-1"
        initialTemplates={[mockTemplates[0]]}
        globalTemplateCount={1}
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('1 template (1 / 20 total)')).toBeDefined();
  });

  it('disables up arrow on first item and down arrow on last', () => {
    render(
      <TemplateList
        roleId="role-1"
        initialTemplates={mockTemplates}
        globalTemplateCount={2}
      />,
      { wrapper: freeWrapper },
    );

    const upButtons = screen.getAllByLabelText(/Move .+ up/);
    const downButtons = screen.getAllByLabelText(/Move .+ down/);

    expect(upButtons[0]).toHaveProperty('disabled', true);
    expect(downButtons[downButtons.length - 1]).toHaveProperty(
      'disabled',
      true,
    );
  });

  it('enables down arrow on first item and up arrow on last', () => {
    render(
      <TemplateList
        roleId="role-1"
        initialTemplates={mockTemplates}
        globalTemplateCount={2}
      />,
      { wrapper: freeWrapper },
    );

    const upButtons = screen.getAllByLabelText(/Move .+ up/);
    const downButtons = screen.getAllByLabelText(/Move .+ down/);

    expect(downButtons[0]).toHaveProperty('disabled', false);
    expect(upButtons[upButtons.length - 1]).toHaveProperty('disabled', false);
  });

  it('enters edit mode when edit button clicked', () => {
    render(
      <TemplateList
        roleId="role-1"
        initialTemplates={mockTemplates}
        globalTemplateCount={2}
      />,
      { wrapper: freeWrapper },
    );

    const editButton = screen.getByLabelText('Edit Years of experience');
    fireEvent.click(editButton);

    // Should show edit form elements
    expect(screen.getByLabelText('Field Key')).toBeDefined();
    expect(screen.getByLabelText('Field Value')).toBeDefined();
  });

  it('shows add form when Add Field clicked', () => {
    render(
      <TemplateList
        roleId="role-1"
        initialTemplates={mockTemplates}
        globalTemplateCount={2}
      />,
      { wrapper: freeWrapper },
    );

    const addButton = screen.getByText('Add Field');
    fireEvent.click(addButton);

    expect(screen.getByLabelText('Field Key')).toBeDefined();
    expect(screen.getByLabelText('Field Value')).toBeDefined();
  });

  it('calls delete API when delete confirmed', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(
      <TemplateList
        roleId="role-1"
        initialTemplates={mockTemplates}
        globalTemplateCount={2}
      />,
      { wrapper: freeWrapper },
    );

    const deleteButton = screen.getByLabelText(
      'Delete Years of experience',
    );
    fireEvent.click(deleteButton);

    // Dialog should appear
    expect(screen.getByText('Delete Template')).toBeDefined();
    expect(
      screen.getByText(
        'Are you sure you want to delete "Years of experience"?',
      ),
    ).toBeDefined();
  });

  it('handles reorder - calls fetch on move down', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(
      <TemplateList
        roleId="role-1"
        initialTemplates={mockTemplates}
        globalTemplateCount={2}
      />,
      { wrapper: freeWrapper },
    );

    const moveDownButton = screen.getByLabelText(
      'Move Years of experience down',
    );
    fireEvent.click(moveDownButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/roles/role-1/templates/reorder',
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  it('copies value to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(
      <TemplateList
        roleId="role-1"
        initialTemplates={mockTemplates}
        globalTemplateCount={2}
      />,
      { wrapper: freeWrapper },
    );

    const copyButton = screen.getByLabelText(
      'Copy Years of experience',
    );
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        '5 years in frontend development',
      );
    });
  });

  it('shows limit message when at free tier global limit', () => {
    render(
      <TemplateList
        roleId="role-1"
        initialTemplates={mockTemplates}
        globalTemplateCount={20}
      />,
      { wrapper: freeWrapper },
    );

    expect(
      screen.getByText(/Free plan template limit reached/),
    ).toBeDefined();
    expect(screen.getByText('Upgrade to Pro')).toBeDefined();
  });

  it('does not show limit message for pro users', () => {
    render(
      <TemplateList
        roleId="role-1"
        initialTemplates={mockTemplates}
        globalTemplateCount={50}
      />,
      { wrapper: proWrapper },
    );

    expect(
      screen.queryByText(/Free plan template limit reached/),
    ).toBeNull();
  });

  it('disables Add Field button at global limit', () => {
    render(
      <TemplateList
        roleId="role-1"
        initialTemplates={mockTemplates}
        globalTemplateCount={20}
      />,
      { wrapper: freeWrapper },
    );

    const addButton = screen.getByText('Add Field').closest('button');
    expect(addButton).toHaveProperty('disabled', true);
  });
});
