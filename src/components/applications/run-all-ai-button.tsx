'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

import { RetroButton } from '@/components/retro-button';

interface RunAllAiButtonProps {
  applicationId: string;
  jobUrl: string | null;
  hasParsedCv: boolean;
  hasJobAnalysis: boolean;
  hasMatchScore: boolean;
  hasCoverLetter: boolean;
  hasInterviewPrep: boolean;
  hasResumeSuggestions: boolean;
  isPro: boolean;
  cvDocumentId: string | null;
  onCvParsed: () => Promise<void>;
  onJdExtracted: () => Promise<void>;
  onMatchScored: () => Promise<void>;
  onCoverLetterGenerated: () => Promise<void>;
  onInterviewPrepGenerated: () => Promise<void>;
  onResumeSuggestionsGenerated: () => Promise<void>;
}

type AiStep = {
  label: string;
  run: () => Promise<boolean>;
};

export function RunAllAiButton({
  applicationId,
  jobUrl,
  hasParsedCv,
  hasJobAnalysis,
  hasMatchScore,
  hasCoverLetter,
  hasInterviewPrep,
  hasResumeSuggestions,
  isPro,
  cvDocumentId,
  onCvParsed,
  onJdExtracted,
  onMatchScored,
  onCoverLetterGenerated,
  onInterviewPrepGenerated,
  onResumeSuggestionsGenerated,
}: RunAllAiButtonProps) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' });
  const [error, setError] = useState<string | null>(null);

  function buildSteps(): AiStep[] {
    const steps: AiStep[] = [];

    if (jobUrl && !hasJobAnalysis) {
      steps.push({
        label: 'Extracting JD',
        run: async () => {
          const res = await fetch('/api/ai/extract-jd', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: jobUrl, applicationId }),
          });
          if (!res.ok) return false;
          await onJdExtracted();
          return true;
        },
      });
    }

    if (cvDocumentId && !hasParsedCv) {
      steps.push({
        label: 'Parsing CV',
        run: async () => {
          const res = await fetch('/api/ai/parse-cv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId: cvDocumentId }),
          });
          if (!res.ok) return false;
          await onCvParsed();
          return true;
        },
      });
    }

    // After the prerequisite steps, check what will be available
    const willHaveJd = hasJobAnalysis || (jobUrl && !hasJobAnalysis);
    const willHaveCv = hasParsedCv || (cvDocumentId && !hasParsedCv);

    if (!hasMatchScore && willHaveCv && willHaveJd) {
      steps.push({
        label: 'Scoring match',
        run: async () => {
          const res = await fetch('/api/ai/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId }),
          });
          if (!res.ok) return false;
          await onMatchScored();
          return true;
        },
      });
    }

    if (isPro && !hasCoverLetter && willHaveCv && willHaveJd) {
      steps.push({
        label: 'Generating cover letter',
        run: async () => {
          const res = await fetch('/api/ai/cover-letter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId, tone: 'formal' }),
          });
          if (!res.ok) return false;
          await onCoverLetterGenerated();
          return true;
        },
      });
    }

    if (isPro && !hasInterviewPrep && willHaveJd) {
      steps.push({
        label: 'Generating interview prep',
        run: async () => {
          const res = await fetch('/api/ai/interview-prep', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId }),
          });
          if (!res.ok) return false;
          await onInterviewPrepGenerated();
          return true;
        },
      });
    }

    if (isPro && !hasResumeSuggestions && willHaveCv) {
      steps.push({
        label: 'Generating resume suggestions',
        run: async () => {
          const res = await fetch('/api/ai/resume-suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId }),
          });
          if (!res.ok) return false;
          await onResumeSuggestionsGenerated();
          return true;
        },
      });
    }

    return steps;
  }

  const steps = buildSteps();
  const disabled = running || steps.length === 0;

  async function handleRunAll() {
    const stepsToRun = buildSteps();
    if (stepsToRun.length === 0) return;

    setRunning(true);
    setError(null);

    for (let i = 0; i < stepsToRun.length; i++) {
      const step = stepsToRun[i];
      setProgress({ current: i + 1, total: stepsToRun.length, label: step.label });
      try {
        const ok = await step.run();
        if (!ok) {
          setError(`Failed: ${step.label}`);
          break;
        }
      } catch {
        setError(`Error: ${step.label}`);
        break;
      }
    }

    setRunning(false);
    setProgress({ current: 0, total: 0, label: '' });
  }

  return (
    <div className="flex items-center gap-2">
      <RetroButton
        variant="primary"
        size="sm"
        onClick={handleRunAll}
        disabled={disabled}
        title={steps.length === 0 ? 'All AI features are up to date' : `Run ${steps.length} AI feature${steps.length > 1 ? 's' : ''}`}
      >
        {running ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        {running
          ? `Running ${progress.current}/${progress.total}...`
          : `Run All AI (${steps.length})`}
      </RetroButton>
      {error && (
        <span className="font-body text-destructive text-xs">{error}</span>
      )}
    </div>
  );
}
