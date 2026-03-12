'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface AiPrerequisiteHintProps {
  section: 'match-score' | 'cover-letter' | 'interview-prep' | 'resume-suggestions';
  hasParsedCv: boolean;
  hasJobAnalysis: boolean;
  isPro: boolean;
  jobUrl: string | null;
  cvDocumentId: string | null;
  applicationId: string;
  onCvParsed?: () => void;
  onJdExtracted?: () => void;
}

export function AiPrerequisiteHint({
  section,
  hasParsedCv,
  hasJobAnalysis,
  isPro,
  jobUrl,
  cvDocumentId,
  applicationId,
  onCvParsed,
  onJdExtracted,
}: AiPrerequisiteHintProps) {
  const [parsingCv, setParsingCv] = useState(false);
  const [extractingJd, setExtractingJd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleParseCv() {
    if (!cvDocumentId) return;
    setParsingCv(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/parse-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: cvDocumentId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Parse failed');
        return;
      }
      onCvParsed?.();
    } catch {
      setError('Network error');
    } finally {
      setParsingCv(false);
    }
  }

  async function handleExtractJd() {
    if (!jobUrl) return;
    setExtractingJd(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/extract-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl, applicationId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Extraction failed');
        return;
      }
      onJdExtracted?.();
    } catch {
      setError('Network error');
    } finally {
      setExtractingJd(false);
    }
  }

  const needsCv = !hasParsedCv && (section === 'match-score' || section === 'cover-letter' || section === 'resume-suggestions');
  const needsJd = !hasJobAnalysis && (section === 'match-score' || section === 'cover-letter' || section === 'interview-prep');
  const needsPro = !isPro && section !== 'match-score';

  if (needsPro) {
    return (
      <p className="font-body text-muted-foreground flex items-center gap-2 text-sm">
        <Sparkles className="size-4" />
        Pro plan required for {sectionLabel(section)}
      </p>
    );
  }

  if (!needsCv && !needsJd) {
    return (
      <p className="font-body text-muted-foreground flex items-center gap-2 text-sm">
        <Sparkles className="size-4" />
        {readyMessage(section)}
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <div className="font-body text-muted-foreground flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
        <Sparkles className="size-4 shrink-0" />
        <span>To enable {sectionLabel(section)}:</span>
        {needsCv && (
          <button
            type="button"
            className="text-primary hover:text-primary/80 inline-flex items-center gap-1 underline underline-offset-2 disabled:opacity-50"
            onClick={handleParseCv}
            disabled={parsingCv || !cvDocumentId}
            title={!cvDocumentId ? 'Link a CV document first' : undefined}
          >
            {parsingCv && <Loader2 className="size-3 animate-spin" />}
            {cvDocumentId ? 'Parse CV' : 'Link a CV first'}
          </button>
        )}
        {needsCv && needsJd && <span>and</span>}
        {needsJd && (
          <button
            type="button"
            className="text-primary hover:text-primary/80 inline-flex items-center gap-1 underline underline-offset-2 disabled:opacity-50"
            onClick={handleExtractJd}
            disabled={extractingJd || !jobUrl}
            title={!jobUrl ? 'Add a job URL first' : undefined}
          >
            {extractingJd && <Loader2 className="size-3 animate-spin" />}
            {jobUrl ? 'Extract JD' : 'Add a job URL first'}
          </button>
        )}
      </div>
      {error && (
        <p className="font-body text-destructive text-xs">{error}</p>
      )}
    </div>
  );
}

function sectionLabel(section: string): string {
  switch (section) {
    case 'match-score': return 'match scoring';
    case 'cover-letter': return 'cover letter generation';
    case 'interview-prep': return 'interview prep';
    case 'resume-suggestions': return 'resume suggestions';
    default: return section;
  }
}

function readyMessage(section: string): string {
  switch (section) {
    case 'match-score': return 'Click "Score Match" to analyze fit';
    case 'cover-letter': return 'Select a tone and click "Generate" to create a cover letter';
    case 'interview-prep': return 'Click "Generate" to create interview preparation materials';
    case 'resume-suggestions': return 'Click "Generate" to get resume improvement suggestions';
    default: return 'Ready to generate';
  }
}
