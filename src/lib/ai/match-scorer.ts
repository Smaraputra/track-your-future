import { generateText, Output } from 'ai';

import { MODELS } from './models';
import { matchScoreResultSchema, type MatchScoreResult } from './schemas';
import type { CvParsedData, JdExtractedData } from './schemas';

const SYSTEM_PROMPT = `You are an expert job matching analyst. Compare the candidate's CV/resume against the job description and provide a detailed match assessment.

Rules:
- Score each dimension from 0 to 100
- overallScore should be a weighted average: skills (35%), experience (30%), education (15%), keywords (20%)
- Be specific in strengths and weaknesses -- reference actual skills, roles, or requirements
- Suggestions should be actionable and directly tied to the job requirements
- If the CV has skills not in the JD, note them as transferable strengths
- If the JD requires skills absent from the CV, list them as weaknesses
- Provide at least 2 strengths, 2 weaknesses, and 3 suggestions`;

export async function scoreMatch(
  cvData: CvParsedData,
  jdData: JdExtractedData,
): Promise<{ data: MatchScoreResult; usage: { inputTokens: number; outputTokens: number } }> {
  const prompt = `## Candidate CV
${JSON.stringify(cvData, null, 2)}

## Job Description
${JSON.stringify(jdData, null, 2)}

Analyze the match between this candidate and the job description.`;

  const result = await generateText({
    model: MODELS.match,
    system: SYSTEM_PROMPT,
    prompt,
    output: Output.object({ schema: matchScoreResultSchema }),
  });

  return {
    data: result.output,
    usage: {
      inputTokens: result.usage.inputTokens ?? 0,
      outputTokens: result.usage.outputTokens ?? 0,
    },
  };
}
