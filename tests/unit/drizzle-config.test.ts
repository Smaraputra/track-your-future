import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../..');

function readFile(relativePath: string) {
  return readFileSync(resolve(root, relativePath), 'utf-8');
}

function readJson(relativePath: string) {
  return JSON.parse(readFileSync(resolve(root, relativePath), 'utf-8'));
}

describe('drizzle.config.ts', () => {
  const content = readFile('drizzle.config.ts');

  it('has correct schema path', () => {
    expect(content).toContain('./src/db/schema/index.ts');
  });

  it('has correct output directory', () => {
    expect(content).toContain("out: './drizzle'");
  });

  it('uses postgresql dialect', () => {
    expect(content).toContain("dialect: 'postgresql'");
  });
});

describe('schema barrel file', () => {
  it('exists at src/db/schema/index.ts', () => {
    expect(existsSync(resolve(root, 'src/db/schema/index.ts'))).toBe(true);
  });
});

describe('db connection module', () => {
  const content = readFile('src/db/index.ts');

  it('exists at src/db/index.ts', () => {
    expect(content).toBeTruthy();
  });

  it('uses globalThis singleton pattern', () => {
    expect(content).toContain('globalThis');
  });

  it('imports from postgres driver', () => {
    expect(content).toContain("from 'postgres'");
  });

  it('imports schema', () => {
    expect(content).toContain("from './schema'");
  });

  it('uses drizzle-orm/postgres-js', () => {
    expect(content).toContain("from 'drizzle-orm/postgres-js'");
  });

  it('configures max connections based on environment', () => {
    expect(content).toContain('max:');
    expect(content).toContain("'production'");
  });
});

describe('package.json db scripts', () => {
  const pkg = readJson('package.json');

  it.each(['db:generate', 'db:push', 'db:studio', 'db:migrate'])(
    'has %s script',
    (script) => {
      expect(pkg.scripts[script]).toBeDefined();
    },
  );
});
