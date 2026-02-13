// Cost per 1M tokens in cents
const COST_TABLE: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4.1-nano': { input: 10, output: 40 },
  'gpt-4o-mini': { input: 15, output: 60 },
  'gpt-4.1': { input: 200, output: 800 },
  // Mistral
  'mistral-small-latest': { input: 10, output: 30 },
  'mistral-large-latest': { input: 200, output: 600 },
};

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const rates = COST_TABLE[model] ?? { input: 100, output: 400 };
  return (
    (inputTokens * rates.input) / 1_000_000 +
    (outputTokens * rates.output) / 1_000_000
  );
}
