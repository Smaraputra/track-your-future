import { RetroWindow } from '@/components/retro-window';

export default function ResetPasswordConfirmPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <RetroWindow title="sys://reset-password/confirm">
        <p className="font-body text-muted-foreground text-sm">
          Confirm password reset -- coming in Step 8
        </p>
      </RetroWindow>
    </div>
  );
}
