import { RetroWindow } from '@/components/retro-window';

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <RetroWindow title="sys://login">
        <p className="font-body text-muted-foreground text-sm">
          Login -- coming in Step 8
        </p>
      </RetroWindow>
    </div>
  );
}
