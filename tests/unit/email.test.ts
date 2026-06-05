import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import {
  sendTrialEndingEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from '@/lib/email';

function capture(spy: ReturnType<typeof vi.spyOn>): string {
  return spy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
}

describe('email sending (dev mode)', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('sendTrialEndingEmail logs to console in dev with redacted recipient', async () => {
    const trialEnd = new Date('2026-03-01');
    await sendTrialEndingEmail('user@example.com', trialEnd);

    const output = capture(consoleSpy);
    expect(output).not.toContain('user@example.com');
    expect(output).toMatch(/To: <redacted sha256:[0-9a-f]{12}>/);
    expect(output).toContain('Your trial is ending soon');
    expect(output).toContain('/settings');
  });

  it('renders the shared branded layout with the verification link', async () => {
    await sendVerificationEmail('user@example.com', 'tok-123');
    const output = capture(consoleSpy);
    expect(output).toContain('tracked_your_future');
    expect(output).toContain('Verify my email');
    expect(output).toContain('/verify-email?token=tok-123');
  });

  it('transactional email omits the email-preferences footer', async () => {
    await sendVerificationEmail('user@example.com', 'tok-123');
    const output = capture(consoleSpy);
    expect(output).not.toContain('Manage email preferences');
  });

  it('product email (welcome) includes the email-preferences footer', async () => {
    await sendWelcomeEmail('user@example.com');
    const output = capture(consoleSpy);
    expect(output).toContain('Welcome');
    expect(output).toContain('Manage email preferences');
  });
});
