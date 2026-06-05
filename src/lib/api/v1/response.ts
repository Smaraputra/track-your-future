import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';

/**
 * Stable response envelope for the public `/api/v1` surface.
 *
 * Errors are wrapped as `{ error: { code, message, details? } }` so external
 * consumers get a predictable shape, distinct from the internal UI routes
 * which return `{ error: 'string' }`. Success responses pass the data through
 * directly.
 */

interface ApiErrorOptions {
  headers?: Record<string, string>;
  details?: unknown;
}

export function apiError(
  code: string,
  message: string,
  status: number,
  options: ApiErrorOptions = {},
): NextResponse {
  const error: { code: string; message: string; details?: unknown } = {
    code,
    message,
  };
  if (options.details !== undefined) error.details = options.details;
  return NextResponse.json({ error }, { status, headers: options.headers });
}

export function apiValidationError(error: ZodError): NextResponse {
  return apiError('validation_failed', 'Validation failed', 400, {
    details: error.flatten(),
  });
}

export function apiOk<T>(
  data: T,
  status = 200,
  headers?: Record<string, string>,
): NextResponse {
  return NextResponse.json(data, { status, headers });
}
