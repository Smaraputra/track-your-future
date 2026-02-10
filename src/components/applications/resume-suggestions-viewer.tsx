'use client';

import { Badge } from '@/components/ui/badge';
import type { ResumeSuggestionResult } from '@/lib/ai/schemas';

interface ResumeSuggestionsViewerProps {
  data: ResumeSuggestionResult;
}

const CATEGORY_LABELS: Record<string, string> = {
  content: 'Content',
  formatting: 'Formatting',
  keywords: 'Keywords',
  impact: 'Impact',
};

const CATEGORY_COLORS: Record<string, string> = {
  content: 'bg-blue-500/10 text-blue-500',
  formatting: 'bg-orange-500/10 text-orange-500',
  keywords: 'bg-green-500/10 text-green-500',
  impact: 'bg-purple-500/10 text-purple-500',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-500/10 text-red-500',
  medium: 'bg-yellow-500/10 text-yellow-500',
  low: 'bg-muted text-muted-foreground',
};

// Group suggestions by category
function groupByCategory(suggestions: ResumeSuggestionResult['suggestions']) {
  const groups: Record<string, ResumeSuggestionResult['suggestions']> = {};
  for (const s of suggestions) {
    if (!groups[s.category]) {
      groups[s.category] = [];
    }
    groups[s.category].push(s);
  }
  return groups;
}

export function ResumeSuggestionsViewer({ data }: ResumeSuggestionsViewerProps) {
  const grouped = groupByCategory(data.suggestions);
  const categories = ['content', 'formatting', 'keywords', 'impact'].filter(
    (c) => grouped[c]?.length,
  );

  return (
    <div className="space-y-5">
      {categories.map((category) => (
        <div key={category} className="space-y-3">
          <Badge
            variant="outline"
            className={`text-xs ${CATEGORY_COLORS[category] ?? ''}`}
          >
            {CATEGORY_LABELS[category] ?? category}
          </Badge>

          <div className="space-y-2">
            {grouped[category].map((suggestion, idx) => (
              <div
                key={`${category}-${idx}`}
                className="border-border rounded-md border p-3"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-body text-foreground text-sm font-medium">
                    {suggestion.title}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${PRIORITY_COLORS[suggestion.priority] ?? ''}`}
                  >
                    {suggestion.priority}
                  </Badge>
                </div>

                <p className="font-body text-muted-foreground text-xs">
                  {suggestion.description}
                </p>

                {suggestion.before && suggestion.after && (
                  <div className="mt-2 space-y-1">
                    <div className="rounded bg-red-500/5 px-2 py-1">
                      <span className="font-heading text-xs text-red-400">BEFORE</span>
                      <p className="font-body text-foreground text-xs">
                        {suggestion.before}
                      </p>
                    </div>
                    <div className="rounded bg-green-500/5 px-2 py-1">
                      <span className="font-heading text-xs text-green-400">AFTER</span>
                      <p className="font-body text-foreground text-xs">
                        {suggestion.after}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
