import { openai } from './providers';

export const MODELS = {
  parse: openai('gpt-4.1-nano'),
  jd_extraction: openai('gpt-4.1-nano'),
  match: openai('gpt-4o-mini'),
  cover_letter: openai('gpt-4.1'),
  interview_prep: openai('gpt-4o-mini'),
  resume_suggestions: openai('gpt-4.1'),
} as const;

export const MODEL_NAMES: Record<keyof typeof MODELS, string> = {
  parse: 'gpt-4.1-nano',
  jd_extraction: 'gpt-4.1-nano',
  match: 'gpt-4o-mini',
  cover_letter: 'gpt-4.1',
  interview_prep: 'gpt-4o-mini',
  resume_suggestions: 'gpt-4.1',
};
