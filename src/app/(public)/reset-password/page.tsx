import { RetroWindow } from '@/components/retro-window';

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <RetroWindow title="sys://reset-password">
        <p className="font-body text-muted-foreground text-sm">
          Reset password -- coming in Step 8
        </p>
      </RetroWindow>
    </div>
  );
}
