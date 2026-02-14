'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

import { RetroButton } from '@/components/retro-button';

interface ExtractJdButtonProps {
  applicationId: string;
  jobUrl: string | null;
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
  const [mode, setMode] = useState<'url' | 'paste'>(jobUrl ? 'url' : 'paste');
  const [pasteText, setPasteText] = useState('');

  async function handleExtract() {
    setLoading(true);
    setError(null);

    const body =
      mode === 'url' && jobUrl
        ? { url: jobUrl, applicationId }
        : { text: pasteText.trim(), applicationId };

    try {
      const res = await fetch('/api/ai/extract-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429) {
          setError('Monthly extraction limit reached');
        } else if (res.status === 503) {
          setError('AI not configured');
        } else if (res.status === 422 && mode === 'url') {
          setError(data.error ?? 'Could not fetch URL');
          setMode('paste');
          return;
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

  const canSubmitPaste = pasteText.trim().length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <RetroButton
          variant="secondary"
          size="sm"
          onClick={handleExtract}
          disabled={loading || (mode === 'paste' && !canSubmitPaste)}
          title={
            hasAnalysis
              ? 'Re-extract job description'
              : 'Extract job description with AI'
          }
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {mode === 'url'
            ? hasAnalysis
              ? 'Re-extract JD'
              : 'Extract JD'
            : 'Extract from Text'}
        </RetroButton>
        {jobUrl && (
          <button
            type="button"
            className="font-body text-muted-foreground text-xs underline hover:text-foreground"
            onClick={() => {
              setMode(mode === 'url' ? 'paste' : 'url');
              setError(null);
            }}
            disabled={loading}
          >
            {mode === 'url' ? 'Paste manually' : 'Use URL'}
          </button>
        )}
      </div>
      {mode === 'paste' && (
        <textarea
          className="font-body placeholder:text-muted-foreground border-input bg-background w-full rounded-md border px-3 py-2 text-sm transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:shadow-[0_0_8px_var(--primary)] disabled:pointer-events-none disabled:opacity-50 caret-primary min-h-[120px] resize-y"
          placeholder="Paste the job description text here..."
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          disabled={loading}
        />
      )}
      {error && (
        <span className="font-body text-destructive text-xs">{error}</span>
      )}
    </div>
  );
}
