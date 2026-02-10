'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ConversionFunnelProps {
  data: { stage: string; count: number }[];
}

function formatStage(stage: string): string {
  return stage.replace(/_/g, ' ');
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  if (data.every((d) => d.count === 0)) {
    return (
      <p className="font-body text-muted-foreground text-sm">
        No funnel data yet. Apply to some positions to see your conversion funnel.
      </p>
    );
  }

  const chartData = data.map((d) => ({
    name: formatStage(d.stage),
    value: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
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
          width={90}
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
        <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
