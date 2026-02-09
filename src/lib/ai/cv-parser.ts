import { generateText, Output } from 'ai';

import { MODELS } from './models';
import { cvParsedDataSchema, type CvParsedData } from './schemas';

const MAX_INPUT_CHARS = 100_000;

const SYSTEM_PROMPT = `You are an expert CV/resume parser. Extract structured data from the provided CV text.

Rules:
- Extract all available information accurately
- Use YYYY-MM format for all dates (e.g., 2023-01)
- If only a year is given, use YYYY-01 (January of that year)
- Set "current" to true and "endDate" to null for current positions
- List skills as individual items, not comma-separated groups
- Order experience entries in reverse chronological order (most recent first)
- If information is not present in the CV, omit the field
- Do not infer or fabricate any information not explicitly stated`;

export async function parseCvText(
  rawText: string,
): Promise<{ data: CvParsedData; usage: { inputTokens: number; outputTokens: number } }> {
  const truncated =
    rawText.length > MAX_INPUT_CHARS
      ? rawText.slice(0, MAX_INPUT_CHARS)
      : rawText;

  const result = await generateText({
    model: MODELS.parse,
    system: SYSTEM_PROMPT,
    prompt: truncated,
    output: Output.object({ schema: cvParsedDataSchema }),
  });

  return {
    data: result.output,
    usage: {
      inputTokens: result.usage.inputTokens ?? 0,
      outputTokens: result.usage.outputTokens ?? 0,
    },
  };
}

export function calculateConfidence(data: CvParsedData): string {
  let score = 0;
  let total = 0;

  // Contact info (4 fields, weighted lower)
  const contactFields = [data.name, data.email, data.phone, data.location];
  total += contactFields.length;
  score += contactFields.filter(Boolean).length;

  // Core sections (heavily weighted)
  total += 3;
  if (data.skills.length > 0) score += 1;
  if (data.experience.length > 0) score += 1;
  if (data.education.length > 0) score += 1;

  // Experience detail quality
  if (data.experience.length > 0) {
    total += 2;
    const hasDescriptions = data.experience.some((e) => e.description);
    const hasDates = data.experience.every((e) => e.startDate);
    if (hasDescriptions) score += 1;
    if (hasDates) score += 1;
  }

  // Bonus sections
  total += 2;
  if (data.summary) score += 1;
  if (data.certifications && data.certifications.length > 0) score += 0.5;
  if (data.languages && data.languages.length > 0) score += 0.5;

  const confidence = total > 0 ? score / total : 0;
  return Math.min(1, confidence).toFixed(2);
}
