import { RetroWindow } from '@/components/retro-window';

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <RetroWindow title="sys://verify-email">
        <p className="font-body text-muted-foreground text-sm">
          Email verification -- coming in Step 8
        </p>
      </RetroWindow>
    </div>
  );
}
