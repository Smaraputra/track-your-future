import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RoleList } from '@/components/roles/role-list';
import { RoleColorBadge } from '@/components/roles/role-color-badge';
import { SubscriptionProvider } from '@/hooks/use-subscription';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/roles',
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
  Lock: (props: Record<string, unknown>) => (
    <svg data-testid="icon-lock" {...props} />
  ),
}));

const mockRoles = [
  {
    id: 'role-1',
    name: 'Frontend Developer',
    description: 'Frontend engineering roles',
    color: '#22c55e',
    position: 0,
  },
  {
    id: 'role-2',
    name: 'Backend Developer',
    description: null,
    color: '#3b82f6',
    position: 1,
  },
];

const freeWrapper = ({ children }: { children: ReactNode }) => (
  <SubscriptionProvider value={{
    tier: 'free',
    status: null,
    trialEnd: null,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
  }}>
    {children}
  </SubscriptionProvider>
);

const proWrapper = ({ children }: { children: ReactNode }) => (
  <SubscriptionProvider value={{
    tier: 'pro',
    status: 'active',
    trialEnd: null,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
  }}>
    {children}
  </SubscriptionProvider>
);

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('RoleColorBadge', () => {
  it('renders with a color', () => {
    const { container } = render(<RoleColorBadge color="#22c55e" />);
    const dot = container.querySelector('span span') as HTMLElement;
    expect(dot).toBeDefined();
    expect(dot.style.backgroundColor).toBeTruthy();
  });

  it('renders fallback for null color', () => {
    const { container } = render(<RoleColorBadge color={null} />);
    const dot = container.querySelector('span span') as HTMLElement;
    expect(dot.style.backgroundColor).toBeTruthy();
  });
});

describe('RoleList', () => {
  const onDeleteRequest = vi.fn();

  it('shows empty state when no roles', () => {
    render(
      <RoleList initialRoles={[]} onDeleteRequest={onDeleteRequest} />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('No Roles Yet')).toBeDefined();
    expect(screen.getByText('Create Your First Role')).toBeDefined();
  });

  it('renders role list with names and descriptions', () => {
    render(
      <RoleList initialRoles={mockRoles} onDeleteRequest={onDeleteRequest} />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('Frontend Developer')).toBeDefined();
    expect(screen.getByText('Backend Developer')).toBeDefined();
    expect(screen.getByText('Frontend engineering roles')).toBeDefined();
  });

  it('shows role count with limit for free tier', () => {
    render(
      <RoleList initialRoles={mockRoles} onDeleteRequest={onDeleteRequest} />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('2 roles / 3 max')).toBeDefined();
  });

  it('shows role count without limit for pro tier', () => {
    render(
      <RoleList initialRoles={mockRoles} onDeleteRequest={onDeleteRequest} />,
      { wrapper: proWrapper },
    );

    expect(screen.getByText('2 roles')).toBeDefined();
  });

  it('disables up arrow on first item and down arrow on last', () => {
    render(
      <RoleList initialRoles={mockRoles} onDeleteRequest={onDeleteRequest} />,
      { wrapper: freeWrapper },
    );

    const upButtons = screen.getAllByLabelText(/Move .+ up/);
    const downButtons = screen.getAllByLabelText(/Move .+ down/);

    expect(upButtons[0]).toHaveProperty('disabled', true);
    expect(downButtons[downButtons.length - 1]).toHaveProperty('disabled', true);
  });

  it('enables down arrow on first item and up arrow on last', () => {
    render(
      <RoleList initialRoles={mockRoles} onDeleteRequest={onDeleteRequest} />,
      { wrapper: freeWrapper },
    );

    const upButtons = screen.getAllByLabelText(/Move .+ up/);
    const downButtons = screen.getAllByLabelText(/Move .+ down/);

    expect(downButtons[0]).toHaveProperty('disabled', false);
    expect(upButtons[upButtons.length - 1]).toHaveProperty('disabled', false);
  });

  it('calls onDeleteRequest when delete button clicked', () => {
    render(
      <RoleList initialRoles={mockRoles} onDeleteRequest={onDeleteRequest} />,
      { wrapper: freeWrapper },
    );

    const deleteButton = screen.getByLabelText('Delete Frontend Developer');
    fireEvent.click(deleteButton);
    expect(onDeleteRequest).toHaveBeenCalledWith(mockRoles[0]);
  });

  it('has edit links for each role', () => {
    render(
      <RoleList initialRoles={mockRoles} onDeleteRequest={onDeleteRequest} />,
      { wrapper: freeWrapper },
    );

    const editLink = screen.getByLabelText('Edit Frontend Developer');
    expect(editLink.getAttribute('href')).toBe('/roles/role-1/edit');
  });

  it('has detail links for each role name', () => {
    render(
      <RoleList initialRoles={mockRoles} onDeleteRequest={onDeleteRequest} />,
      { wrapper: freeWrapper },
    );

    const link = screen.getByText('Frontend Developer');
    expect(link.closest('a')?.getAttribute('href')).toBe('/roles/role-1');
  });

  it('shows limit message when at free tier limit', () => {
    const threeRoles = [
      ...mockRoles,
      { id: 'role-3', name: 'DevOps', description: null, color: '#ef4444', position: 2 },
    ];
    render(
      <RoleList initialRoles={threeRoles} onDeleteRequest={onDeleteRequest} />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText(/Free plan limit reached/)).toBeDefined();
    expect(screen.getByText('Upgrade to Pro')).toBeDefined();
  });

  it('does not show limit message for pro users', () => {
    render(
      <RoleList initialRoles={mockRoles} onDeleteRequest={onDeleteRequest} />,
      { wrapper: proWrapper },
    );

    expect(screen.queryByText(/Free plan limit reached/)).toBeNull();
  });

  it('handles reorder - calls fetch on move down', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(
      <RoleList initialRoles={mockRoles} onDeleteRequest={onDeleteRequest} />,
      { wrapper: freeWrapper },
    );

    const moveDownButton = screen.getByLabelText('Move Frontend Developer down');
    fireEvent.click(moveDownButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/roles/reorder',
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  it('shows singular "role" text for single role', () => {
    render(
      <RoleList
        initialRoles={[mockRoles[0]]}
        onDeleteRequest={onDeleteRequest}
      />,
      { wrapper: freeWrapper },
    );

    expect(screen.getByText('1 role / 3 max')).toBeDefined();
  });
});
