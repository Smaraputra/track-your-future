import { RetroWindow } from '@/components/retro-window';

export default function TermsPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <RetroWindow title="sys://terms">
        <p className="font-body text-muted-foreground text-sm">
          Terms of Service -- coming in Step 6
        </p>
      </RetroWindow>
    </div>
  );
}
