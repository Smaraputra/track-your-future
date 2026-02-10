import { generateText } from 'ai';

import { MODELS } from './models';
import type { CvParsedData, JdExtractedData } from './schemas';

export type CoverLetterTone = 'formal' | 'casual' | 'technical' | 'leadership';

const TONE_PROMPTS: Record<CoverLetterTone, string> = {
  formal:
    'Write in a professional, formal tone. Use structured paragraphs, proper business letter conventions, and polished language.',
  casual:
    'Write in a friendly, conversational tone. Be personable and warm while remaining professional. Avoid stiff business jargon.',
  technical:
    'Write with a technical focus. Emphasize engineering skills, methodologies, and specific technologies. Use precise technical language.',
  leadership:
    'Write with a leadership focus. Emphasize team management, strategic thinking, cross-functional collaboration, and business impact.',
};

const SYSTEM_PROMPT = `You are an expert cover letter writer. Generate a compelling cover letter based on the candidate's CV and the job description.

Rules:
- Write 3-4 paragraphs
- Opening: Express genuine interest in the specific role and company
- Body: Highlight 2-3 most relevant experiences/skills that match the JD requirements
- Include specific, quantifiable achievements from the CV where possible
- Closing: Express enthusiasm and include a call to action
- Do NOT include the date, addresses, or "Dear Hiring Manager" -- start with the opening paragraph
- Do NOT include "Sincerely" or sign-off -- end with the closing paragraph
- Keep the total length between 250-400 words
- Tailor every sentence to the specific role -- avoid generic statements`;

export async function generateCoverLetter(
  cvData: CvParsedData,
  jdData: JdExtractedData,
  tone: CoverLetterTone,
): Promise<{ content: string; usage: { inputTokens: number; outputTokens: number } }> {
  const toneInstruction = TONE_PROMPTS[tone];

  const prompt = `## Tone
${toneInstruction}

## Candidate CV
${JSON.stringify(cvData, null, 2)}

## Job Description
${JSON.stringify(jdData, null, 2)}

Write the cover letter now.`;

  const result = await generateText({
    model: MODELS.cover_letter,
    system: SYSTEM_PROMPT,
    prompt,
  });

  return {
    content: result.text,
    usage: {
      inputTokens: result.usage.inputTokens ?? 0,
      outputTokens: result.usage.outputTokens ?? 0,
    },
  };
}
