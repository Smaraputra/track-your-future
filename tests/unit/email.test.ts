import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/email';

describe('email sending (dev mode)', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('sendVerificationEmail logs to console in dev', async () => {
    await sendVerificationEmail('user@example.com', 'raw-token-abc');

    const output = consoleSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
    expect(output).toContain('user@example.com');
    expect(output).toContain('Verify your email');
    expect(output).toContain('/api/auth/verify-email?token=raw-token-abc');
  });

  it('sendPasswordResetEmail logs to console in dev', async () => {
    await sendPasswordResetEmail('user@example.com', 'reset-token-xyz');

    const output = consoleSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
    expect(output).toContain('user@example.com');
    expect(output).toContain('Reset your password');
    expect(output).toContain('/reset-password/confirm?token=reset-token-xyz');
  });
});
