import { describe, expect, it } from 'vitest';

import { jdExtractedDataSchema } from '@/lib/ai/schemas';

describe('jdExtractedDataSchema', () => {
  const validData = {
    companyName: 'Acme Corp',
    jobTitle: 'Senior Frontend Engineer',
    location: 'San Francisco, CA',
    locationType: 'hybrid' as const,
    salaryMin: 150000,
    salaryMax: 200000,
    salaryCurrency: 'USD',
    requiredSkills: ['TypeScript', 'React', 'Node.js'],
    preferredSkills: ['GraphQL', 'AWS'],
    experienceYears: 5,
    educationRequired: "Bachelor's in Computer Science",
    responsibilities: ['Lead frontend team', 'Code reviews'],
    benefits: ['401k matching', 'Remote-friendly'],
  };

  it('validates correct full data', () => {
    const result = jdExtractedDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('allows minimal data with just required arrays', () => {
    const result = jdExtractedDataSchema.safeParse({
      requiredSkills: [],
      preferredSkills: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing requiredSkills array', () => {
    const result = jdExtractedDataSchema.safeParse({
      preferredSkills: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing preferredSkills array', () => {
    const result = jdExtractedDataSchema.safeParse({
      requiredSkills: [],
    });
    expect(result.success).toBe(false);
  });

  it('validates locationType enum values', () => {
    for (const val of ['remote', 'hybrid', 'onsite']) {
      const result = jdExtractedDataSchema.safeParse({
        requiredSkills: [],
        preferredSkills: [],
        locationType: val,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid locationType', () => {
    const result = jdExtractedDataSchema.safeParse({
      requiredSkills: [],
      preferredSkills: [],
      locationType: 'flexible',
    });
    expect(result.success).toBe(false);
  });

  it('allows optional fields to be omitted', () => {
    const result = jdExtractedDataSchema.safeParse({
      requiredSkills: ['Python'],
      preferredSkills: [],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.companyName).toBeUndefined();
      expect(result.data.salaryMin).toBeUndefined();
      expect(result.data.responsibilities).toBeUndefined();
      expect(result.data.benefits).toBeUndefined();
    }
  });

  it('validates salary as numbers', () => {
    const result = jdExtractedDataSchema.safeParse({
      requiredSkills: [],
      preferredSkills: [],
      salaryMin: 100000,
      salaryMax: 150000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects salary as string', () => {
    const result = jdExtractedDataSchema.safeParse({
      requiredSkills: [],
      preferredSkills: [],
      salaryMin: '100000',
    });
    expect(result.success).toBe(false);
  });

  it('validates experienceYears as number', () => {
    const result = jdExtractedDataSchema.safeParse({
      requiredSkills: [],
      preferredSkills: [],
      experienceYears: 3,
    });
    expect(result.success).toBe(true);
  });
});
