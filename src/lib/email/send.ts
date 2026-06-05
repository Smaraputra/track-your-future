import { createHash } from 'crypto';

import nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export function getBaseUrl(): string {
  return process.env.AUTH_URL ?? 'http://localhost:3000';
}

function redactRecipient(email: string): string {
  const hash = createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
  return `sha256:${hash.slice(0, 12)}`;
}

/**
 * In development, email is logged to the console with a redacted recipient
 * instead of being delivered. Set EMAIL_DEV_SEND=true to force real delivery
 * via SMTP for end-to-end testing.
 */
function shouldDeliver(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.EMAIL_DEV_SEND === 'true';
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  if (!shouldDeliver()) {
    console.log('--- DEV EMAIL ---');
    console.log(`To: <redacted ${redactRecipient(opts.to)}>`);
    console.log(`Subject: ${opts.subject}`);
    console.log(opts.html);
    console.log('--- END EMAIL ---');
    return;
  }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transport.sendMail({
    from:
      process.env.EMAIL_FROM ??
      (() => {
        throw new Error('EMAIL_FROM environment variable is required to send email');
      })(),
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}
