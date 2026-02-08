import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../..');

function readJson(relativePath: string) {
  return JSON.parse(readFileSync(resolve(root, relativePath), 'utf-8'));
}

function readFile(relativePath: string) {
  return readFileSync(resolve(root, relativePath), 'utf-8');
}

describe('tsconfig.json', () => {
  const tsconfig = readJson('tsconfig.json');

  it('has strict mode enabled', () => {
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  it('has noEmit enabled', () => {
    expect(tsconfig.compilerOptions.noEmit).toBe(true);
  });

  it('uses react-jsx for JSX transform', () => {
    expect(tsconfig.compilerOptions.jsx).toBe('react-jsx');
  });

  it('has @/* path alias pointing to ./src/*', () => {
    expect(tsconfig.compilerOptions.paths).toEqual({
      '@/*': ['./src/*'],
    });
  });
});

describe('ESLint config', () => {
  it('imports eslint-config-prettier', () => {
    const content = readFile('eslint.config.mjs');
    expect(content).toContain('import prettier from "eslint-config-prettier"');
  });

  it('exports a valid config array', () => {
    const content = readFile('eslint.config.mjs');
    expect(content).toContain('defineConfig([');
    expect(content).toContain('export default eslintConfig');
  });

  it('includes prettier in the config array', () => {
    const content = readFile('eslint.config.mjs');
    const defineConfigMatch = content.match(/defineConfig\(\[([\s\S]*?)\]\)/);
    expect(defineConfigMatch).not.toBeNull();
    expect(defineConfigMatch![1]).toContain('prettier');
  });
});

describe('.prettierrc', () => {
  const prettierrc = readJson('.prettierrc');

  it('has semi enabled', () => {
    expect(prettierrc.semi).toBe(true);
  });

  it('has singleQuote enabled', () => {
    expect(prettierrc.singleQuote).toBe(true);
  });

  it('has printWidth set to 100', () => {
    expect(prettierrc.printWidth).toBe(100);
  });

  it('has trailingComma set to all', () => {
    expect(prettierrc.trailingComma).toBe('all');
  });
});

describe('.env.example', () => {
  const envContent = readFile('.env.example');

  it.each([
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'MINIO_ENDPOINT',
    'STRIPE_SECRET_KEY',
    'REDIS_URL',
  ])('contains %s', (variable) => {
    expect(envContent).toContain(variable);
  });
});

describe('package.json scripts', () => {
  const pkg = readJson('package.json');

  it.each(['dev', 'build', 'start', 'lint', 'typecheck', 'test', 'test:e2e'])(
    'has %s script',
    (script) => {
      expect(pkg.scripts[script]).toBeDefined();
    },
  );
});
