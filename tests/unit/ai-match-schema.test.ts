import { describe, expect, it } from 'vitest';

import {
  matchScoreResultSchema,
  interviewPrepResultSchema,
  resumeSuggestionResultSchema,
} from '@/lib/ai/schemas';

describe('matchScoreResultSchema', () => {
  const validData = {
    overallScore: 78,
    skillsMatch: 85,
    experienceMatch: 72,
    educationMatch: 60,
    keywordCoverage: 80,
    strengths: ['Strong TypeScript skills', '5 years React experience'],
    weaknesses: ['No AWS experience mentioned'],
    suggestions: ['Add AWS-related keywords'],
  };

  it('validates correct full data', () => {
    const result = matchScoreResultSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects score below 0', () => {
    const result = matchScoreResultSchema.safeParse({
      ...validData,
      overallScore: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects score above 100', () => {
    const result = matchScoreResultSchema.safeParse({
      ...validData,
      overallScore: 101,
    });
    expect(result.success).toBe(false);
  });

  it('allows empty arrays for strengths/weaknesses/suggestions', () => {
    const result = matchScoreResultSchema.safeParse({
      ...validData,
      strengths: [],
      weaknesses: [],
      suggestions: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing overallScore', () => {
    const data = { ...validData } as Record<string, unknown>;
    delete data.overallScore;
    const result = matchScoreResultSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects missing strengths array', () => {
    const data = { ...validData } as Record<string, unknown>;
    delete data.strengths;
    const result = matchScoreResultSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('validates boundary scores (0 and 100)', () => {
    const result = matchScoreResultSchema.safeParse({
      ...validData,
      overallScore: 0,
      skillsMatch: 100,
      experienceMatch: 0,
      educationMatch: 100,
      keywordCoverage: 0,
    });
    expect(result.success).toBe(true);
  });
});

describe('interviewPrepResultSchema', () => {
  const validData = {
    categories: [
      {
        name: 'behavioral' as const,
        questions: [
          {
            question: 'Tell me about a time you led a team.',
            starHint: 'Situation: project deadline, Task: lead team...',
            suggestedAnswer: 'At Acme Corp, I led a team of 5...',
          },
        ],
      },
      {
        name: 'technical' as const,
        questions: [
          {
            question: 'Explain React reconciliation.',
            starHint: 'Focus on virtual DOM diffing...',
            suggestedAnswer: 'React uses a virtual DOM...',
          },
        ],
      },
    ],
  };

  it('validates correct full data', () => {
    const result = interviewPrepResultSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('validates all category types', () => {
    for (const name of ['behavioral', 'technical', 'situational']) {
      const result = interviewPrepResultSchema.safeParse({
        categories: [
          {
            name,
            questions: [
              {
                question: 'Test?',
                starHint: 'hint',
                suggestedAnswer: 'answer',
              },
            ],
          },
        ],
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid category name', () => {
    const result = interviewPrepResultSchema.safeParse({
      categories: [
        {
          name: 'cultural',
          questions: [],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('allows empty categories array', () => {
    const result = interviewPrepResultSchema.safeParse({
      categories: [],
    });
    expect(result.success).toBe(true);
  });

  it('allows category with empty questions', () => {
    const result = interviewPrepResultSchema.safeParse({
      categories: [{ name: 'technical', questions: [] }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects question missing starHint', () => {
    const result = interviewPrepResultSchema.safeParse({
      categories: [
        {
          name: 'behavioral',
          questions: [
            { question: 'Test?', suggestedAnswer: 'answer' },
          ],
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe('resumeSuggestionResultSchema', () => {
  const validData = {
    suggestions: [
      {
        category: 'content' as const,
        title: 'Add quantifiable achievements',
        description: 'Include numbers and metrics to demonstrate impact.',
        before: 'Managed a team',
        after: 'Managed a team of 8 engineers, delivering 3 projects ahead of schedule',
        priority: 'high' as const,
      },
      {
        category: 'keywords' as const,
        title: 'Add missing technical keywords',
        description: 'Include AWS and Docker to match JD requirements.',
        priority: 'medium' as const,
      },
    ],
  };

  it('validates correct full data', () => {
    const result = resumeSuggestionResultSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('allows empty suggestions array', () => {
    const result = resumeSuggestionResultSchema.safeParse({
      suggestions: [],
    });
    expect(result.success).toBe(true);
  });

  it('validates all category types', () => {
    for (const category of ['content', 'formatting', 'keywords', 'impact']) {
      const result = resumeSuggestionResultSchema.safeParse({
        suggestions: [
          {
            category,
            title: 'Test',
            description: 'Test description',
            priority: 'low',
          },
        ],
      });
      expect(result.success).toBe(true);
    }
  });

  it('validates all priority levels', () => {
    for (const priority of ['high', 'medium', 'low']) {
      const result = resumeSuggestionResultSchema.safeParse({
        suggestions: [
          {
            category: 'content',
            title: 'Test',
            description: 'Test description',
            priority,
          },
        ],
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid category', () => {
    const result = resumeSuggestionResultSchema.safeParse({
      suggestions: [
        {
          category: 'style',
          title: 'Test',
          description: 'Test',
          priority: 'low',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid priority', () => {
    const result = resumeSuggestionResultSchema.safeParse({
      suggestions: [
        {
          category: 'content',
          title: 'Test',
          description: 'Test',
          priority: 'critical',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('allows before/after to be omitted', () => {
    const result = resumeSuggestionResultSchema.safeParse({
      suggestions: [
        {
          category: 'formatting',
          title: 'Use bullet points',
          description: 'Replace long paragraphs with concise bullet points.',
          priority: 'medium',
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.suggestions[0].before).toBeUndefined();
      expect(result.data.suggestions[0].after).toBeUndefined();
    }
  });

  it('rejects missing title', () => {
    const result = resumeSuggestionResultSchema.safeParse({
      suggestions: [
        {
          category: 'content',
          description: 'Test',
          priority: 'low',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
