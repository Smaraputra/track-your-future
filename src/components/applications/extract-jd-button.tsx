'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

import { RetroButton } from '@/components/retro-button';

interface ExtractJdButtonProps {
  applicationId: string;
  jobUrl: string;
  hasAnalysis: boolean;
  onExtracted: () => void;
}

export function ExtractJdButton({
  applicationId,
  jobUrl,
  hasAnalysis,
  onExtracted,
}: ExtractJdButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/extract-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl, applicationId }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429) {
          setError('Monthly extraction limit reached');
        } else if (res.status === 503) {
          setError('AI not configured');
        } else {
          setError(data.error ?? 'Extraction failed');
        }
        return;
      }

      onExtracted();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <RetroButton
        variant="secondary"
        size="sm"
        onClick={handleExtract}
        disabled={loading}
        title={hasAnalysis ? 'Re-extract job description' : 'Extract job description with AI'}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        {hasAnalysis ? 'Re-extract JD' : 'Extract JD'}
      </RetroButton>
      {error && (
        <span className="font-body text-destructive text-xs">{error}</span>
      )}
    </div>
  );
}
