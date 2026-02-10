'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface StatusDistributionChartProps {
  data: { status: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#6b7280',
  applied: '#3b82f6',
  phone_screen: '#8b5cf6',
  interview: '#f59e0b',
  offer: '#22c55e',
  rejected: '#ef4444',
  ghosted: '#9ca3af',
  withdrawn: '#78716c',
};

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  if (data.length === 0) {
    return (
      <p className="font-body text-muted-foreground text-sm">
        No application data yet.
      </p>
    );
  }

  const chartData = data.map((d) => ({
    name: formatStatus(d.status),
    value: d.count,
    status: d.status,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fontFamily: 'var(--font-body)', fill: 'var(--muted-foreground)' }}
          axisLine={{ stroke: 'var(--border)' }}
          tickLine={{ stroke: 'var(--border)' }}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fontFamily: 'var(--font-body)', fill: 'var(--muted-foreground)' }}
          axisLine={{ stroke: 'var(--border)' }}
          tickLine={{ stroke: 'var(--border)' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#6b7280'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
