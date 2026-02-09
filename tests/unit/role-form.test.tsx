import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RoleForm } from '@/components/roles/role-form';
import { ColorPicker } from '@/components/roles/color-picker';
import { ROLE_COLORS } from '@/lib/roles/constants';

// Mock next/navigation
const mockPush = vi.fn();
const mockBack = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: mockBack,
    refresh: mockRefresh,
  }),
  usePathname: () => '/roles/new',
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
  Check: (props: Record<string, unknown>) => (
    <svg data-testid="icon-check" {...props} />
  ),
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('ColorPicker', () => {
  it('renders all 8 preset colors', () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#22c55e" onChange={onChange} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(8);
  });

  it('marks selected color with aria-pressed', () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#22c55e" onChange={onChange} />);

    const greenButton = screen.getByLabelText('Select Green');
    expect(greenButton.getAttribute('aria-pressed')).toBe('true');

    const blueButton = screen.getByLabelText('Select Blue');
    expect(blueButton.getAttribute('aria-pressed')).toBe('false');
  });

  it('calls onChange when a color is clicked', () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#22c55e" onChange={onChange} />);

    fireEvent.click(screen.getByLabelText('Select Blue'));
    expect(onChange).toHaveBeenCalledWith('#3b82f6');
  });

  it('shows check icon on selected color', () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#22c55e" onChange={onChange} />);

    const checkIcons = screen.getAllByTestId('icon-check');
    expect(checkIcons).toHaveLength(1);
  });

  it('has title with color label', () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#22c55e" onChange={onChange} />);

    for (const color of ROLE_COLORS) {
      const button = screen.getByTitle(color.label);
      expect(button).toBeDefined();
    }
  });
});

describe('RoleForm', () => {
  it('renders create mode with correct heading', () => {
    render(<RoleForm mode="create" />);

    expect(screen.getByRole('heading', { name: 'New Role Category' })).toBeDefined();
    expect(screen.getByText('Create a role category to organize your job search')).toBeDefined();
  });

  it('renders edit mode with correct heading', () => {
    render(
      <RoleForm
        mode="edit"
        roleId="test-id"
        defaultValues={{ name: 'Frontend Dev', description: 'Test', color: '#22c55e' }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Edit Role Category' })).toBeDefined();
    expect(screen.getByText('Update role category details')).toBeDefined();
  });

  it('renders name, description, and color fields', () => {
    render(<RoleForm mode="create" />);

    expect(screen.getByText('Name')).toBeDefined();
    expect(screen.getByText('Description')).toBeDefined();
    expect(screen.getByText('Color')).toBeDefined();
    expect(screen.getByPlaceholderText('e.g. Frontend Developer')).toBeDefined();
  });

  it('renders Create Role button in create mode', () => {
    render(<RoleForm mode="create" />);
    expect(screen.getByText('Create Role')).toBeDefined();
  });

  it('renders Save Changes button in edit mode', () => {
    render(<RoleForm mode="edit" roleId="test-id" />);
    expect(screen.getByText('Save Changes')).toBeDefined();
  });

  it('renders Cancel button', () => {
    render(<RoleForm mode="create" />);
    expect(screen.getByText('Cancel')).toBeDefined();
  });

  it('Cancel navigates back', () => {
    render(<RoleForm mode="create" />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('prefills values in edit mode', () => {
    render(
      <RoleForm
        mode="edit"
        roleId="test-id"
        defaultValues={{ name: 'Frontend Dev', description: 'Test desc' }}
      />,
    );

    const nameInput = screen.getByPlaceholderText('e.g. Frontend Developer') as HTMLInputElement;
    expect(nameInput.value).toBe('Frontend Dev');
  });

  it('shows validation error for empty name on submit', async () => {
    render(<RoleForm mode="create" />);

    // Clear the name field (which defaults to empty) and submit
    fireEvent.click(screen.getByText('Create Role'));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeDefined();
    });
  });

  it('submits create form to POST /api/roles', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'new-role' }),
    });

    render(<RoleForm mode="create" />);

    const nameInput = screen.getByPlaceholderText('e.g. Frontend Developer');
    fireEvent.change(nameInput, { target: { value: 'Test Role' } });
    fireEvent.click(screen.getByText('Create Role'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/roles',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('submits edit form to PATCH /api/roles/[roleId]', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'test-id' }),
    });

    render(
      <RoleForm
        mode="edit"
        roleId="test-id"
        defaultValues={{ name: 'Original', color: '#22c55e' }}
      />,
    );

    const nameInput = screen.getByPlaceholderText('e.g. Frontend Developer');
    fireEvent.change(nameInput, { target: { value: 'Updated' } });
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/roles/test-id',
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  it('shows 409 duplicate name error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: 'Duplicate' }),
    });

    render(<RoleForm mode="create" />);

    const nameInput = screen.getByPlaceholderText('e.g. Frontend Developer');
    fireEvent.change(nameInput, { target: { value: 'Existing' } });
    fireEvent.click(screen.getByText('Create Role'));

    await waitFor(() => {
      expect(
        screen.getByText('A role category with this name already exists.'),
      ).toBeDefined();
    });
  });

  it('shows 403 limit error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        error: 'Role category limit reached (3). Upgrade to Pro for unlimited roles.',
      }),
    });

    render(<RoleForm mode="create" />);

    const nameInput = screen.getByPlaceholderText('e.g. Frontend Developer');
    fireEvent.change(nameInput, { target: { value: 'New Role' } });
    fireEvent.click(screen.getByText('Create Role'));

    await waitFor(() => {
      expect(screen.getByText(/Role category limit reached/)).toBeDefined();
    });
  });

  it('redirects to /roles on successful submit', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'new-role' }),
    });

    render(<RoleForm mode="create" />);

    const nameInput = screen.getByPlaceholderText('e.g. Frontend Developer');
    fireEvent.change(nameInput, { target: { value: 'Test Role' } });
    fireEvent.click(screen.getByText('Create Role'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/roles');
    });
  });
});
