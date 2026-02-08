import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { generateToken, hashToken } from '@/lib/auth/tokens';
import {
  registerSchema,
  loginSchema,
  resetPasswordRequestSchema,
  resetPasswordConfirmSchema,
} from '@/lib/auth/schemas';

describe('password helpers', () => {
  it('hashPassword produces a bcrypt hash', async () => {
    const hash = await hashPassword('test-password');
    expect(hash).toMatch(/^\$2[aby]?\$/);
    expect(hash.length).toBeGreaterThan(50);
  });

  it('verifyPassword returns true for correct password', async () => {
    const hash = await hashPassword('correct-password');
    const result = await verifyPassword('correct-password', hash);
    expect(result).toBe(true);
  });

  it('verifyPassword returns false for wrong password', async () => {
    const hash = await hashPassword('correct-password');
    const result = await verifyPassword('wrong-password', hash);
    expect(result).toBe(false);
  });

  it('hashPassword generates different hashes for same input (salted)', async () => {
    const hash1 = await hashPassword('same-password');
    const hash2 = await hashPassword('same-password');
    expect(hash1).not.toBe(hash2);
  });
});

describe('token helpers', () => {
  it('generateToken returns a 64-char hex string', () => {
    const token = generateToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generateToken returns unique tokens', () => {
    const t1 = generateToken();
    const t2 = generateToken();
    expect(t1).not.toBe(t2);
  });

  it('hashToken returns a deterministic SHA-256 hex digest', () => {
    const token = 'test-token';
    const h1 = hashToken(token);
    const h2 = hashToken(token);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashToken returns different digests for different inputs', () => {
    const h1 = hashToken('token-a');
    const h2 = hashToken('token-b');
    expect(h1).not.toBe(h2);
  });
});

describe('Zod schemas', () => {
  describe('registerSchema', () => {
    it('accepts valid input', () => {
      const result = registerSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing name', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const result = registerSchema.safeParse({
        name: 'Test',
        email: 'not-an-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects short password', () => {
      const result = registerSchema.safeParse({
        name: 'Test',
        email: 'test@example.com',
        password: '1234567',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password over 128 chars', () => {
      const result = registerSchema.safeParse({
        name: 'Test',
        email: 'test@example.com',
        password: 'a'.repeat(129),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('accepts valid input', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'any-password',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordRequestSchema', () => {
    it('accepts valid email', () => {
      const result = resetPasswordRequestSchema.safeParse({
        email: 'test@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = resetPasswordRequestSchema.safeParse({
        email: 'bad',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordConfirmSchema', () => {
    it('accepts valid input', () => {
      const result = resetPasswordConfirmSchema.safeParse({
        token: 'some-token',
        password: 'newpassword123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty token', () => {
      const result = resetPasswordConfirmSchema.safeParse({
        token: '',
        password: 'newpassword123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects short password', () => {
      const result = resetPasswordConfirmSchema.safeParse({
        token: 'some-token',
        password: 'short',
      });
      expect(result.success).toBe(false);
    });
  });
});
