import { describe, expect, it } from 'vitest';
import {
  createTemplateSchema,
  updateTemplateSchema,
  reorderTemplatesSchema,
} from '@/lib/templates/schemas';

describe('createTemplateSchema', () => {
  it('validates a valid template', () => {
    const result = createTemplateSchema.safeParse({
      fieldKey: 'Years of experience',
      fieldValue: '5 years in frontend development',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty fieldKey', () => {
    const result = createTemplateSchema.safeParse({
      fieldKey: '',
      fieldValue: 'some value',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Field key is required');
    }
  });

  it('rejects missing fieldKey', () => {
    const result = createTemplateSchema.safeParse({
      fieldValue: 'some value',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty fieldValue', () => {
    const result = createTemplateSchema.safeParse({
      fieldKey: 'some key',
      fieldValue: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Field value is required');
    }
  });

  it('rejects missing fieldValue', () => {
    const result = createTemplateSchema.safeParse({
      fieldKey: 'some key',
    });
    expect(result.success).toBe(false);
  });

  it('rejects fieldKey exceeding 200 characters', () => {
    const result = createTemplateSchema.safeParse({
      fieldKey: 'a'.repeat(201),
      fieldValue: 'value',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('200');
    }
  });

  it('accepts fieldKey of exactly 200 characters', () => {
    const result = createTemplateSchema.safeParse({
      fieldKey: 'a'.repeat(200),
      fieldValue: 'value',
    });
    expect(result.success).toBe(true);
  });

  it('rejects fieldValue exceeding 2000 characters', () => {
    const result = createTemplateSchema.safeParse({
      fieldKey: 'key',
      fieldValue: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('2000');
    }
  });

  it('accepts fieldValue of exactly 2000 characters', () => {
    const result = createTemplateSchema.safeParse({
      fieldKey: 'key',
      fieldValue: 'a'.repeat(2000),
    });
    expect(result.success).toBe(true);
  });

  it('trims whitespace from fieldKey', () => {
    const result = createTemplateSchema.safeParse({
      fieldKey: '  Years of experience  ',
      fieldValue: 'value',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fieldKey).toBe('Years of experience');
    }
  });

  it('trims whitespace from fieldValue', () => {
    const result = createTemplateSchema.safeParse({
      fieldKey: 'key',
      fieldValue: '  5 years  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fieldValue).toBe('5 years');
    }
  });

  it('rejects whitespace-only fieldKey after trim', () => {
    const result = createTemplateSchema.safeParse({
      fieldKey: '   ',
      fieldValue: 'value',
    });
    expect(result.success).toBe(false);
  });

  it('rejects whitespace-only fieldValue after trim', () => {
    const result = createTemplateSchema.safeParse({
      fieldKey: 'key',
      fieldValue: '   ',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateTemplateSchema', () => {
  it('accepts partial update - fieldKey only', () => {
    const result = updateTemplateSchema.safeParse({
      fieldKey: 'Updated key',
    });
    expect(result.success).toBe(true);
  });

  it('accepts partial update - fieldValue only', () => {
    const result = updateTemplateSchema.safeParse({
      fieldValue: 'Updated value',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no changes)', () => {
    const result = updateTemplateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('still validates field constraints', () => {
    const result = updateTemplateSchema.safeParse({
      fieldKey: '',
    });
    expect(result.success).toBe(false);
  });

  it('still validates max length constraints', () => {
    const result = updateTemplateSchema.safeParse({
      fieldValue: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

describe('reorderTemplatesSchema', () => {
  it('validates array of UUIDs', () => {
    const result = reorderTemplatesSchema.safeParse({
      orderedIds: [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001',
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty array', () => {
    const result = reorderTemplatesSchema.safeParse({ orderedIds: [] });
    expect(result.success).toBe(false);
  });

  it('rejects non-UUID strings', () => {
    const result = reorderTemplatesSchema.safeParse({
      orderedIds: ['not-a-uuid'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing orderedIds', () => {
    const result = reorderTemplatesSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
