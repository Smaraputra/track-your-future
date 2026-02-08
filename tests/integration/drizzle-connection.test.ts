import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('Drizzle connection integration', () => {
  it('executes a basic query via drizzle', async () => {
    const { db } = await import('@/db');
    const result = await db.execute(sql`SELECT 1 AS value`);
    expect(result[0].value).toBe(1);
  });

  it('reports the correct database name', async () => {
    const { db } = await import('@/db');
    const result = await db.execute(sql`SELECT current_database() AS db`);
    expect(result[0].db).toBe('track_your_future');
  });

  it('supports parameterized queries with sql template tag', async () => {
    const { db } = await import('@/db');
    const a = 5;
    const b = 3;
    const result = await db.execute(sql`SELECT ${a}::int + ${b}::int AS sum`);
    expect(result[0].sum).toBe(8);
  });
});
