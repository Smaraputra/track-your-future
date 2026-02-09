export type Tier = 'free' | 'pro';

export type ResourceKey =
  | 'applications'
  | 'documents'
  | 'roleCategories'
  | 'formFieldTemplates'
  | 'storageBytes';

export type AiFeatureKey =
  | 'parse'
  | 'match'
  | 'cover_letter'
  | 'interview_prep'
  | 'resume_suggestions'
  | 'jd_extraction';

interface ResourceLimits {
  applications: number | null;
  documents: number | null;
  roleCategories: number | null;
  formFieldTemplates: number | null;
  storageBytes: number | null;
}

interface AiLimits {
  parse: number | null;
  match: number | null;
  cover_letter: number | null;
  interview_prep: number | null;
  resume_suggestions: number | null;
  jd_extraction: number | null;
}

interface PlanConfig {
  resources: ResourceLimits;
  ai: AiLimits;
}

export const PLAN_LIMITS: Record<Tier, PlanConfig> = {
  free: {
    resources: {
      applications: 25,
      documents: 10,
      roleCategories: 3,
      formFieldTemplates: 20,
      storageBytes: 50 * 1024 * 1024, // 50 MB
    },
    ai: {
      parse: 3,
      match: 3,
      cover_letter: 0,
      interview_prep: 0,
      resume_suggestions: 0,
      jd_extraction: 5,
    },
  },
  pro: {
    resources: {
      applications: null,
      documents: null,
      roleCategories: null,
      formFieldTemplates: null,
      storageBytes: 2 * 1024 * 1024 * 1024, // 2 GB
    },
    ai: {
      parse: null,
      match: null,
      cover_letter: 20,
      interview_prep: 20,
      resume_suggestions: 10,
      jd_extraction: null,
    },
  },
};

export interface PriceConfig {
  monthly: {
    amountCents: number;
    priceId: string;
  };
  annual: {
    amountCents: number;
    priceId: string;
  };
  trialDays: number;
}

export const PRICES: PriceConfig = {
  monthly: {
    amountCents: 900,
    priceId: process.env.STRIPE_PRICE_MONTHLY ?? '',
  },
  annual: {
    amountCents: 7900,
    priceId: process.env.STRIPE_PRICE_ANNUAL ?? '',
  },
  trialDays: 14,
};
