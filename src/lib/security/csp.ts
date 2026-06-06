import { randomBytes } from 'crypto';

export function generateCspNonce(): string {
  return randomBytes(16).toString('base64');
}

function minioConnectSrcPart(): string {
  const endpoint = process.env.MINIO_PUBLIC_ENDPOINT;
  if (!endpoint) return '';
  const useSsl = process.env.MINIO_PUBLIC_USE_SSL === 'true';
  return ` ${useSsl ? 'https' : 'http'}://${endpoint}`;
}

export function buildContentSecurityPolicy(nonce: string): string {
  const minio = minioConnectSrcPart();
  const directives = [
    "default-src 'self'",
    // challenges.cloudflare.com in script-src is a legacy fallback; under
    // 'strict-dynamic' it is ignored and the Turnstile script is trusted via the nonce.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    `connect-src 'self' https://checkout.stripe.com https://api.stripe.com https://*.polar.sh https://challenges.cloudflare.com${minio}`,
    "frame-src https://checkout.stripe.com https://*.polar.sh https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  return directives.join('; ');
}
