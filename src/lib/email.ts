import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

function getBaseUrl(): string {
  return process.env.AUTH_URL ?? 'http://localhost:3000';
}

async function sendEmail(opts: SendEmailOptions): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    console.log('--- DEV EMAIL ---');
    console.log(`To: ${opts.to}`);
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
    from: process.env.EMAIL_FROM ?? 'artanodestudios@gmail.com',
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}

export async function sendVerificationEmail(
  email: string,
  token: string,
): Promise<void> {
  const url = `${getBaseUrl()}/api/auth/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Verify your email - Track Your Future',
    html: `<p>Click the link below to verify your email address:</p><p><a href="${url}">${url}</a></p><p>This link expires in 24 hours.</p>`,
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
    subject: 'Your trial is ending soon - Track Your Future',
    html: `<p>Your Pro trial ends on ${endDate}.</p><p>To keep your Pro features, add a payment method in your <a href="${url}">account settings</a>.</p><p>If you don't add a payment method, your account will be downgraded to the Free plan.</p>`,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<void> {
  const url = `${getBaseUrl()}/reset-password/confirm?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Reset your password - Track Your Future',
    html: `<p>Click the link below to reset your password:</p><p><a href="${url}">${url}</a></p><p>This link expires in 1 hour.</p>`,
  });
}
