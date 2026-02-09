import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('jina-reader module', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/ai/jina-reader.ts'),
    'utf-8',
  );

  it('uses Jina Reader base URL', () => {
    expect(source).toContain('https://r.jina.ai/');
  });

  it('URL-encodes the target URL', () => {
    expect(source).toContain('encodeURIComponent(url)');
  });

  it('sets Accept: text/plain header', () => {
    expect(source).toContain("Accept: 'text/plain'");
  });

  it('uses AbortController with 15s timeout', () => {
    expect(source).toContain('AbortController');
    expect(source).toContain('15_000');
  });

  it('checks minimum response length', () => {
    expect(source).toContain('MIN_RESPONSE_LENGTH');
    expect(source).toContain('insufficient content');
  });

  it('handles timeout errors', () => {
    expect(source).toContain('AbortError');
    expect(source).toContain('timed out');
  });

  it('handles HTTP errors', () => {
    expect(source).toContain('!res.ok');
    expect(source).toContain('Jina Reader returned HTTP');
  });

  it('exports fetchUrlAsText function', () => {
    expect(source).toContain('export async function fetchUrlAsText');
  });
});
