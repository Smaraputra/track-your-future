import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('Applications list/create route (GET/POST /api/applications)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/applications/route.ts'),
    'utf-8',
  );

  it('exports GET and POST handlers', () => {
    expect(source).toContain('export async function GET');
    expect(source).toContain('export async function POST');
  });

  it('checks auth session in both handlers', () => {
    expect(source).toContain('await auth()');
    expect(source).toContain('status: 401');
  });

  it('scopes query by userId', () => {
    expect(source).toContain('eq(applications.userId, session.user.id)');
  });

  it('supports status and roleId query filters', () => {
    expect(source).toContain("searchParams.get('status')");
    expect(source).toContain("searchParams.get('roleId')");
  });

  it('LEFT JOINs roleCategories for role info', () => {
    expect(source).toContain('.leftJoin(roleCategories');
    expect(source).toContain('roleCategoryName: roleCategories.name');
    expect(source).toContain('roleCategoryColor: roleCategories.color');
  });

  it('orders by updatedAt descending', () => {
    expect(source).toContain('desc(applications.updatedAt)');
  });

  it('validates request body with createApplicationSchema', () => {
    expect(source).toContain('createApplicationSchema.safeParse');
    expect(source).toContain('Validation failed');
    expect(source).toContain('status: 400');
  });

  it('checks resource limit before creating', () => {
    expect(source).toContain('checkResourceLimit');
    expect(source).toContain("'applications'");
    expect(source).toContain('status: 403');
  });

  it('verifies roleCategoryId ownership when provided', () => {
    expect(source).toContain('eq(roleCategories.id, roleCategoryId)');
    expect(source).toContain('Role category not found');
  });

  it('auto-sets appliedAt for non-draft status', () => {
    expect(source).toContain("status !== 'draft'");
    expect(source).toContain('new Date()');
  });

  it('returns 201 on successful creation', () => {
    expect(source).toContain('status: 201');
  });

  it('handles invalid JSON body', () => {
    expect(source).toContain('request.json().catch(() => null)');
    expect(source).toContain('Invalid JSON');
  });
});

describe('Application detail route (GET/PATCH/DELETE /api/applications/[applicationId])', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/applications/[applicationId]/route.ts'),
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

  it('extracts applicationId from params', () => {
    expect(source).toContain('const { applicationId } = await params');
  });

  it('returns 404 when application not found', () => {
    expect(source).toContain('Application not found');
    expect(source).toContain('status: 404');
  });

  it('GET includes status history', () => {
    expect(source).toContain('applicationStatusHistory');
    expect(source).toContain('statusHistory: history');
  });

  it('GET includes linked documents', () => {
    expect(source).toContain('applicationDocuments');
    expect(source).toContain('linkedDocuments: linkedDocs');
  });

  it('GET LEFT JOINs roleCategories', () => {
    expect(source).toContain('.leftJoin(roleCategories');
    expect(source).toContain('roleCategoryName');
  });

  it('PATCH validates with updateApplicationSchema', () => {
    expect(source).toContain('updateApplicationSchema.safeParse');
  });

  it('PATCH verifies role category ownership when changed', () => {
    expect(source).toContain('eq(roleCategories.id, newRoleId)');
    expect(source).toContain('eq(roleCategories.userId, session.user.id)');
  });

  it('PATCH checks ownership before updating', () => {
    expect(source).toContain('eq(applications.userId, session.user.id)');
  });

  it('PATCH returns existing if no fields changed', () => {
    expect(source).toContain('Object.keys(updateData).length === 0');
    expect(source).toContain('return NextResponse.json(existing)');
  });

  it('DELETE checks ownership before deleting', () => {
    const deleteSection = source.slice(
      source.lastIndexOf('export async function DELETE'),
    );
    expect(deleteSection).toContain('eq(applications.userId, session.user.id)');
  });

  it('DELETE returns success response', () => {
    expect(source).toContain("{ success: true }");
  });
});
