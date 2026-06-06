# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in Track Your Future, please report it
privately rather than opening a public issue.

Email: security@trackedyourfuture.com (or support@trackedyourfuture.com)

Please include enough detail to reproduce the issue. We aim to acknowledge
reports within a few business days. Do not publicly disclose the issue until it
has been addressed.

## Notes for reviewers

- Secrets are never committed; all configuration is supplied via environment
  variables (see `.env.example`).
- Sensitive form-field values are encrypted at rest (AES-256-GCM).
- Auth forms are protected by Cloudflare Turnstile and per-identifier rate
  limiting; responses to fetch endpoints (a CSP nonce + audit log) are applied
  per request.
