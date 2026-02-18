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
    Google({ allowDangerousEmailAccountLinking: true }),
    GitHub({ allowDangerousEmailAccountLinking: true }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase().trim();

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user?.hashedPassword) return null;
        if (!user.emailVerified) return null;

        const valid = await verifyPassword(
          parsed.data.password,
          user.hashedPassword,
        );
        if (!valid) return null;

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
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
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
