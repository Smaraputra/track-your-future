import Link from 'next/link';
import { RetroWindow } from '@/components/retro-window';
import { RetroButton } from '@/components/retro-button';

export default function DashboardNotFound() {
  return (
    <RetroWindow title="sys://404">
      <div className="space-y-4 text-center">
        <h2 className="font-heading text-primary text-lg">404 -- NOT FOUND</h2>
        <p className="font-body text-muted-foreground text-sm">
          The requested resource does not exist.
        </p>
        <RetroButton asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </RetroButton>
      </div>
    </RetroWindow>
  );
}
