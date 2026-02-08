import { RetroWindow } from '@/components/retro-window';

export default function PrivacyPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <RetroWindow title="sys://privacy">
        <p className="font-body text-muted-foreground text-sm">
          Privacy Policy -- coming in Step 6
        </p>
      </RetroWindow>
    </div>
  );
}
