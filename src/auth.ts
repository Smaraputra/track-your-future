import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from '@/db/schema/auth';
import { loginSchema } from '@/lib/auth/schemas';
import { verifyPassword } from '@/lib/auth/password';
import { isOauthLinkingAllowed } from '@/lib/auth/account-linking';
import {
  LOGIN_FAILURE_THRESHOLD,
  clearLoginFailures,
  hashEmailForKey,
  isEmailLockedOut,
  recordLoginFailure,
  shouldSendLockoutNotification,
} from '@/lib/auth/login-lockout';
import { isSessionStillValid } from '@/lib/auth/session-invalidation';
import { logAuditEvent } from '@/lib/audit/log';
import { sendLoginLockoutEmail } from '@/lib/email';
import type {} from '@/lib/auth/types';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Google,
    GitHub,
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase().trim();
        const emailHash = hashEmailForKey(email);

        if (await isEmailLockedOut(emailHash)) {
          await logAuditEvent({
            action: 'login_locked',
            metadata: { emailHash },
          });
          return null;
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        const passwordOk =
          !!user?.hashedPassword &&
          !!user.emailVerified &&
          (await verifyPassword(parsed.data.password, user.hashedPassword));

        if (!passwordOk) {
          const failureCount = await recordLoginFailure(emailHash);
          await logAuditEvent({
            action: 'login_failure',
            userId: user?.id ?? null,
            metadata: {
              emailHash,
              failureCount,
              reason: !user
                ? 'unknown_email'
                : !user.hashedPassword
                  ? 'no_password_set'
                  : !user.emailVerified
                    ? 'email_unverified'
                    : 'wrong_password',
            },
          });
          if (
            failureCount >= LOGIN_FAILURE_THRESHOLD &&
            user?.email &&
            (await shouldSendLockoutNotification(emailHash))
          ) {
            try {
              await sendLoginLockoutEmail(user.email);
            } catch (err) {
              console.error('Failed to send lockout notification email', err);
            }
          }
          return null;
        }

        await clearLoginFailures(emailHash);
        await logAuditEvent({
          action: 'login_success',
          userId: user.id,
          metadata: { emailHash },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider === 'credentials') {
        return true;
      }
      if (!user.email) {
        return false;
      }
      const decision = await isOauthLinkingAllowed(account.provider, user.email);
      if (decision.allowed) {
        await logAuditEvent({
          action: 'oauth_linked',
          userId: user.id ?? null,
          metadata: { provider: account.provider },
        });
        return true;
      }
      await logAuditEvent({
        action: 'oauth_rejected',
        userId: user.id ?? null,
        metadata: { provider: account.provider, reason: decision.reason },
      });
      if (decision.reason === 'unverified_credentials') {
        return '/login?error=UnverifiedEmail';
      }
      return '/login?error=OAuthAccountNotLinked';
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.signedInAt = Math.floor(Date.now() / 1000);
        return token;
      }
      if (token.id && !(await isSessionStillValid(token.id, token.signedInAt))) {
        return null;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      return session;
    },
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const publicPaths = [
        '/',
        '/login',
        '/forgot-password',
        '/reset-password',
        '/privacy',
        '/terms',
        '/pricing',
      ];
      const isPublic =
        publicPaths.includes(nextUrl.pathname) ||
        publicPaths.some(
          (p) => p !== '/' && nextUrl.pathname.startsWith(p + '/'),
        ) ||
        nextUrl.pathname.startsWith('/api/auth/') ||
        nextUrl.pathname.startsWith('/api/webhooks/');
      if (!isPublic && !isLoggedIn) {
        return false;
      }
      return true;
    },
  },
});
