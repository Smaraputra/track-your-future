'use client';

import { signIn } from 'next-auth/react';
import { Chrome, Github } from 'lucide-react';
import { RetroButton } from '@/components/retro-button';

export function OAuthButtons() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="border-border h-px flex-1 border-t" />
        <span className="font-body text-muted-foreground text-xs">or</span>
        <div className="border-border h-px flex-1 border-t" />
      </div>
      <div className="flex gap-3">
        <RetroButton
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={() => signIn('google', { redirectTo: '/dashboard' })}
        >
          <Chrome className="size-4" />
          Google
        </RetroButton>
        <RetroButton
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={() => signIn('github', { redirectTo: '/dashboard' })}
        >
          <Github className="size-4" />
          GitHub
        </RetroButton>
      </div>
    </div>
  );
}
