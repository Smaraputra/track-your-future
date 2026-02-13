import { openai, mistral, activeProvider } from './providers';

function getModel(openaiModel: string, mistralModel: string) {
  if (activeProvider === 'openai' && openai) {
    return openai(openaiModel);
  }
  if (activeProvider === 'mistral' && mistral) {
    return mistral(mistralModel);
  }
  // No provider configured. Return a stub that will fail at call time.
  // API routes guard with isAIAvailable() before invoking models.
  return new Proxy({} as ReturnType<NonNullable<typeof openai>>, {
    get(_, prop) {
      if (prop === 'modelId') return 'no-provider';
      if (prop === 'provider') return 'no-provider';
      return () => {
        throw new Error('No AI provider configured');
      };
    },
  });
}

function getModelName(openaiModel: string, mistralModel: string): string {
  if (activeProvider === 'openai') return openaiModel;
  if (activeProvider === 'mistral') return mistralModel;
  return openaiModel;
}

export const MODELS = {
  parse: getModel('gpt-4.1-nano', 'mistral-small-latest'),
  jd_extraction: getModel('gpt-4.1-nano', 'mistral-small-latest'),
  match: getModel('gpt-4o-mini', 'mistral-small-latest'),
  cover_letter: getModel('gpt-4.1', 'mistral-large-latest'),
  interview_prep: getModel('gpt-4o-mini', 'mistral-small-latest'),
  resume_suggestions: getModel('gpt-4.1', 'mistral-large-latest'),
} as const;

export const MODEL_NAMES: Record<keyof typeof MODELS, string> = {
  parse: getModelName('gpt-4.1-nano', 'mistral-small-latest'),
  jd_extraction: getModelName('gpt-4.1-nano', 'mistral-small-latest'),
  match: getModelName('gpt-4o-mini', 'mistral-small-latest'),
  cover_letter: getModelName('gpt-4.1', 'mistral-large-latest'),
  interview_prep: getModelName('gpt-4o-mini', 'mistral-small-latest'),
  resume_suggestions: getModelName('gpt-4.1', 'mistral-large-latest'),
};
