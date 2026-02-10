import Link from 'next/link';
import { RetroButton } from '@/components/retro-button';

export default function GlobalNotFound() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h1 className="font-heading text-primary text-shadow-glow text-4xl">404</h1>
      <p className="font-body text-muted-foreground text-sm">
        Page not found. The route you requested does not exist.
      </p>
      <RetroButton asChild>
        <Link href="/">Return Home</Link>
      </RetroButton>
    </div>
  );
}
