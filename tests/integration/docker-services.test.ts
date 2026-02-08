import { describe, expect, it } from 'vitest';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('Docker services integration', () => {
  describe('PostgreSQL', () => {
    it('connects and executes a query', async () => {
      const postgres = await import('postgres');
      const sql = postgres.default(DATABASE_URL!);
      try {
        const result = await sql`SELECT 1 AS value`;
        expect(result[0].value).toBe(1);
      } finally {
        await sql.end();
      }
    });

    it('reports the correct database name', async () => {
      const postgres = await import('postgres');
      const sql = postgres.default(DATABASE_URL!);
      try {
        const result = await sql`SELECT current_database() AS db`;
        expect(result[0].db).toBe('track_your_future');
      } finally {
        await sql.end();
      }
    });

    it('supports parameterized queries', async () => {
      const postgres = await import('postgres');
      const sql = postgres.default(DATABASE_URL!);
      try {
        const a = 3;
        const b = 7;
        const result = await sql`SELECT ${a}::int + ${b}::int AS sum`;
        expect(result[0].sum).toBe(10);
      } finally {
        await sql.end();
      }
    });
  });

  describe('MinIO', () => {
    it('health endpoint is reachable', async () => {
      const minioEndpoint = process.env.MINIO_ENDPOINT || 'localhost';
      const minioPort = process.env.MINIO_PORT || '9000';
      const url = `http://${minioEndpoint}:${minioPort}/minio/health/live`;
      const response = await fetch(url);
      expect(response.ok).toBe(true);
    });
  });

  describe('Redis', () => {
    it('REDIS_URL environment variable is configured', () => {
      const redisUrl = process.env.REDIS_URL;
      expect(redisUrl).toBeDefined();
      expect(redisUrl).toMatch(/^redis:\/\//);
    });
  });
});
