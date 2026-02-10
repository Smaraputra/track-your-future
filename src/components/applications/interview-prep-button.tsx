'use client';

import { useState } from 'react';
import { Loader2, Lock, Sparkles } from 'lucide-react';

import { RetroButton } from '@/components/retro-button';

interface InterviewPrepButtonProps {
  applicationId: string;
  hasPrep: boolean;
  hasJdAnalysis: boolean;
  isPro: boolean;
  onGenerated: () => void;
}

export function InterviewPrepButton({
  applicationId,
  hasPrep,
  hasJdAnalysis,
  isPro,
  onGenerated,
}: InterviewPrepButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = loading || !hasJdAnalysis || !isPro;

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/interview-prep', {
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
          setError(data.error ?? 'Missing JD data');
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

  let title = hasPrep ? 'Regenerate interview prep' : 'Generate interview prep';
  if (!isPro) title = 'Pro plan required';
  if (!hasJdAnalysis) title = 'Extract the JD first';

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
        {hasPrep ? 'Regenerate' : 'Generate'}
      </RetroButton>
      {error && (
        <span className="font-body text-destructive text-xs">{error}</span>
      )}
    </div>
  );
}
