import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const root = resolve(__dirname, '../..');
const composeContent = readFileSync(resolve(root, 'docker-compose.yml'), 'utf-8');
const compose = parse(composeContent);

describe('docker-compose.yml', () => {
  it('does not have a deprecated version key', () => {
    expect(compose.version).toBeUndefined();
  });

  describe('services', () => {
    const serviceNames = Object.keys(compose.services);

    it('defines all 5 required services', () => {
      expect(serviceNames).toContain('postgres');
      expect(serviceNames).toContain('minio');
      expect(serviceNames).toContain('minio-init');
      expect(serviceNames).toContain('redis');
      expect(serviceNames).toContain('app');
    });
  });

  describe('postgres service', () => {
    const pg = compose.services.postgres;

    it('uses postgres:16-alpine image', () => {
      expect(pg.image).toBe('postgres:16-alpine');
    });

    it('exposes port 5432', () => {
      expect(pg.ports).toContainEqual('5432:5432');
    });

    it('has a named volume', () => {
      expect(pg.volumes).toBeDefined();
      expect(pg.volumes.some((v: string) => v.includes('postgres_data'))).toBe(true);
    });

    it('has a health check', () => {
      expect(pg.healthcheck).toBeDefined();
      expect(pg.healthcheck.test).toBeDefined();
    });
  });

  describe('minio service', () => {
    const minio = compose.services.minio;

    it('uses minio/minio image', () => {
      expect(minio.image).toMatch(/^minio\/minio/);
    });

    it('exposes ports 9000 and 9001', () => {
      expect(minio.ports).toContainEqual('9000:9000');
      expect(minio.ports).toContainEqual('9001:9001');
    });

    it('has a named volume', () => {
      expect(minio.volumes).toBeDefined();
      expect(minio.volumes.some((v: string) => v.includes('minio_data'))).toBe(true);
    });

    it('has a health check', () => {
      expect(minio.healthcheck).toBeDefined();
    });
  });

  describe('minio-init service', () => {
    const init = compose.services['minio-init'];

    it('uses minio/mc image', () => {
      expect(init.image).toMatch(/^minio\/mc/);
    });

    it('depends on minio being healthy', () => {
      expect(init.depends_on).toBeDefined();
      expect(init.depends_on.minio.condition).toBe('service_healthy');
    });

    it('creates the tyf-documents bucket', () => {
      expect(init.entrypoint).toContain('tyf-documents');
    });
  });

  describe('redis service', () => {
    const redis = compose.services.redis;

    it('uses redis:7-alpine image', () => {
      expect(redis.image).toBe('redis:7-alpine');
    });

    it('exposes port 6379', () => {
      expect(redis.ports).toContainEqual('6379:6379');
    });

    it('has a health check', () => {
      expect(redis.healthcheck).toBeDefined();
    });
  });

  describe('volumes', () => {
    it('defines named volumes', () => {
      expect(compose.volumes).toBeDefined();
      expect(compose.volumes).toHaveProperty('postgres_data');
      expect(compose.volumes).toHaveProperty('minio_data');
      expect(compose.volumes).toHaveProperty('redis_data');
    });
  });
});
