import { describe, expect, it, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const insertedValues: Array<Record<string, unknown>> = [];

vi.mock('@/db', () => ({
  db: {
    insert: () => ({
      values: async (v: Record<string, unknown>) => {
        insertedValues.push(v);
      },
    }),
  },
}));

describe('logAuditEvent', () => {
  beforeEach(() => {
    insertedValues.length = 0;
    vi.resetModules();
  });

  it('derives ip from the rightmost x-forwarded-for entry', async () => {
    const { logAuditEvent } = await import('@/lib/audit/log');
    const request = new Request('http://localhost/', {
      headers: {
        'x-forwarded-for': '1.1.1.1, 2.2.2.2, 3.3.3.3',
        'user-agent': 'Mozilla/5.0 (test)',
      },
    });
    await logAuditEvent({ action: 'login_success', userId: 'u1', request });
    expect(insertedValues).toHaveLength(1);
    expect(insertedValues[0]).toMatchObject({
      action: 'login_success',
      userId: 'u1',
      ipAddress: '3.3.3.3',
      userAgent: 'Mozilla/5.0 (test)',
    });
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', async () => {
    const { logAuditEvent } = await import('@/lib/audit/log');
    const request = new Request('http://localhost/', {
      headers: { 'x-real-ip': '9.9.9.9' },
    });
    await logAuditEvent({ action: 'login_failure', request });
    expect(insertedValues[0].ipAddress).toBe('9.9.9.9');
  });

  it('records null ip/user-agent when the request has none', async () => {
    const { logAuditEvent } = await import('@/lib/audit/log');
    const request = new Request('http://localhost/');
    await logAuditEvent({ action: 'login_failure', request });
    expect(insertedValues[0].ipAddress).toBeNull();
    expect(insertedValues[0].userAgent).toBeNull();
  });

  it('honors explicit ipAddress/userAgent overrides', async () => {
    const { logAuditEvent } = await import('@/lib/audit/log');
    await logAuditEvent({
      action: 'password_changed',
      userId: 'abc',
      ipAddress: '127.0.0.1',
      userAgent: 'custom',
      metadata: { foo: 'bar' },
    });
    expect(insertedValues[0]).toMatchObject({
      action: 'password_changed',
      userId: 'abc',
      ipAddress: '127.0.0.1',
      userAgent: 'custom',
      metadata: { foo: 'bar' },
    });
  });

  it('swallows DB errors so the request path is not broken', async () => {
    vi.resetModules();
    vi.doMock('@/db', () => ({
      db: {
        insert: () => ({
          values: async () => {
            throw new Error('boom');
          },
        }),
      },
    }));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { logAuditEvent } = await import('@/lib/audit/log');
    await expect(
      logAuditEvent({ action: 'login_success' }),
    ).resolves.toBeUndefined();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

describe('audit wiring in auth routes', () => {
  const authSrc = readFileSync(
    resolve(__dirname, '../../src/auth.ts'),
    'utf-8',
  );
  const requestSrc = readFileSync(
    resolve(__dirname, '../../src/app/api/auth/password-reset/request/route.ts'),
    'utf-8',
  );
  const confirmSrc = readFileSync(
    resolve(__dirname, '../../src/app/api/auth/password-reset/confirm/route.ts'),
    'utf-8',
  );
  const changePwSrc = readFileSync(
    resolve(__dirname, '../../src/app/api/settings/change-password/route.ts'),
    'utf-8',
  );
  const deleteSrc = readFileSync(
    resolve(__dirname, '../../src/app/api/settings/account/route.ts'),
    'utf-8',
  );
  const exportSrc = readFileSync(
    resolve(__dirname, '../../src/app/api/settings/export/route.ts'),
    'utf-8',
  );

  it('auth.ts logs login_success, login_failure, login_locked', () => {
    expect(authSrc).toContain("action: 'login_success'");
    expect(authSrc).toContain("action: 'login_failure'");
    expect(authSrc).toContain("action: 'login_locked'");
  });

  it('auth.ts logs OAuth linking decisions', () => {
    expect(authSrc).toContain("action: 'oauth_linked'");
    expect(authSrc).toContain("action: 'oauth_rejected'");
  });

  it('password reset request logs the event', () => {
    expect(requestSrc).toContain("action: 'password_reset_requested'");
  });

  it('password reset confirm logs the event with the request', () => {
    expect(confirmSrc).toContain("action: 'password_reset_completed'");
    expect(confirmSrc).toContain('request,');
  });

  it('change-password logs password_changed', () => {
    expect(changePwSrc).toContain("action: 'password_changed'");
  });

  it('account deletion logs before the cascade and preserves the user id in metadata', () => {
    const auditIdx = deleteSrc.indexOf("action: 'account_deleted'");
    const deleteIdx = deleteSrc.indexOf('db.delete(users)');
    expect(auditIdx).toBeGreaterThan(-1);
    expect(deleteIdx).toBeGreaterThan(auditIdx);
    expect(deleteSrc).toContain('deletedUserId: userId');
  });

  it('export logs data_exported', () => {
    expect(exportSrc).toContain("action: 'data_exported'");
  });
});
