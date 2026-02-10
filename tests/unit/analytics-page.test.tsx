import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AnalyticsContent } from '@/components/analytics/analytics-content';

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

// Mock recharts -- jsdom can't render SVG charts
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Cell: () => null,
}));

const mockStatusDistribution = [
  { status: 'applied', count: 10 },
  { status: 'interview', count: 3 },
  { status: 'offer', count: 1 },
  { status: 'rejected', count: 4 },
];

const mockFunnelData = [
  { stage: 'applied', count: 10 },
  { stage: 'phone_screen', count: 6 },
  { stage: 'interview', count: 3 },
  { stage: 'offer', count: 1 },
];

const mockRoleBreakdown = [
  { name: 'Frontend Developer', color: '#22c55e', count: 8 },
  { name: 'Backend Developer', color: '#3b82f6', count: 5 },
];

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('AnalyticsContent', () => {
  it('renders section headings with data', () => {
    render(
      <AnalyticsContent
        statusDistribution={mockStatusDistribution}
        funnelData={mockFunnelData}
        roleBreakdown={mockRoleBreakdown}
        tier="pro"
        dateFilter={null}
      />,
    );

    expect(screen.getByText('Status Distribution')).toBeDefined();
    expect(screen.getByText('Conversion Funnel')).toBeDefined();
    expect(screen.getByText('By Role Category')).toBeDefined();
  });

  it('renders charts when data is present', () => {
    render(
      <AnalyticsContent
        statusDistribution={mockStatusDistribution}
        funnelData={mockFunnelData}
        roleBreakdown={mockRoleBreakdown}
        tier="pro"
        dateFilter={null}
      />,
    );

    expect(screen.getAllByTestId('responsive-container')).toHaveLength(3);
  });

  it('renders empty state when no data', () => {
    render(
      <AnalyticsContent
        statusDistribution={[]}
        funnelData={[
          { stage: 'applied', count: 0 },
          { stage: 'phone_screen', count: 0 },
          { stage: 'interview', count: 0 },
          { stage: 'offer', count: 0 },
        ]}
        roleBreakdown={[]}
        tier="pro"
        dateFilter={null}
      />,
    );

    expect(screen.getByText(/No data to display/)).toBeDefined();
  });

  it('shows all-time message for pro tier', () => {
    render(
      <AnalyticsContent
        statusDistribution={mockStatusDistribution}
        funnelData={mockFunnelData}
        roleBreakdown={mockRoleBreakdown}
        tier="pro"
        dateFilter={null}
      />,
    );

    expect(screen.getByText('Showing all-time data.')).toBeDefined();
  });

  it('shows current month restriction for free tier', () => {
    const dateFilter = new Date(2025, 0, 1).toISOString();

    render(
      <AnalyticsContent
        statusDistribution={mockStatusDistribution}
        funnelData={mockFunnelData}
        roleBreakdown={mockRoleBreakdown}
        tier="free"
        dateFilter={dateFilter}
      />,
    );

    expect(screen.getByText(/Showing data for/)).toBeDefined();
    expect(screen.getByText(/Upgrade to Pro/)).toBeDefined();
  });

  it('shows upgrade link pointing to pricing for free tier', () => {
    const dateFilter = new Date(2025, 0, 1).toISOString();

    render(
      <AnalyticsContent
        statusDistribution={mockStatusDistribution}
        funnelData={mockFunnelData}
        roleBreakdown={mockRoleBreakdown}
        tier="free"
        dateFilter={dateFilter}
      />,
    );

    const link = screen.getByText('Upgrade to Pro');
    expect(link.closest('a')?.getAttribute('href')).toBe('/pricing');
  });

  it('renders status distribution empty message', () => {
    render(
      <AnalyticsContent
        statusDistribution={[]}
        funnelData={mockFunnelData}
        roleBreakdown={mockRoleBreakdown}
        tier="pro"
        dateFilter={null}
      />,
    );

    expect(screen.getByText('No application data yet.')).toBeDefined();
  });

  it('renders funnel empty message when all counts are zero', () => {
    render(
      <AnalyticsContent
        statusDistribution={mockStatusDistribution}
        funnelData={[
          { stage: 'applied', count: 0 },
          { stage: 'phone_screen', count: 0 },
          { stage: 'interview', count: 0 },
          { stage: 'offer', count: 0 },
        ]}
        roleBreakdown={mockRoleBreakdown}
        tier="pro"
        dateFilter={null}
      />,
    );

    expect(screen.getByText(/No funnel data yet/)).toBeDefined();
  });

  it('renders role breakdown empty message', () => {
    render(
      <AnalyticsContent
        statusDistribution={mockStatusDistribution}
        funnelData={mockFunnelData}
        roleBreakdown={[]}
        tier="pro"
        dateFilter={null}
      />,
    );

    expect(screen.getByText(/No role data yet/)).toBeDefined();
  });

  it('renders without crashing with minimal data', () => {
    render(
      <AnalyticsContent
        statusDistribution={[{ status: 'draft', count: 1 }]}
        funnelData={[
          { stage: 'applied', count: 0 },
          { stage: 'phone_screen', count: 0 },
          { stage: 'interview', count: 0 },
          { stage: 'offer', count: 0 },
        ]}
        roleBreakdown={[]}
        tier="free"
        dateFilter={new Date().toISOString()}
      />,
    );

    expect(screen.getByText('Status Distribution')).toBeDefined();
  });
});
