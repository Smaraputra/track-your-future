import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

import { cvParsedDataSchema } from '@/lib/ai/schemas';
import { calculateConfidence } from '@/lib/ai/cv-parser';

const ROOT = resolve(__dirname, '../..');

describe('cvParsedDataSchema', () => {
  const validData = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+1-555-0100',
    location: 'San Francisco, CA',
    summary: 'Senior software engineer with 10 years of experience.',
    skills: ['TypeScript', 'React', 'Node.js'],
    experience: [
      {
        company: 'Acme Corp',
        title: 'Senior Engineer',
        startDate: '2020-03',
        endDate: null,
        current: true,
        description: 'Led team of 5 engineers.',
      },
    ],
    education: [
      {
        institution: 'MIT',
        degree: 'BSc',
        field: 'Computer Science',
        startDate: '2010-09',
        endDate: '2014-06',
      },
    ],
    certifications: [
      { name: 'AWS Solutions Architect', issuer: 'Amazon', date: '2022-05' },
    ],
    languages: ['English', 'Spanish'],
  };

  it('validates correct data', () => {
    const result = cvParsedDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('allows minimal data with just required arrays', () => {
    const result = cvParsedDataSchema.safeParse({
      skills: [],
      experience: [],
      education: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing skills array', () => {
    const result = cvParsedDataSchema.safeParse({
      experience: [],
      education: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing experience array', () => {
    const result = cvParsedDataSchema.safeParse({
      skills: [],
      education: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing education array', () => {
    const result = cvParsedDataSchema.safeParse({
      skills: [],
      experience: [],
    });
    expect(result.success).toBe(false);
  });

  it('validates experience entry with null endDate', () => {
    const result = cvParsedDataSchema.safeParse({
      skills: [],
      experience: [
        {
          company: 'Corp',
          title: 'Dev',
          startDate: '2023-01',
          endDate: null,
          current: true,
        },
      ],
      education: [],
    });
    expect(result.success).toBe(true);
  });

  it('validates experience entry with string endDate', () => {
    const result = cvParsedDataSchema.safeParse({
      skills: [],
      experience: [
        {
          company: 'Corp',
          title: 'Dev',
          startDate: '2020-01',
          endDate: '2023-06',
          current: false,
        },
      ],
      education: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects experience entry without company', () => {
    const result = cvParsedDataSchema.safeParse({
      skills: [],
      experience: [
        {
          title: 'Dev',
          startDate: '2020-01',
          endDate: null,
          current: true,
        },
      ],
      education: [],
    });
    expect(result.success).toBe(false);
  });

  it('allows optional fields to be omitted', () => {
    const result = cvParsedDataSchema.safeParse({
      skills: ['JavaScript'],
      experience: [],
      education: [],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBeUndefined();
      expect(result.data.certifications).toBeUndefined();
      expect(result.data.languages).toBeUndefined();
    }
  });
});

describe('calculateConfidence', () => {
  it('returns high confidence for complete profile', () => {
    const score = calculateConfidence({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+1-555-0100',
      location: 'San Francisco, CA',
      summary: 'Senior engineer.',
      skills: ['TypeScript'],
      experience: [
        {
          company: 'Corp',
          title: 'Dev',
          startDate: '2020-01',
          endDate: null,
          current: true,
          description: 'Built things.',
        },
      ],
      education: [
        { institution: 'MIT', degree: 'BSc' },
      ],
      certifications: [{ name: 'AWS' }],
      languages: ['English'],
    });
    expect(parseFloat(score)).toBeGreaterThanOrEqual(0.9);
  });

  it('returns low confidence for minimal profile', () => {
    const score = calculateConfidence({
      skills: [],
      experience: [],
      education: [],
    });
    expect(parseFloat(score)).toBeLessThan(0.5);
  });

  it('returns medium confidence for partial profile', () => {
    const score = calculateConfidence({
      name: 'Jane',
      skills: ['JS'],
      experience: [
        {
          company: 'Corp',
          title: 'Dev',
          startDate: '2020-01',
          endDate: null,
          current: true,
        },
      ],
      education: [],
    });
    const val = parseFloat(score);
    expect(val).toBeGreaterThanOrEqual(0.3);
    expect(val).toBeLessThanOrEqual(0.8);
  });

  it('returns string with 2 decimal places', () => {
    const score = calculateConfidence({
      skills: [],
      experience: [],
      education: [],
    });
    expect(score).toMatch(/^\d+\.\d{2}$/);
  });

  it('never exceeds 1.00', () => {
    const score = calculateConfidence({
      name: 'Jane Doe',
      email: 'j@e.com',
      phone: '555',
      location: 'LA',
      summary: 'Sr eng.',
      skills: ['A', 'B'],
      experience: [
        {
          company: 'C',
          title: 'D',
          startDate: '2020-01',
          endDate: null,
          current: true,
          description: 'x',
        },
      ],
      education: [{ institution: 'U', degree: 'BS' }],
      certifications: [{ name: 'C1' }],
      languages: ['En'],
    });
    expect(parseFloat(score)).toBeLessThanOrEqual(1);
  });
});

describe('cv-parser module', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/ai/cv-parser.ts'),
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
    expect(source).toContain('cvParsedDataSchema');
  });

  it('uses MODELS.parse model', () => {
    expect(source).toContain('MODELS.parse');
  });

  it('includes system prompt with extraction rules', () => {
    expect(source).toContain('YYYY-MM format');
    expect(source).toContain('reverse chronological order');
  });
});
