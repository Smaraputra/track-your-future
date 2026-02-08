import { RetroWindow } from '@/components/retro-window';

export default function LandingPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <RetroWindow title="sys://landing">
        <p className="font-body text-muted-foreground text-sm">
          Landing page -- coming in Step 7
        </p>
      </RetroWindow>
    </div>
  );
}
