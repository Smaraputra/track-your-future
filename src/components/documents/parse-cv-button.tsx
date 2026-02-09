'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

import { RetroButton } from '@/components/retro-button';

interface ParseCvButtonProps {
  documentId: string;
  hasParsedProfile: boolean;
  onParsed: () => void;
}

export function ParseCvButton({
  documentId,
  hasParsedProfile,
  onParsed,
}: ParseCvButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleParse() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/parse-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429) {
          setError('Monthly parse limit reached');
        } else if (res.status === 503) {
          setError('AI not configured');
        } else {
          setError(data.error ?? 'Parse failed');
        }
        return;
      }

      onParsed();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <RetroButton
        variant="ghost"
        size="sm"
        onClick={handleParse}
        disabled={loading}
        title={hasParsedProfile ? 'Re-parse CV' : 'Parse CV with AI'}
        className="text-xs"
      >
        {loading ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <Sparkles className="size-3" />
        )}
        {hasParsedProfile ? 'Re-parse' : 'Parse CV'}
      </RetroButton>
      {error && (
        <span className="font-body text-destructive text-xs">{error}</span>
      )}
    </div>
  );
}
