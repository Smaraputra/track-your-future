import { render, screen, fireEvent } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';
import { NotificationItem } from '@/components/notifications/notification-item';

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
  Bell: (props: Record<string, unknown>) => (
    <svg data-testid="icon-bell" {...props} />
  ),
  AlertTriangle: (props: Record<string, unknown>) => (
    <svg data-testid="icon-alert-triangle" {...props} />
  ),
  Trophy: (props: Record<string, unknown>) => (
    <svg data-testid="icon-trophy" {...props} />
  ),
  Calendar: (props: Record<string, unknown>) => (
    <svg data-testid="icon-calendar" {...props} />
  ),
}));

const mockNotifications = [
  {
    id: 'n1',
    type: 'stale_app',
    title: 'Acme Corp needs attention',
    body: 'Your application hasn\'t been updated in 10 days.',
    isRead: false,
    applicationId: 'app-1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'n2',
    type: 'milestone',
    title: 'First Application Created',
    body: 'The journey begins!',
    isRead: true,
    applicationId: 'app-2',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'n3',
    type: 'weekly_summary',
    title: 'Weekly Summary',
    body: 'You had 5 updates this week.',
    isRead: true,
    applicationId: null,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('NotificationItem', () => {
  it('renders notification title', () => {
    render(
      <NotificationItem
        {...mockNotifications[0]}
        onMarkRead={vi.fn()}
      />,
    );

    expect(screen.getByText('Acme Corp needs attention')).toBeDefined();
  });

  it('renders notification body', () => {
    render(
      <NotificationItem
        {...mockNotifications[0]}
        onMarkRead={vi.fn()}
      />,
    );

    expect(screen.getByText(/hasn't been updated in 10 days/)).toBeDefined();
  });

  it('renders unread indicator for unread notifications', () => {
    const { container } = render(
      <NotificationItem
        {...mockNotifications[0]}
        onMarkRead={vi.fn()}
      />,
    );

    // Unread dot
    const dot = container.querySelector('.bg-primary.rounded-full');
    expect(dot).toBeDefined();
  });

  it('does not render unread indicator for read notifications', () => {
    const { container } = render(
      <NotificationItem
        {...mockNotifications[1]}
        onMarkRead={vi.fn()}
      />,
    );

    // No size-2 unread dot
    const dots = container.querySelectorAll('.size-2.rounded-full');
    expect(dots.length).toBe(0);
  });

  it('renders as link when applicationId exists', () => {
    render(
      <NotificationItem
        {...mockNotifications[0]}
        onMarkRead={vi.fn()}
      />,
    );

    const link = screen.getByText('Acme Corp needs attention').closest('a');
    expect(link?.getAttribute('href')).toBe('/applications/app-1');
  });

  it('does not render as link when no applicationId', () => {
    render(
      <NotificationItem
        {...mockNotifications[2]}
        onMarkRead={vi.fn()}
      />,
    );

    const link = screen.getByText('Weekly Summary').closest('a');
    expect(link).toBeNull();
  });

  it('calls onMarkRead when clicking unread notification', () => {
    const onMarkRead = vi.fn();
    render(
      <NotificationItem
        {...mockNotifications[0]}
        onMarkRead={onMarkRead}
      />,
    );

    fireEvent.click(screen.getByText('Acme Corp needs attention'));
    expect(onMarkRead).toHaveBeenCalledWith('n1');
  });

  it('does not call onMarkRead when clicking read notification', () => {
    const onMarkRead = vi.fn();
    render(
      <NotificationItem
        {...mockNotifications[1]}
        onMarkRead={onMarkRead}
      />,
    );

    fireEvent.click(screen.getByText('First Application Created'));
    expect(onMarkRead).not.toHaveBeenCalled();
  });

  it('renders relative time', () => {
    render(
      <NotificationItem
        {...mockNotifications[0]}
        onMarkRead={vi.fn()}
      />,
    );

    expect(screen.getByText(/ago/)).toBeDefined();
  });
});

describe('NotificationDropdown', () => {
  it('renders heading', () => {
    render(
      <NotificationDropdown
        notifications={mockNotifications}
        onMarkRead={vi.fn()}
        onMarkAllRead={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Notifications')).toBeDefined();
  });

  it('renders all notifications', () => {
    render(
      <NotificationDropdown
        notifications={mockNotifications}
        onMarkRead={vi.fn()}
        onMarkAllRead={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Acme Corp needs attention')).toBeDefined();
    expect(screen.getByText('First Application Created')).toBeDefined();
    expect(screen.getByText('Weekly Summary')).toBeDefined();
  });

  it('shows mark all read button when unread exist', () => {
    render(
      <NotificationDropdown
        notifications={mockNotifications}
        onMarkRead={vi.fn()}
        onMarkAllRead={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Mark all read')).toBeDefined();
  });

  it('hides mark all read button when all are read', () => {
    const allRead = mockNotifications.map((n) => ({ ...n, isRead: true }));

    render(
      <NotificationDropdown
        notifications={allRead}
        onMarkRead={vi.fn()}
        onMarkAllRead={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByText('Mark all read')).toBeNull();
  });

  it('calls onMarkAllRead when clicking mark all', () => {
    const onMarkAllRead = vi.fn();
    render(
      <NotificationDropdown
        notifications={mockNotifications}
        onMarkRead={vi.fn()}
        onMarkAllRead={onMarkAllRead}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('Mark all read'));
    expect(onMarkAllRead).toHaveBeenCalled();
  });

  it('renders empty state', () => {
    render(
      <NotificationDropdown
        notifications={[]}
        onMarkRead={vi.fn()}
        onMarkAllRead={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('No notifications yet.')).toBeDefined();
  });
});
