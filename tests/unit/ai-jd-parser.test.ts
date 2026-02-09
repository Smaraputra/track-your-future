import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

import { calculateJdConfidence } from '@/lib/ai/jd-parser';

const ROOT = resolve(__dirname, '../..');

describe('calculateJdConfidence', () => {
  it('returns high confidence for complete JD', () => {
    const score = calculateJdConfidence({
      companyName: 'Acme',
      jobTitle: 'Engineer',
      location: 'NYC',
      locationType: 'hybrid',
      salaryMin: 100000,
      salaryMax: 150000,
      salaryCurrency: 'USD',
      requiredSkills: ['TypeScript'],
      preferredSkills: ['Go'],
      experienceYears: 3,
      educationRequired: 'BS in CS',
      responsibilities: ['Build features'],
      benefits: ['401k'],
    });
    expect(parseFloat(score)).toBeGreaterThanOrEqual(0.9);
  });

  it('returns low confidence for minimal JD', () => {
    const score = calculateJdConfidence({
      requiredSkills: [],
      preferredSkills: [],
    });
    expect(parseFloat(score)).toBe(0);
  });

  it('returns medium confidence for partial JD', () => {
    const score = calculateJdConfidence({
      companyName: 'Acme',
      jobTitle: 'Dev',
      requiredSkills: ['JS'],
      preferredSkills: [],
    });
    const val = parseFloat(score);
    expect(val).toBeGreaterThanOrEqual(0.2);
    expect(val).toBeLessThanOrEqual(0.7);
  });

  it('returns string with 2 decimal places', () => {
    const score = calculateJdConfidence({
      requiredSkills: [],
      preferredSkills: [],
    });
    expect(score).toMatch(/^\d+\.\d{2}$/);
  });

  it('never exceeds 1.00', () => {
    const score = calculateJdConfidence({
      companyName: 'X',
      jobTitle: 'Y',
      location: 'Z',
      locationType: 'remote',
      salaryMin: 1,
      salaryMax: 2,
      requiredSkills: ['A'],
      preferredSkills: ['B'],
      experienceYears: 1,
      educationRequired: 'BS',
      responsibilities: ['R'],
      benefits: ['B'],
    });
    expect(parseFloat(score)).toBeLessThanOrEqual(1);
  });
});

describe('jd-parser module', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/ai/jd-parser.ts'),
    'utf-8',
  );

  it('truncates input to 100K characters', () => {
    expect(source).toContain('MAX_INPUT_CHARS = 100_000');
  });

  it('uses generateText from ai SDK', () => {
    expect(source).toContain("from 'ai'");
    expect(source).toContain('generateText');
  });

  it('uses Output.object for structured output', () => {
    expect(source).toContain('Output.object');
    expect(source).toContain('jdExtractedDataSchema');
  });

  it('uses MODELS.jd_extraction model', () => {
    expect(source).toContain('MODELS.jd_extraction');
  });

  it('includes system prompt with extraction rules', () => {
    expect(source).toContain('required skills from preferred');
    expect(source).toContain('ISO 4217 currency codes');
    expect(source).toContain('Do not infer or fabricate');
  });
});
