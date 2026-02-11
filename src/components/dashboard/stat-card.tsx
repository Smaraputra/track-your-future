'use client';

import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  className?: string;
}

export function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'border-border bg-surface crt-screen border-glow flex items-center gap-3 rounded-md border p-4',
        className
      )}
    >
      <div className="text-primary">{icon}</div>
      <div>
        <p className="font-heading text-primary text-shadow-glow text-2xl">{value}</p>
        <p className="font-body text-muted-foreground text-xs">{label}</p>
      </div>
    </div>
  );
}
