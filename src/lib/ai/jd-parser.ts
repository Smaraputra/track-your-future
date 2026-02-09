import { generateText, Output } from 'ai';

import { MODELS } from './models';
import { jdExtractedDataSchema, type JdExtractedData } from './schemas';

const MAX_INPUT_CHARS = 100_000;

const SYSTEM_PROMPT = `You are an expert job description parser. Extract structured data from the provided job posting text.

Rules:
- Extract all available information accurately
- Separate required skills from preferred/nice-to-have skills
- Convert salary to annual figures if given as monthly or hourly
- Use ISO 4217 currency codes (e.g., USD, EUR, GBP)
- For experience, extract the minimum years required as a number
- List responsibilities as individual, concise bullet points
- List benefits as individual items
- If information is not present in the job posting, omit the field
- Do not infer or fabricate any information not explicitly stated`;

export async function parseJdText(
  rawText: string,
): Promise<{ data: JdExtractedData; usage: { inputTokens: number; outputTokens: number } }> {
  const truncated =
    rawText.length > MAX_INPUT_CHARS
      ? rawText.slice(0, MAX_INPUT_CHARS)
      : rawText;

  const result = await generateText({
    model: MODELS.jd_extraction,
    system: SYSTEM_PROMPT,
    prompt: truncated,
    output: Output.object({ schema: jdExtractedDataSchema }),
  });

  return {
    data: result.output,
    usage: {
      inputTokens: result.usage.inputTokens ?? 0,
      outputTokens: result.usage.outputTokens ?? 0,
    },
  };
}

export function calculateJdConfidence(data: JdExtractedData): string {
  let score = 0;
  let total = 0;

  // Core identification (company + title)
  total += 2;
  if (data.companyName) score += 1;
  if (data.jobTitle) score += 1;

  // Location info
  total += 1;
  if (data.location || data.locationType) score += 1;

  // Skills (heavily weighted)
  total += 2;
  if (data.requiredSkills.length > 0) score += 1;
  if (data.preferredSkills.length > 0) score += 1;

  // Salary info
  total += 1;
  if (data.salaryMin || data.salaryMax) score += 1;

  // Experience + education
  total += 2;
  if (data.experienceYears !== undefined) score += 1;
  if (data.educationRequired) score += 1;

  // Responsibilities + benefits
  total += 2;
  if (data.responsibilities && data.responsibilities.length > 0) score += 1;
  if (data.benefits && data.benefits.length > 0) score += 1;

  const confidence = total > 0 ? score / total : 0;
  return Math.min(1, confidence).toFixed(2);
}
