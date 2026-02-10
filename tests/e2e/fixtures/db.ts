import bcrypt from 'bcryptjs';
import { eq, like } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '../../../src/db/schema';

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://tyf:tyf_dev_password@localhost:5432/track_your_future';

let client: ReturnType<typeof postgres> | null = null;

function getClient() {
  if (!client) {
    client = postgres(DATABASE_URL, { max: 1 });
  }
  return client;
}

export function getDb() {
  return drizzle(getClient(), { schema });
}

export async function closeDb() {
  if (client) {
    await client.end();
    client = null;
  }
}

export async function createTestUser(opts: {
  email: string;
  password: string;
  name?: string;
  onboardingCompleted?: boolean;
}) {
  const db = getDb();
  const hashedPassword = await bcrypt.hash(opts.password, 12);

  // Delete existing user first to ensure clean state
  await db.delete(schema.users).where(eq(schema.users.email, opts.email));

  const [user] = await db
    .insert(schema.users)
    .values({
      email: opts.email,
      name: opts.name ?? 'E2E Test User',
      hashedPassword,
      emailVerified: new Date(),
      onboardingCompleted: opts.onboardingCompleted ?? true,
    })
    .returning();

  return user;
}

export async function deleteTestUsers() {
  const db = getDb();
  await db.delete(schema.users).where(like(schema.users.email, '%@tyf.test'));
}

export async function createTestRole(userId: string, name: string, color?: string) {
  const db = getDb();

  // Check if role already exists
  const existing = await db.query.roleCategories.findFirst({
    where: (rc, { and, eq }) =>
      and(eq(rc.userId, userId), eq(rc.name, name)),
  });
  if (existing) return existing;

  const [role] = await db
    .insert(schema.roleCategories)
    .values({
      userId,
      name,
      color: color ?? '#22c55e',
      position: 0,
    })
    .returning();
  return role;
}

export async function createTestApplication(
  userId: string,
  opts: { companyName: string; jobTitle: string; roleCategoryId?: string },
) {
  const db = getDb();
  const [app] = await db
    .insert(schema.applications)
    .values({
      userId,
      companyName: opts.companyName,
      jobTitle: opts.jobTitle,
      roleCategoryId: opts.roleCategoryId ?? null,
      currentStatus: 'draft',
    })
    .returning();
  return app;
}

export async function deleteTestRoles(userId: string) {
  const db = getDb();
  await db
    .delete(schema.roleCategories)
    .where(eq(schema.roleCategories.userId, userId));
}

export async function deleteTestApplications(userId: string) {
  const db = getDb();
  await db
    .delete(schema.applications)
    .where(eq(schema.applications.userId, userId));
}
