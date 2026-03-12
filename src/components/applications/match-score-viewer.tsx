'use client';

import type { MatchScoreResult } from '@/lib/ai/schemas';

interface MatchScoreViewerProps {
  data: MatchScoreResult;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="font-body text-muted-foreground text-xs">{label}</span>
        <span className="font-body text-xs font-medium">{score}%</span>
      </div>
      <div className="bg-muted h-2 rounded-full">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'text-green-500 border-green-500'
      : score >= 60
        ? 'text-yellow-500 border-yellow-500'
        : 'text-red-500 border-red-500';

  return (
    <div
      className={`flex size-20 flex-col items-center justify-center rounded-full border-4 ${color}`}
    >
      <span className="font-heading text-2xl">{score}</span>
      <span className="text-muted-foreground text-[10px]">/ 100</span>
    </div>
  );
}

export function MatchScoreViewer({ data }: MatchScoreViewerProps) {
  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="flex items-center gap-4">
        <ScoreGauge score={data.overallScore} />
        <div className="flex-1 space-y-2">
          <ScoreBar label="Skills" score={data.skillsMatch} />
          <ScoreBar label="Experience" score={data.experienceMatch} />
          <ScoreBar label="Education" score={data.educationMatch} />
          <ScoreBar label="Keywords" score={data.keywordCoverage} />
        </div>
      </div>

      {/* Strengths */}
      {data.strengths.length > 0 && (
        <Section title="Strengths">
          <ul className="font-body text-sm space-y-1">
            {data.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5 shrink-0">+</span>
                <span className="text-muted-foreground">{s}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Weaknesses */}
      {data.weaknesses.length > 0 && (
        <Section title="Gaps">
          <ul className="font-body text-sm space-y-1">
            {data.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5 shrink-0">-</span>
                <span className="text-muted-foreground">{w}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Suggestions */}
      {data.suggestions.length > 0 && (
        <Section title="Suggestions">
          <ul className="font-body text-sm space-y-1">
            {data.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5 shrink-0">*</span>
                <span className="text-muted-foreground">{s}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <h4 className="font-heading text-primary text-sm">{title}</h4>
      {children}
    </div>
  );
}
