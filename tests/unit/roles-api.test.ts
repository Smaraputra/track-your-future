import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('Roles list/create route (GET/POST /api/roles)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/roles/route.ts'),
    'utf-8',
  );

  it('exports a GET handler', () => {
    expect(source).toContain('export async function GET');
  });

  it('exports a POST handler', () => {
    expect(source).toContain('export async function POST');
  });

  it('checks auth session in GET', () => {
    expect(source).toContain('await auth()');
    expect(source).toContain('status: 401');
  });

  it('orders roles by position and createdAt', () => {
    expect(source).toContain('asc(roleCategories.position)');
    expect(source).toContain('asc(roleCategories.createdAt)');
  });

  it('scopes query by userId', () => {
    expect(source).toContain('eq(roleCategories.userId, session.user.id)');
  });

  it('validates request body with createRoleSchema', () => {
    expect(source).toContain('createRoleSchema.safeParse');
    expect(source).toContain('Validation failed');
    expect(source).toContain('status: 400');
  });

  it('checks resource limit before creating', () => {
    expect(source).toContain('checkResourceLimit');
    expect(source).toContain("'roleCategories'");
    expect(source).toContain('status: 403');
  });

  it('checks name uniqueness (409 on duplicate)', () => {
    expect(source).toContain('eq(roleCategories.name, parsed.data.name)');
    expect(source).toContain('already exists');
    expect(source).toContain('status: 409');
  });

  it('assigns position based on current count', () => {
    expect(source).toContain('position: maxResult.count');
  });

  it('returns 201 on successful creation', () => {
    expect(source).toContain('status: 201');
  });

  it('uses default color when not specified', () => {
    expect(source).toContain('DEFAULT_ROLE_COLOR');
  });
});

describe('Role detail route (GET/PATCH/DELETE /api/roles/[roleId])', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/roles/[roleId]/route.ts'),
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

  it('extracts roleId from params', () => {
    expect(source).toContain('const { roleId } = await params');
  });

  it('returns 404 when role not found', () => {
    expect(source).toContain('Role not found');
    expect(source).toContain('status: 404');
  });

  it('GET includes relation counts', () => {
    expect(source).toContain('_counts');
    expect(source).toContain('documents');
    expect(source).toContain('applications');
    expect(source).toContain('formFieldTemplates');
  });

  it('PATCH validates with updateRoleSchema', () => {
    expect(source).toContain('updateRoleSchema.safeParse');
  });

  it('PATCH checks name uniqueness when name changes', () => {
    expect(source).toContain('parsed.data.name !== existing.name');
    expect(source).toContain('status: 409');
  });

  it('PATCH checks ownership before updating', () => {
    expect(source).toContain('eq(roleCategories.userId, session.user.id)');
  });

  it('DELETE checks ownership before deleting', () => {
    const deleteSection = source.slice(
      source.lastIndexOf('export async function DELETE'),
    );
    expect(deleteSection).toContain('eq(roleCategories.userId, session.user.id)');
  });
});

describe('Reorder route (PATCH /api/roles/reorder)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/roles/reorder/route.ts'),
    'utf-8',
  );

  it('exports a PATCH handler', () => {
    expect(source).toContain('export async function PATCH');
  });

  it('checks auth session', () => {
    expect(source).toContain('await auth()');
    expect(source).toContain('status: 401');
  });

  it('validates with reorderRolesSchema', () => {
    expect(source).toContain('reorderRolesSchema.safeParse');
  });

  it('verifies all IDs belong to user', () => {
    expect(source).toContain('inArray(roleCategories.id, orderedIds)');
    expect(source).toContain('userRoles.length !== orderedIds.length');
  });

  it('updates positions in a transaction', () => {
    expect(source).toContain('db.transaction');
    expect(source).toContain('position: i');
  });
});
