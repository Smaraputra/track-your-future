'use client';

import { ArrowDown, FileEdit, FileText, MessageSquare } from 'lucide-react';
import { RetroButton } from '@/components/retro-button';

interface MatchScoreActionsProps {
  overallScore: number;
  hasParsedCv: boolean;
  hasJdAnalysis: boolean;
  isPro: boolean;
  hasResumeSuggestions: boolean;
  hasCoverLetter: boolean;
  hasInterviewPrep: boolean;
}

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export function MatchScoreActions({
  overallScore,
  hasParsedCv,
  hasJdAnalysis,
  isPro,
  hasResumeSuggestions,
  hasCoverLetter,
  hasInterviewPrep,
}: MatchScoreActionsProps) {
  const actions: { label: string; icon: React.ReactNode; sectionId: string }[] = [];

  if (overallScore < 80 && hasParsedCv && isPro && !hasResumeSuggestions) {
    actions.push({
      label: 'Get Resume Suggestions',
      icon: <FileEdit className="size-4" />,
      sectionId: 'section-resume-suggestions',
    });
  }

  if (hasParsedCv && hasJdAnalysis && isPro && !hasCoverLetter) {
    actions.push({
      label: 'Generate Cover Letter',
      icon: <FileText className="size-4" />,
      sectionId: 'section-cover-letter',
    });
  }

  if (hasJdAnalysis && isPro && !hasInterviewPrep) {
    actions.push({
      label: 'Prepare for Interview',
      icon: <MessageSquare className="size-4" />,
      sectionId: 'section-interview-prep',
    });
  }

  if (actions.length === 0) return null;

  return (
    <div className="border-border mt-4 border-t pt-4">
      <h4 className="font-heading text-primary mb-2 text-sm">
        Recommended Next Steps
      </h4>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <RetroButton
            key={action.sectionId}
            variant="secondary"
            size="sm"
            onClick={() => scrollToSection(action.sectionId)}
          >
            {action.icon}
            {action.label}
            <ArrowDown className="size-3" />
          </RetroButton>
        ))}
      </div>
    </div>
  );
}
