import { createHash } from 'crypto';

import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

function getBaseUrl(): string {
  return process.env.AUTH_URL ?? 'http://localhost:3000';
}

function redactRecipient(email: string): string {
  const hash = createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
  return `sha256:${hash.slice(0, 12)}`;
}

async function sendEmail(opts: SendEmailOptions): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
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
    from: process.env.EMAIL_FROM ?? (() => { throw new Error('EMAIL_FROM environment variable is required in production'); })(),
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<void> {
  const url = `${getBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: email,
    subject: 'Reset your Tracked Your Future password',
    html: `
      <p>Someone (hopefully you) asked to reset the password on your account.</p>
      <p><a href="${url}">Click here to set a new password.</a></p>
      <p>This link expires in one hour and can only be used once. If you did not request a reset, you can ignore this email — your current password will keep working.</p>
    `,
  });
}

export async function sendLoginLockoutEmail(email: string): Promise<void> {
  const resetUrl = `${getBaseUrl()}/reset-password`;
  await sendEmail({
    to: email,
    subject: 'Unusual sign-in activity on your Tracked Your Future account',
    html: `
      <p>We detected several failed sign-in attempts on your account.</p>
      <p>Your account is temporarily locked for about an hour as a precaution. You can still sign in with Google or GitHub if you have those connected.</p>
      <p>If this was not you, we recommend <a href="${resetUrl}">resetting your password</a> as soon as the lock clears.</p>
      <p>If it was you, you can safely ignore this email.</p>
    `,
  });
}

export async function sendTrialEndingEmail(
  email: string,
  trialEnd: Date | null,
): Promise<void> {
  const endDate = trialEnd
    ? trialEnd.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'soon';
  const url = `${getBaseUrl()}/settings`;
  await sendEmail({
    to: email,
    subject: 'Your trial is ending soon - Tracked Your Future',
    html: `<p>Your Pro trial ends on ${endDate}.</p><p>To keep your Pro features, add a payment method in your <a href="${url}">account settings</a>.</p><p>If you don't add a payment method, your account will be downgraded to the Free plan.</p>`,
  });
}

