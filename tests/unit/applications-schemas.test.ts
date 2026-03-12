import { describe, it, expect } from 'vitest';
import {
  createApplicationSchema,
  updateApplicationSchema,
  updateStatusSchema,
  linkDocumentSchema,
  APPLICATION_STATUSES,
  STATUS_CONFIG,
} from '@/lib/applications';

describe('APPLICATION_STATUSES', () => {
  it('has 8 statuses', () => {
    expect(APPLICATION_STATUSES).toHaveLength(8);
  });

  it('includes expected statuses in order', () => {
    expect(APPLICATION_STATUSES).toEqual([
      'draft',
      'applied',
      'phone_screen',
      'interview',
      'offer',
      'rejected',
      'ghosted',
      'withdrawn',
    ]);
  });
});

describe('STATUS_CONFIG', () => {
  it('has config for every status', () => {
    for (const status of APPLICATION_STATUSES) {
      expect(STATUS_CONFIG[status]).toBeDefined();
      expect(STATUS_CONFIG[status].label).toBeTruthy();
      expect(typeof STATUS_CONFIG[status].order).toBe('number');
      expect(typeof STATUS_CONFIG[status].isTerminal).toBe('boolean');
      expect(STATUS_CONFIG[status].colorClass).toBeTruthy();
    }
  });

  it('marks offer, rejected, ghosted, withdrawn as terminal', () => {
    expect(STATUS_CONFIG.offer.isTerminal).toBe(true);
    expect(STATUS_CONFIG.rejected.isTerminal).toBe(true);
    expect(STATUS_CONFIG.ghosted.isTerminal).toBe(true);
    expect(STATUS_CONFIG.withdrawn.isTerminal).toBe(true);
  });

  it('marks draft, applied, phone_screen, interview as non-terminal', () => {
    expect(STATUS_CONFIG.draft.isTerminal).toBe(false);
    expect(STATUS_CONFIG.applied.isTerminal).toBe(false);
    expect(STATUS_CONFIG.phone_screen.isTerminal).toBe(false);
    expect(STATUS_CONFIG.interview.isTerminal).toBe(false);
  });
});

describe('createApplicationSchema', () => {
  const validInput = {
    companyName: 'Acme Corp',
    jobTitle: 'Software Engineer',
  };

  it('accepts valid minimal input', () => {
    const result = createApplicationSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts valid full input', () => {
    const result = createApplicationSchema.safeParse({
      ...validInput,
      jobUrl: 'https://example.com/job/123',
      roleCategoryId: '550e8400-e29b-41d4-a716-446655440000',
      notes: 'Good opportunity',
      currentStatus: 'applied',
      appliedAt: '2025-01-15T10:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('requires companyName', () => {
    const result = createApplicationSchema.safeParse({ jobTitle: 'Engineer' });
    expect(result.success).toBe(false);
  });

  it('requires jobTitle', () => {
    const result = createApplicationSchema.safeParse({ companyName: 'Acme' });
    expect(result.success).toBe(false);
  });

  it('rejects empty companyName after trim', () => {
    const result = createApplicationSchema.safeParse({
      companyName: '   ',
      jobTitle: 'Engineer',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty jobTitle after trim', () => {
    const result = createApplicationSchema.safeParse({
      companyName: 'Acme',
      jobTitle: '   ',
    });
    expect(result.success).toBe(false);
  });

  it('trims companyName and jobTitle', () => {
    const result = createApplicationSchema.safeParse({
      companyName: '  Acme Corp  ',
      jobTitle: '  Engineer  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.companyName).toBe('Acme Corp');
      expect(result.data.jobTitle).toBe('Engineer');
    }
  });

  it('rejects companyName over 200 characters', () => {
    const result = createApplicationSchema.safeParse({
      companyName: 'x'.repeat(201),
      jobTitle: 'Engineer',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid URL', () => {
    const result = createApplicationSchema.safeParse({
      ...validInput,
      jobUrl: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty string for jobUrl', () => {
    const result = createApplicationSchema.safeParse({
      ...validInput,
      jobUrl: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid roleCategoryId', () => {
    const result = createApplicationSchema.safeParse({
      ...validInput,
      roleCategoryId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty string for roleCategoryId', () => {
    const result = createApplicationSchema.safeParse({
      ...validInput,
      roleCategoryId: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = createApplicationSchema.safeParse({
      ...validInput,
      currentStatus: 'invalid_status',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid statuses', () => {
    for (const status of APPLICATION_STATUSES) {
      const result = createApplicationSchema.safeParse({
        ...validInput,
        currentStatus: status,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects notes over 20000 characters', () => {
    const result = createApplicationSchema.safeParse({
      ...validInput,
      notes: 'x'.repeat(20001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid appliedAt datetime', () => {
    const result = createApplicationSchema.safeParse({
      ...validInput,
      appliedAt: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateApplicationSchema', () => {
  it('accepts partial input', () => {
    const result = updateApplicationSchema.safeParse({
      companyName: 'New Name',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateApplicationSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('still validates field constraints', () => {
    const result = updateApplicationSchema.safeParse({
      companyName: '',
    });
    // empty string fails min(1) after trim
    expect(result.success).toBe(false);
  });
});

describe('updateStatusSchema', () => {
  it('accepts valid status', () => {
    const result = updateStatusSchema.safeParse({ status: 'applied' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = updateStatusSchema.safeParse({ status: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects missing status', () => {
    const result = updateStatusSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('linkDocumentSchema', () => {
  it('accepts valid UUID', () => {
    const result = linkDocumentSchema.safeParse({
      documentId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID', () => {
    const result = linkDocumentSchema.safeParse({ documentId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects missing documentId', () => {
    const result = linkDocumentSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
