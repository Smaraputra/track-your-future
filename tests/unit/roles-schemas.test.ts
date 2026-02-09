import { describe, expect, it } from 'vitest';
import { createRoleSchema, updateRoleSchema, reorderRolesSchema } from '@/lib/roles/schemas';
import { ROLE_COLORS, DEFAULT_ROLE_COLOR } from '@/lib/roles/constants';

describe('createRoleSchema', () => {
  it('validates a valid role with all fields', () => {
    const result = createRoleSchema.safeParse({
      name: 'Frontend Developer',
      description: 'Frontend engineering roles',
      color: '#22c55e',
    });
    expect(result.success).toBe(true);
  });

  it('validates a role with only name', () => {
    const result = createRoleSchema.safeParse({ name: 'Backend Developer' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createRoleSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Name is required');
    }
  });

  it('rejects missing name', () => {
    const result = createRoleSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects name exceeding 100 characters', () => {
    const result = createRoleSchema.safeParse({ name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('100');
    }
  });

  it('accepts name of exactly 100 characters', () => {
    const result = createRoleSchema.safeParse({ name: 'a'.repeat(100) });
    expect(result.success).toBe(true);
  });

  it('trims whitespace from name', () => {
    const result = createRoleSchema.safeParse({ name: '  Frontend Dev  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Frontend Dev');
    }
  });

  it('rejects description exceeding 500 characters', () => {
    const result = createRoleSchema.safeParse({
      name: 'Test',
      description: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty description', () => {
    const result = createRoleSchema.safeParse({
      name: 'Test',
      description: '',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid hex color', () => {
    const result = createRoleSchema.safeParse({
      name: 'Test',
      color: '#aaBBcc',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid color format - missing hash', () => {
    const result = createRoleSchema.safeParse({
      name: 'Test',
      color: '22c55e',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid color format - 3 char hex', () => {
    const result = createRoleSchema.safeParse({
      name: 'Test',
      color: '#abc',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid color format - non-hex chars', () => {
    const result = createRoleSchema.safeParse({
      name: 'Test',
      color: '#gggggg',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid color format - named color', () => {
    const result = createRoleSchema.safeParse({
      name: 'Test',
      color: 'red',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateRoleSchema', () => {
  it('accepts partial updates - name only', () => {
    const result = updateRoleSchema.safeParse({ name: 'Updated' });
    expect(result.success).toBe(true);
  });

  it('accepts partial updates - color only', () => {
    const result = updateRoleSchema.safeParse({ color: '#ef4444' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no changes)', () => {
    const result = updateRoleSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('still validates field constraints', () => {
    const result = updateRoleSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});

describe('reorderRolesSchema', () => {
  it('validates array of UUIDs', () => {
    const result = reorderRolesSchema.safeParse({
      orderedIds: [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001',
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty array', () => {
    const result = reorderRolesSchema.safeParse({ orderedIds: [] });
    expect(result.success).toBe(false);
  });

  it('rejects non-UUID strings', () => {
    const result = reorderRolesSchema.safeParse({
      orderedIds: ['not-a-uuid'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing orderedIds', () => {
    const result = reorderRolesSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('ROLE_COLORS', () => {
  it('has 8 preset colors', () => {
    expect(ROLE_COLORS).toHaveLength(8);
  });

  it('all colors are valid hex format', () => {
    for (const color of ROLE_COLORS) {
      expect(color.value).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('all colors have labels', () => {
    for (const color of ROLE_COLORS) {
      expect(color.label.length).toBeGreaterThan(0);
    }
  });

  it('DEFAULT_ROLE_COLOR is the first color', () => {
    expect(DEFAULT_ROLE_COLOR).toBe(ROLE_COLORS[0].value);
  });
});
