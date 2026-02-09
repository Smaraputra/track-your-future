import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

const MIN_TEXT_LENGTH = 50;

const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

export function isSupportedMimeType(mimeType: string): mimeType is SupportedMimeType {
  return (SUPPORTED_MIME_TYPES as readonly string[]).includes(mimeType);
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function extractText(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  if (!isSupportedMimeType(mimeType)) {
    throw new Error(
      `Unsupported file type: ${mimeType}. Only PDF and DOCX files are supported.`,
    );
  }

  const text =
    mimeType === 'application/pdf'
      ? await extractTextFromPdf(buffer)
      : await extractTextFromDocx(buffer);

  const trimmed = text.trim();

  if (trimmed.length < MIN_TEXT_LENGTH) {
    throw new Error(
      `Document text too short (${trimmed.length} characters). Minimum ${MIN_TEXT_LENGTH} characters required for parsing.`,
    );
  }

  return trimmed;
}
