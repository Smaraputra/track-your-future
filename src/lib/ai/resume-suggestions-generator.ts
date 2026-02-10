import { generateText, Output } from 'ai';

import { MODELS } from './models';
import { resumeSuggestionResultSchema, type ResumeSuggestionResult } from './schemas';
import type { CvParsedData, JdExtractedData } from './schemas';

const SYSTEM_PROMPT = `You are an expert resume consultant. Analyze the candidate's resume and provide specific, actionable suggestions to improve it.

Rules:
- Provide 5-10 suggestions across all four categories: content, formatting, keywords, and impact
- Each suggestion should be specific and reference actual content from the resume
- When a "before" example is given, always provide a concrete "after" improvement
- Content suggestions: missing sections, weak descriptions, gaps in experience narrative
- Formatting suggestions: structure improvements, section ordering, consistency issues
- Keywords suggestions: missing industry terms, ATS optimization, skill alignment with JD
- Impact suggestions: quantify achievements, use stronger action verbs, highlight results
- Priority should reflect how much each change would improve the resume's effectiveness
- High priority: critical issues that significantly reduce competitiveness
- Medium priority: improvements that would noticeably strengthen the resume
- Low priority: polish items that add marginal benefit
- If a job description is provided, tailor suggestions to match the target role
- Without a JD, provide general best-practice suggestions`;

export async function generateResumeSuggestions(
  cvData: CvParsedData,
  jdData?: JdExtractedData,
): Promise<{ data: ResumeSuggestionResult; usage: { inputTokens: number; outputTokens: number } }> {
  const parts = [`## Candidate Resume\n${JSON.stringify(cvData, null, 2)}`];

  if (jdData) {
    parts.push(`## Target Job Description\n${JSON.stringify(jdData, null, 2)}`);
  }

  parts.push(
    jdData
      ? 'Analyze this resume and provide suggestions tailored to the target job.'
      : 'Analyze this resume and provide general improvement suggestions.',
  );

  const result = await generateText({
    model: MODELS.resume_suggestions,
    system: SYSTEM_PROMPT,
    prompt: parts.join('\n\n'),
    output: Output.object({ schema: resumeSuggestionResultSchema }),
  });

  return {
    data: result.output,
    usage: {
      inputTokens: result.usage.inputTokens ?? 0,
      outputTokens: result.usage.outputTokens ?? 0,
    },
  };
}
