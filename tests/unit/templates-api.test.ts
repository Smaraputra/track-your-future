import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('Templates list/create route (GET/POST /api/roles/[roleId]/templates)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/roles/[roleId]/templates/route.ts'),
    'utf-8',
  );

  it('exports GET and POST handlers', () => {
    expect(source).toContain('export async function GET');
    expect(source).toContain('export async function POST');
  });

  it('checks auth session', () => {
    expect(source).toContain('await auth()');
    expect(source).toContain('status: 401');
  });

  it('extracts roleId from params', () => {
    expect(source).toContain('const { roleId } = await params');
  });

  it('verifies role ownership in GET', () => {
    expect(source).toContain('eq(roleCategories.userId, session.user.id)');
    expect(source).toContain('Role not found');
    expect(source).toContain('status: 404');
  });

  it('orders templates by position and createdAt', () => {
    expect(source).toContain('asc(formFieldTemplates.position)');
    expect(source).toContain('asc(formFieldTemplates.createdAt)');
  });

  it('scopes queries by userId', () => {
    expect(source).toContain('eq(formFieldTemplates.userId, session.user.id)');
  });

  it('validates request body with createTemplateSchema', () => {
    expect(source).toContain('createTemplateSchema.safeParse');
    expect(source).toContain('Validation failed');
    expect(source).toContain('status: 400');
  });

  it('checks global template resource limit before creating', () => {
    expect(source).toContain('checkResourceLimit');
    expect(source).toContain("'formFieldTemplates'");
    expect(source).toContain('status: 403');
  });

  it('checks fieldKey uniqueness within role (409 on duplicate)', () => {
    expect(source).toContain(
      'eq(formFieldTemplates.fieldKey, parsed.data.fieldKey)',
    );
    expect(source).toContain('already exists');
    expect(source).toContain('status: 409');
  });

  it('assigns position based on current count', () => {
    expect(source).toContain('position: maxResult.count');
  });

  it('returns 201 on successful creation', () => {
    expect(source).toContain('status: 201');
  });
});

describe('Template detail route (GET/PATCH/DELETE /api/roles/[roleId]/templates/[templateId])', () => {
  const source = readFileSync(
    resolve(
      ROOT,
      'src/app/api/roles/[roleId]/templates/[templateId]/route.ts',
    ),
    'utf-8',
  );

  it('exports GET, PATCH, DELETE handlers', () => {
    expect(source).toContain('export async function GET');
    expect(source).toContain('export async function PATCH');
    expect(source).toContain('export async function DELETE');
  });

  it('checks auth session', () => {
    expect(source).toContain('await auth()');
    expect(source).toContain('status: 401');
  });

  it('extracts roleId and templateId from params', () => {
    expect(source).toContain(
      'const { roleId, templateId } = await params',
    );
  });

  it('verifies role ownership', () => {
    expect(source).toContain('eq(roleCategories.userId, session.user.id)');
    expect(source).toContain('Role not found');
  });

  it('returns 404 when template not found', () => {
    expect(source).toContain('Template not found');
    expect(source).toContain('status: 404');
  });

  it('PATCH validates with updateTemplateSchema', () => {
    expect(source).toContain('updateTemplateSchema.safeParse');
  });

  it('PATCH checks fieldKey uniqueness when key changes', () => {
    expect(source).toContain(
      'parsed.data.fieldKey !== existing.fieldKey',
    );
    expect(source).toContain('status: 409');
  });

  it('PATCH scopes update by userId and roleId', () => {
    expect(source).toContain(
      'eq(formFieldTemplates.userId, session.user.id)',
    );
    expect(source).toContain(
      'eq(formFieldTemplates.roleCategoryId, roleId)',
    );
  });

  it('DELETE scopes deletion by userId and roleId', () => {
    const deleteSection = source.slice(
      source.lastIndexOf('export async function DELETE'),
    );
    expect(deleteSection).toContain(
      'eq(formFieldTemplates.userId, session.user.id)',
    );
    expect(deleteSection).toContain(
      'eq(formFieldTemplates.roleCategoryId, roleId)',
    );
  });
});

describe('Templates reorder route (PATCH /api/roles/[roleId]/templates/reorder)', () => {
  const source = readFileSync(
    resolve(
      ROOT,
      'src/app/api/roles/[roleId]/templates/reorder/route.ts',
    ),
    'utf-8',
  );

  it('exports a PATCH handler', () => {
    expect(source).toContain('export async function PATCH');
  });

  it('checks auth session', () => {
    expect(source).toContain('await auth()');
    expect(source).toContain('status: 401');
  });

  it('verifies role ownership', () => {
    expect(source).toContain('eq(roleCategories.userId, session.user.id)');
    expect(source).toContain('Role not found');
  });

  it('validates with reorderTemplatesSchema', () => {
    expect(source).toContain('reorderTemplatesSchema.safeParse');
  });

  it('verifies all IDs belong to user and role', () => {
    expect(source).toContain('inArray(formFieldTemplates.id, orderedIds)');
    expect(source).toContain(
      'userTemplates.length !== orderedIds.length',
    );
  });

  it('updates positions in a transaction', () => {
    expect(source).toContain('db.transaction');
    expect(source).toContain('position: i');
  });

  it('scopes reorder by roleId', () => {
    expect(source).toContain(
      'eq(formFieldTemplates.roleCategoryId, roleId)',
    );
  });
});
