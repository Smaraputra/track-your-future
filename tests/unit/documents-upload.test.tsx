import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { UploadDialog } from '@/components/documents/upload-dialog';
import { UploadProgressBar } from '@/components/documents/upload-progress-bar';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Upload: (props: Record<string, unknown>) => (
    <svg data-testid="icon-upload" {...props} />
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
}));

const mockRoles = [
  { id: 'role-1', name: 'Frontend', color: '#22c55e' },
  { id: 'role-2', name: 'Backend', color: '#3b82f6' },
];

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('UploadProgressBar', () => {
  it('renders nothing when idle', () => {
    const { container } = render(
      <UploadProgressBar progress={0} status="idle" />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders presigning status', () => {
    render(<UploadProgressBar progress={0} status="presigning" />);
    expect(screen.getByText('Preparing upload...')).toBeDefined();
    expect(screen.getByText('0%')).toBeDefined();
  });

  it('renders uploading status with progress', () => {
    render(<UploadProgressBar progress={50} status="uploading" />);
    expect(screen.getByText('Uploading...')).toBeDefined();
    expect(screen.getByText('50%')).toBeDefined();
  });

  it('renders confirming status', () => {
    render(<UploadProgressBar progress={100} status="confirming" />);
    expect(screen.getByText('Confirming...')).toBeDefined();
  });

  it('renders success status', () => {
    render(<UploadProgressBar progress={100} status="success" />);
    expect(screen.getByText('Upload complete')).toBeDefined();
  });

  it('renders error status', () => {
    render(<UploadProgressBar progress={0} status="error" />);
    expect(screen.getByText('Upload failed')).toBeDefined();
  });
});

describe('UploadDialog', () => {
  it('renders dialog title when open', () => {
    render(
      <UploadDialog
        open={true}
        onOpenChange={vi.fn()}
        onUploaded={vi.fn()}
        roles={mockRoles}
      />,
    );
    expect(screen.getByText('Upload Document')).toBeDefined();
  });

  it('renders document type select', () => {
    render(
      <UploadDialog
        open={true}
        onOpenChange={vi.fn()}
        onUploaded={vi.fn()}
        roles={mockRoles}
      />,
    );
    expect(screen.getByText('Document Type')).toBeDefined();
  });

  it('renders file input', () => {
    render(
      <UploadDialog
        open={true}
        onOpenChange={vi.fn()}
        onUploaded={vi.fn()}
        roles={mockRoles}
      />,
    );
    expect(screen.getByText('File')).toBeDefined();
  });

  it('renders role category select when no default role', () => {
    render(
      <UploadDialog
        open={true}
        onOpenChange={vi.fn()}
        onUploaded={vi.fn()}
        roles={mockRoles}
      />,
    );
    expect(screen.getByText(/Role Category/)).toBeDefined();
  });

  it('hides role category select when defaultRoleId is provided', () => {
    render(
      <UploadDialog
        open={true}
        onOpenChange={vi.fn()}
        onUploaded={vi.fn()}
        roles={mockRoles}
        defaultRoleId="role-1"
      />,
    );
    expect(screen.queryByText(/Role Category/)).toBeNull();
  });

  it('renders cancel and upload buttons', () => {
    render(
      <UploadDialog
        open={true}
        onOpenChange={vi.fn()}
        onUploaded={vi.fn()}
        roles={mockRoles}
      />,
    );
    expect(screen.getByText('Cancel')).toBeDefined();
    expect(screen.getByText('Upload')).toBeDefined();
  });

  it('does not render when closed', () => {
    render(
      <UploadDialog
        open={false}
        onOpenChange={vi.fn()}
        onUploaded={vi.fn()}
        roles={mockRoles}
      />,
    );
    expect(screen.queryByText('Upload Document')).toBeNull();
  });
});
