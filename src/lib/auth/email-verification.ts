import { createHash, randomBytes } from 'crypto';

/** Verification links are longer-lived than password resets. */
export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export function generateVerificationToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashVerificationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function isVerificationTokenExpired(
  expiresAt: Date,
  now: Date = new Date(),
): boolean {
  return expiresAt.getTime() <= now.getTime();
}

export function verificationTokenExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MS);
}
