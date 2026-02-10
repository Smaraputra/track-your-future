import { generateText, Output } from 'ai';

import { MODELS } from './models';
import { interviewPrepResultSchema, type InterviewPrepResult } from './schemas';
import type { JdExtractedData } from './schemas';

const SYSTEM_PROMPT = `You are an expert interview coach. Generate interview preparation materials based on the job description.

Rules:
- Generate exactly 3 categories: behavioral, technical, and situational
- Each category should have 3-5 questions
- Questions should be specific to the job role, company, and industry
- For each question, provide a STAR method hint (Situation, Task, Action, Result framework)
- Provide a suggested answer that is specific and includes concrete examples
- Behavioral questions should cover teamwork, leadership, conflict resolution, and adaptability
- Technical questions should cover the required and preferred skills from the JD
- Situational questions should present realistic scenarios for the role
- Tailor all questions to the seniority level implied by the job title and requirements`;

export async function generateInterviewPrep(
  jdData: JdExtractedData,
  companyName?: string,
): Promise<{ data: InterviewPrepResult; usage: { inputTokens: number; outputTokens: number } }> {
  const prompt = `## Job Description
${JSON.stringify(jdData, null, 2)}

${companyName ? `## Company: ${companyName}` : ''}

Generate comprehensive interview preparation questions and answers.`;

  const result = await generateText({
    model: MODELS.interview_prep,
    system: SYSTEM_PROMPT,
    prompt,
    output: Output.object({ schema: interviewPrepResultSchema }),
  });

  return {
    data: result.output,
    usage: {
      inputTokens: result.usage.inputTokens ?? 0,
      outputTokens: result.usage.outputTokens ?? 0,
    },
  };
}
