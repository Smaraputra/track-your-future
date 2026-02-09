'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

import { RetroButton } from '@/components/retro-button';

interface MatchScoreButtonProps {
  applicationId: string;
  hasScore: boolean;
  hasParsedCv: boolean;
  hasJdAnalysis: boolean;
  onScored: () => void;
}

export function MatchScoreButton({
  applicationId,
  hasScore,
  hasParsedCv,
  hasJdAnalysis,
  onScored,
}: MatchScoreButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = loading || !hasParsedCv || !hasJdAnalysis;

  async function handleScore() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429) {
          setError('Monthly limit reached');
        } else if (res.status === 503) {
          setError('AI not configured');
        } else if (res.status === 422) {
          setError(data.error ?? 'Missing CV or JD data');
        } else {
          setError(data.error ?? 'Scoring failed');
        }
        return;
      }

      onScored();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  let title = hasScore ? 'Re-score match' : 'Score match with AI';
  if (!hasParsedCv) title = 'Parse a CV first to enable scoring';
  if (!hasJdAnalysis) title = 'Extract the JD first to enable scoring';
  if (!hasParsedCv && !hasJdAnalysis) title = 'Parse CV and extract JD first';

  return (
    <div className="flex items-center gap-2">
      <RetroButton
        variant="secondary"
        size="sm"
        onClick={handleScore}
        disabled={disabled}
        title={title}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        {hasScore ? 'Re-score' : 'Score Match'}
      </RetroButton>
      {error && (
        <span className="font-body text-destructive text-xs">{error}</span>
      )}
    </div>
  );
}
