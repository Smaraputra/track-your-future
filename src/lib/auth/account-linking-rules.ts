export type OauthLinkingDecision =
  | { allowed: true }
  | { allowed: false; reason: 'unverified_credentials' | 'existing_account' };

type ExistingUserSnapshot = {
  emailVerified: Date | null;
  hashedPassword: string | null;
} | null;

type ExistingAccountSnapshot = {
  provider: string;
} | null;

export function evaluateOauthLinking(options: {
  provider: string;
  existingUser: ExistingUserSnapshot;
  existingAccount: ExistingAccountSnapshot;
}): OauthLinkingDecision {
  if (!options.existingUser) {
    return { allowed: true };
  }

  if (options.existingAccount?.provider === options.provider) {
    return { allowed: true };
  }

  if (!options.existingUser.emailVerified) {
    return { allowed: false, reason: 'unverified_credentials' };
  }

  return { allowed: false, reason: 'existing_account' };
}
