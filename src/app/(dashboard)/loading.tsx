import { RetroWindow } from '@/components/retro-window';

export default function DashboardLoading() {
  return (
    <RetroWindow title="sys://loading">
      <div className="flex items-center gap-3">
        <div className="bg-primary size-2 animate-pulse rounded-full" />
        <div className="bg-primary size-2 animate-pulse rounded-full [animation-delay:150ms]" />
        <div className="bg-primary size-2 animate-pulse rounded-full [animation-delay:300ms]" />
        <span className="font-body text-muted-foreground text-sm">Loading...</span>
      </div>
    </RetroWindow>
  );
}
