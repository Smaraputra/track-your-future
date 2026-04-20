import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('auth config structure', () => {
  const authSource = readFileSync(
    resolve(__dirname, '../../src/auth.ts'),
    'utf-8',
  );

  it('uses JWT session strategy', () => {
    expect(authSource).toContain("strategy: 'jwt'");
  });

  it('configures custom sign-in page', () => {
    expect(authSource).toContain("signIn: '/login'");
  });

  it('uses DrizzleAdapter', () => {
    expect(authSource).toContain('DrizzleAdapter');
  });

  it('includes Credentials provider', () => {
    expect(authSource).toContain('Credentials(');
  });

  it('includes Google provider', () => {
    expect(authSource).toContain('Google');
  });

  it('includes GitHub provider', () => {
    expect(authSource).toContain('GitHub');
  });

  it('has jwt callback that copies user.id to token', () => {
    expect(authSource).toContain('token.id = user.id');
  });

  it('has session callback that copies token.id to session', () => {
    expect(authSource).toContain('session.user.id = token.id');
  });

  it('uses public path allowlist for route protection', () => {
    expect(authSource).toContain('publicPaths');
    expect(authSource).toContain('!isPublic && !isLoggedIn');
  });

  it('uses loginSchema for validation', () => {
    expect(authSource).toContain('loginSchema');
  });

  it('checks emailVerified before login', () => {
    expect(authSource).toContain('emailVerified');
  });
});

describe('proxy.ts structure', () => {
  const proxySource = readFileSync(
    resolve(__dirname, '../../src/proxy.ts'),
    'utf-8',
  );

  it('uses the NextAuth middleware wrapper form', () => {
    expect(proxySource).toContain("import { auth } from '@/auth'");
    expect(proxySource).toContain('auth((request)');
  });

  it('has a matcher config', () => {
    expect(proxySource).toContain('matcher');
  });

  it('excludes api routes from proxy', () => {
    expect(proxySource).toContain('api');
  });
});
