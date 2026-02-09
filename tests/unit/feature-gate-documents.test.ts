import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('countDocuments (source analysis)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/billing/feature-gate.ts'),
    'utf-8',
  );

  it('filters by isLatest=true in countDocuments', () => {
    // Extract the countDocuments function
    const fnStart = source.indexOf('async function countDocuments');
    const fnEnd = source.indexOf('}', source.indexOf('return result.count', fnStart));
    const fnSource = source.slice(fnStart, fnEnd + 1);

    expect(fnSource).toContain('eq(documents.isLatest, true)');
  });

  it('uses and() to combine userId and isLatest conditions', () => {
    const fnStart = source.indexOf('async function countDocuments');
    const fnEnd = source.indexOf('}', source.indexOf('return result.count', fnStart));
    const fnSource = source.slice(fnStart, fnEnd + 1);

    expect(fnSource).toContain('and(');
    expect(fnSource).toContain('eq(documents.userId, userId)');
  });

  it('sumStorageBytes counts all versions (no isLatest filter)', () => {
    const fnStart = source.indexOf('async function sumStorageBytes');
    const fnEnd = source.indexOf('}', source.indexOf('return Number', fnStart));
    const fnSource = source.slice(fnStart, fnEnd + 1);

    // Should NOT have isLatest filter -- all versions count toward storage
    expect(fnSource).not.toContain('isLatest');
    expect(fnSource).toContain('sum(documents.fileSizeBytes)');
  });
});
