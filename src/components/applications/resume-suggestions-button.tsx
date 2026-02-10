'use client';

import { useState } from 'react';
import { Loader2, Lock, Sparkles } from 'lucide-react';

import { RetroButton } from '@/components/retro-button';

interface ResumeSuggestionsButtonProps {
  applicationId: string;
  hasSuggestions: boolean;
  hasParsedCv: boolean;
  isPro: boolean;
  onGenerated: () => void;
}

export function ResumeSuggestionsButton({
  applicationId,
  hasSuggestions,
  hasParsedCv,
  isPro,
  onGenerated,
}: ResumeSuggestionsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = loading || !hasParsedCv || !isPro;

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/resume-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429) {
          setError('Monthly limit reached');
        } else if (res.status === 403) {
          setError('Pro plan required');
        } else if (res.status === 503) {
          setError('AI not configured');
        } else if (res.status === 422) {
          setError(data.error ?? 'Missing CV data');
        } else {
          setError(data.error ?? 'Generation failed');
        }
        return;
      }

      onGenerated();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  let title = hasSuggestions ? 'Regenerate resume suggestions' : 'Generate resume suggestions';
  if (!isPro) title = 'Pro plan required';
  if (!hasParsedCv) title = 'Parse a CV first';

  return (
    <div className="flex items-center gap-2">
      <RetroButton
        variant="secondary"
        size="sm"
        onClick={handleGenerate}
        disabled={disabled}
        title={title}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : !isPro ? (
          <Lock className="size-4" />
        ) : (
          <Sparkles className="size-4" />
        )}
        {hasSuggestions ? 'Regenerate' : 'Generate'}
      </RetroButton>
      {error && (
        <span className="font-body text-destructive text-xs">{error}</span>
      )}
    </div>
  );
}
