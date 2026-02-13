import { createOpenAI } from '@ai-sdk/openai';
import { createMistral } from '@ai-sdk/mistral';

const hasOpenAI = !!process.env.OPENAI_API_KEY;
const hasMistral = !!process.env.MISTRAL_API_KEY;

export const openai = hasOpenAI
  ? createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  : null;

export const mistral = hasMistral
  ? createMistral({ apiKey: process.env.MISTRAL_API_KEY! })
  : null;

export type AIProvider = 'openai' | 'mistral';

export const activeProvider: AIProvider | null = hasOpenAI
  ? 'openai'
  : hasMistral
    ? 'mistral'
    : null;

export function isAIAvailable(): boolean {
  return activeProvider !== null;
}
