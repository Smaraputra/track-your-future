import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('text extraction module', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/ai/text-extraction.ts'),
    'utf-8',
  );

  it('imports PDFParse from pdf-parse', () => {
    expect(source).toContain("from 'pdf-parse'");
  });

  it('imports mammoth for DOCX extraction', () => {
    expect(source).toContain("from 'mammoth'");
  });

  it('exports extractText dispatcher function', () => {
    expect(source).toContain('export async function extractText');
  });

  it('exports extractTextFromPdf function', () => {
    expect(source).toContain('export async function extractTextFromPdf');
  });

  it('exports extractTextFromDocx function', () => {
    expect(source).toContain('export async function extractTextFromDocx');
  });

  it('dispatches PDF by MIME type', () => {
    expect(source).toContain("mimeType === 'application/pdf'");
  });

  it('dispatches DOCX by MIME type', () => {
    expect(source).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
  });

  it('throws on unsupported MIME types', () => {
    expect(source).toContain('Unsupported file type');
  });

  it('enforces minimum text length of 50 characters', () => {
    expect(source).toContain('MIN_TEXT_LENGTH = 50');
    expect(source).toContain('trimmed.length < MIN_TEXT_LENGTH');
  });

  it('provides meaningful error for short documents', () => {
    expect(source).toContain('Document text too short');
    expect(source).toContain('characters required for parsing');
  });

  it('exports isSupportedMimeType type guard', () => {
    expect(source).toContain('export function isSupportedMimeType');
  });

  it('destroys PDF parser after extraction', () => {
    expect(source).toContain('parser.destroy()');
    expect(source).toContain('finally');
  });

  it('uses mammoth extractRawText for DOCX', () => {
    expect(source).toContain('mammoth.extractRawText');
    expect(source).toContain('result.value');
  });
});

describe('getObjectBuffer (minio/presign)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/minio/presign.ts'),
    'utf-8',
  );

  it('exports getObjectBuffer function', () => {
    expect(source).toContain('export async function getObjectBuffer');
  });

  it('uses GetObjectCommand', () => {
    expect(source).toContain('new GetObjectCommand');
  });

  it('throws on empty response body', () => {
    expect(source).toContain('Empty response body');
  });

  it('concatenates chunks into Buffer', () => {
    expect(source).toContain('Buffer.concat');
  });

  it('is exported from minio barrel', () => {
    const barrel = readFileSync(
      resolve(ROOT, 'src/lib/minio/index.ts'),
      'utf-8',
    );
    expect(barrel).toContain('getObjectBuffer');
  });
});
