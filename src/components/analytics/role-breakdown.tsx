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

interface RoleBreakdownProps {
  data: { name: string; color: string | null; count: number }[];
}

export function RoleBreakdown({ data }: RoleBreakdownProps) {
  if (data.length === 0) {
    return (
      <p className="font-body text-muted-foreground text-sm">
        No role data yet. Assign roles to applications to see the breakdown.
      </p>
    );
  }

  const chartData = data.map((d) => ({
    name: d.name,
    value: d.count,
    color: d.color ?? '#6b7280',
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(150, data.length * 40)}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 5, bottom: 5, left: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11, fontFamily: 'var(--font-body)', fill: 'var(--muted-foreground)' }}
          axisLine={{ stroke: 'var(--border)' }}
          tickLine={{ stroke: 'var(--border)' }}
        />
        <YAxis
          dataKey="name"
          type="category"
          width={120}
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
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
