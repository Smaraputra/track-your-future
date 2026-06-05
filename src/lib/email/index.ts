import { APP_NAME, renderEmail } from './layout';
import { getBaseUrl, sendEmail } from './send';

export type { EmailCategory } from './layout';
export { getBaseUrl } from './send';

export async function sendVerificationEmail(
  email: string,
  token: string,
): Promise<void> {
  const url = `${getBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: email,
    subject: `Verify your ${APP_NAME} email`,
    html: renderEmail({
      category: 'transactional',
      preheader: 'Confirm your email address to activate your account.',
      heading: 'Confirm your email',
      bodyHtml: `
        <p>Welcome to ${APP_NAME}. Confirm your email address to activate your account.</p>
        <p><a href="${url}" style="color:#22c55e;text-decoration:underline;">Verify my email</a></p>
        <p style="color:#8a8a8a;">This link expires in 24 hours. If you did not create an account, you can ignore this email.</p>
      `,
    }),
  });
}

export async function sendAccountExistsEmail(email: string): Promise<void> {
  const loginUrl = `${getBaseUrl()}/login`;
  const resetUrl = `${getBaseUrl()}/forgot-password`;
  await sendEmail({
    to: email,
    subject: `You already have a ${APP_NAME} account`,
    html: renderEmail({
      category: 'security',
      preheader: 'Someone tried to register with your email address.',
      heading: 'Account already exists',
      bodyHtml: `
        <p>Someone (hopefully you) tried to register a new ${APP_NAME} account with this email address, but an account already exists.</p>
        <p><a href="${loginUrl}" style="color:#22c55e;text-decoration:underline;">Sign in</a> instead, or <a href="${resetUrl}" style="color:#22c55e;text-decoration:underline;">reset your password</a> if you've forgotten it.</p>
        <p style="color:#8a8a8a;">If this wasn't you, no action is needed; your account is unchanged.</p>
      `,
    }),
  });
}

export async function sendWelcomeEmail(email: string): Promise<void> {
  const url = `${getBaseUrl()}/dashboard`;
  const preferencesUrl = `${getBaseUrl()}/settings`;
  await sendEmail({
    to: email,
    subject: `Welcome to ${APP_NAME}`,
    html: renderEmail({
      category: 'product',
      preferencesUrl,
      preheader: 'Your account is ready. Here is how to get started.',
      heading: 'Welcome aboard',
      bodyHtml: `
        <p>Your email is verified and your account is ready. ${APP_NAME} is your command center for tracking job applications, storing CVs and cover letters, and getting AI-powered insights.</p>
        <p><a href="${url}" style="color:#22c55e;text-decoration:underline;">Open your dashboard</a></p>
      `,
    }),
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<void> {
  const url = `${getBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: email,
    subject: `Reset your ${APP_NAME} password`,
    html: renderEmail({
      category: 'security',
      preheader: 'Reset the password on your account.',
      heading: 'Reset your password',
      bodyHtml: `
        <p>Someone (hopefully you) asked to reset the password on your account.</p>
        <p><a href="${url}" style="color:#22c55e;text-decoration:underline;">Set a new password</a></p>
        <p style="color:#8a8a8a;">This link expires in one hour and can only be used once. If you did not request a reset, you can ignore this email; your current password will keep working.</p>
      `,
    }),
  });
}

export async function sendLoginLockoutEmail(email: string): Promise<void> {
  const resetUrl = `${getBaseUrl()}/reset-password`;
  await sendEmail({
    to: email,
    subject: `Unusual sign-in activity on your ${APP_NAME} account`,
    html: renderEmail({
      category: 'security',
      preheader: 'Your account was temporarily locked after failed sign-in attempts.',
      heading: 'Unusual sign-in activity',
      bodyHtml: `
        <p>We detected several failed sign-in attempts on your account.</p>
        <p>Your account is temporarily locked for about an hour as a precaution. You can still sign in with Google or GitHub if you have those connected.</p>
        <p>If this was not you, we recommend <a href="${resetUrl}" style="color:#22c55e;text-decoration:underline;">resetting your password</a> as soon as the lock clears.</p>
        <p style="color:#8a8a8a;">If it was you, you can safely ignore this email.</p>
      `,
    }),
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
    html: renderEmail({
      category: 'transactional',
      preheader: `Your Pro trial ends ${endDate}.`,
      heading: 'Your trial is ending soon',
      bodyHtml: `
        <p>Your Pro trial ends on ${endDate}.</p>
        <p>To keep your Pro features, add a payment method in your <a href="${url}" style="color:#22c55e;text-decoration:underline;">account settings</a>.</p>
        <p style="color:#8a8a8a;">If you don't add a payment method, your account will be downgraded to the Free plan.</p>
      `,
    }),
  });
}
