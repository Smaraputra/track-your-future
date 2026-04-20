import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { sendTrialEndingEmail } from '@/lib/email';

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

    const output = consoleSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
    expect(output).not.toContain('user@example.com');
    expect(output).toMatch(/To: <redacted sha256:[0-9a-f]{12}>/);
    expect(output).toContain('Your trial is ending soon');
    expect(output).toContain('/settings');
  });
});
