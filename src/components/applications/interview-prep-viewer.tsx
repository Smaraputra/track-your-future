'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import type { InterviewPrepResult } from '@/lib/ai/schemas';

interface InterviewPrepViewerProps {
  data: InterviewPrepResult;
}

const CATEGORY_LABELS: Record<string, string> = {
  behavioral: 'Behavioral',
  technical: 'Technical',
  situational: 'Situational',
};

const CATEGORY_COLORS: Record<string, string> = {
  behavioral: 'bg-blue-500/10 text-blue-500',
  technical: 'bg-green-500/10 text-green-500',
  situational: 'bg-purple-500/10 text-purple-500',
};

export function InterviewPrepViewer({ data }: InterviewPrepViewerProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set(),
  );

  function toggleQuestion(key: string) {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <div className="space-y-5">
      {data.categories.map((category) => (
        <div key={category.name} className="space-y-3">
          <Badge
            variant="outline"
            className={`text-xs ${CATEGORY_COLORS[category.name] ?? ''}`}
          >
            {CATEGORY_LABELS[category.name] ?? category.name}
          </Badge>

          <div className="space-y-2">
            {category.questions.map((q, qi) => {
              const key = `${category.name}-${qi}`;
              const expanded = expandedQuestions.has(key);

              return (
                <div
                  key={key}
                  className="border-border rounded-md border"
                >
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 p-3 text-left"
                    onClick={() => toggleQuestion(key)}
                  >
                    <span className="text-muted-foreground mt-0.5 shrink-0 text-xs">
                      {expanded ? '-' : '+'}
                    </span>
                    <span className="font-body text-foreground text-sm">
                      {q.question}
                    </span>
                  </button>

                  {expanded && (
                    <div className="border-border space-y-2 border-t px-3 pb-3 pt-2">
                      <div>
                        <p className="font-heading text-primary text-xs">
                          STAR Hint
                        </p>
                        <p className="font-body text-muted-foreground text-xs">
                          {q.starHint}
                        </p>
                      </div>
                      <div>
                        <p className="font-heading text-primary text-xs">
                          Suggested Answer
                        </p>
                        <p className="font-body text-muted-foreground whitespace-pre-wrap text-xs">
                          {q.suggestedAnswer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
