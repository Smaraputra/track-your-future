'use client';

import { useState } from 'react';
import { Loader2, Lock, Sparkles } from 'lucide-react';

import { RetroButton } from '@/components/retro-button';
import { Badge } from '@/components/ui/badge';

type Tone = 'formal' | 'casual' | 'technical' | 'leadership';

const TONES: { value: Tone; label: string }[] = [
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'technical', label: 'Technical' },
  { value: 'leadership', label: 'Leadership' },
];

interface CoverLetterSectionProps {
  applicationId: string;
  hasParsedCv: boolean;
  hasJdAnalysis: boolean;
  isPro: boolean;
  onGenerated: () => void;
}

export function CoverLetterSection({
  applicationId,
  hasParsedCv,
  hasJdAnalysis,
  isPro,
  onGenerated,
}: CoverLetterSectionProps) {
  const [tone, setTone] = useState<Tone>('formal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = loading || !hasParsedCv || !hasJdAnalysis || !isPro;

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, tone }),
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
          setError(data.error ?? 'Missing CV or JD data');
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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {/* Tone selector */}
        <div className="flex gap-1">
          {TONES.map((t) => (
            <Badge
              key={t.value}
              variant={tone === t.value ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => setTone(t.value)}
            >
              {t.label}
            </Badge>
          ))}
        </div>

        <RetroButton
          variant="secondary"
          size="sm"
          onClick={handleGenerate}
          disabled={disabled}
          title={
            !isPro
              ? 'Pro plan required'
              : !hasParsedCv
                ? 'Parse a CV first'
                : !hasJdAnalysis
                  ? 'Extract the JD first'
                  : 'Generate cover letter'
          }
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : !isPro ? (
            <Lock className="size-4" />
          ) : (
            <Sparkles className="size-4" />
          )}
          Generate
        </RetroButton>
      </div>

      {error && (
        <p className="font-body text-destructive text-xs">{error}</p>
      )}
    </div>
  );
}
