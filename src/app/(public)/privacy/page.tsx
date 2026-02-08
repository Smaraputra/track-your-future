import type { Metadata } from 'next';
import { RetroWindow } from '@/components/retro-window';

export const metadata: Metadata = {
  title: 'Privacy Policy | Track Your Future',
  description: 'How Track Your Future collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <RetroWindow title="sys://privacy-policy">
        <article className="prose-retro space-y-6 font-body text-sm leading-relaxed">
          <header>
            <h1 className="font-heading text-primary text-2xl">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground mt-1">
              Last updated: February 2026
            </p>
          </header>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              1. Introduction
            </h2>
            <p className="text-muted-foreground">
              Track Your Future (&quot;we,&quot; &quot;our,&quot; or
              &quot;us&quot;) operates a job application tracking platform
              available at trackyourfuture.app (the &quot;Service&quot;). This
              Privacy Policy explains how we collect, use, disclose, and protect
              your personal data when you use our Service.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              2. Data We Collect
            </h2>
            <h3 className="font-heading text-foreground text-base">
              2.1 Account Information
            </h3>
            <p className="text-muted-foreground">
              When you register, we collect your name, email address, and a
              hashed version of your password. If you sign in with Google or
              GitHub, we receive your name, email, and profile image from those
              providers.
            </p>
            <h3 className="font-heading text-foreground text-base">
              2.2 Application Data
            </h3>
            <p className="text-muted-foreground">
              You may enter job application details including company names, role
              titles, descriptions, URLs, salary information, status updates, and
              notes. This data is stored in our database and scoped exclusively
              to your account.
            </p>
            <h3 className="font-heading text-foreground text-base">
              2.3 Documents
            </h3>
            <p className="text-muted-foreground">
              You may upload CVs, cover letters, and other documents. Files are
              stored in our S3-compatible object storage. We store metadata
              including file name, type, and size.
            </p>
            <h3 className="font-heading text-foreground text-base">
              2.4 AI-Processed Data
            </h3>
            <p className="text-muted-foreground">
              When you use AI features (CV parsing, job description extraction,
              match scoring, cover letter generation, interview preparation), your
              data is sent to third-party AI providers (OpenAI, Anthropic, or
              Google). We track AI usage metadata (provider, model, token counts,
              cost) but do not store raw AI responses beyond the structured
              results you see in the application.
            </p>
            <h3 className="font-heading text-foreground text-base">
              2.5 Billing Data
            </h3>
            <p className="text-muted-foreground">
              Payment processing is handled by Stripe. We store your Stripe
              customer ID, subscription status, and payment history. We do not
              store credit card numbers, bank details, or other sensitive
              financial information.
            </p>
            <h3 className="font-heading text-foreground text-base">
              2.6 Technical Data
            </h3>
            <p className="text-muted-foreground">
              We collect IP addresses for rate limiting and security purposes.
              These are processed in memory and not stored long-term. We use
              localStorage in your browser for UI preferences (theme selection,
              sidebar state, cookie consent, boot animation).
            </p>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              3. How We Use Your Data
            </h2>
            <ul className="text-muted-foreground list-inside list-disc space-y-1">
              <li>To provide and maintain the Service</li>
              <li>To authenticate your identity and secure your account</li>
              <li>To process job applications and documents you manage</li>
              <li>To provide AI-powered analysis at your request</li>
              <li>To process subscription payments via Stripe</li>
              <li>To send transactional emails (verification, password reset)</li>
              <li>To enforce rate limits and prevent abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              4. Third-Party Services
            </h2>
            <p className="text-muted-foreground">We share data with:</p>
            <ul className="text-muted-foreground list-inside list-disc space-y-1">
              <li>
                <strong>Stripe</strong> -- for payment processing (subject to
                Stripe&apos;s Privacy Policy)
              </li>
              <li>
                <strong>AI Providers</strong> (OpenAI, Anthropic, Google) -- for
                AI features you explicitly invoke
              </li>
              <li>
                <strong>OAuth Providers</strong> (Google, GitHub) -- if you choose
                social sign-in
              </li>
              <li>
                <strong>Email Service</strong> -- for transactional email delivery
              </li>
            </ul>
            <p className="text-muted-foreground">
              We do not sell your personal data to any third party.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              5. Data Retention
            </h2>
            <p className="text-muted-foreground">
              We retain your data for as long as your account is active. You may
              request data export or account deletion at any time from the
              Settings page. Upon account deletion, all your data (applications,
              documents, AI usage, subscriptions) is permanently removed through
              cascading database deletion.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              6. Your Rights (GDPR)
            </h2>
            <p className="text-muted-foreground">
              Under the General Data Protection Regulation, you have the right
              to:
            </p>
            <ul className="text-muted-foreground list-inside list-disc space-y-1">
              <li>
                <strong>Access</strong> -- Export all your data as JSON from
                Settings
              </li>
              <li>
                <strong>Rectification</strong> -- Edit your profile and
                application data at any time
              </li>
              <li>
                <strong>Erasure</strong> -- Delete your account and all associated
                data from Settings
              </li>
              <li>
                <strong>Portability</strong> -- Download your data in a
                machine-readable format
              </li>
              <li>
                <strong>Restriction</strong> -- Contact us to restrict processing
              </li>
              <li>
                <strong>Objection</strong> -- Contact us to object to specific
                processing
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              7. Cookies and Local Storage
            </h2>
            <p className="text-muted-foreground">
              We use session cookies for authentication (managed by NextAuth.js).
              We use browser localStorage for UI preferences: theme selection
              (green/amber), sidebar collapsed state, CRT overlay toggle, cookie
              consent status, and boot animation seen state. No third-party
              tracking cookies are used.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              8. Security
            </h2>
            <p className="text-muted-foreground">
              We protect your data with: hashed passwords (bcrypt), JWT-based
              session tokens, HTTPS encryption in transit, rate limiting on
              authentication endpoints, and scoped database queries that prevent
              cross-tenant data access. While we implement industry-standard
              security measures, no system is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              9. Changes to This Policy
            </h2>
            <p className="text-muted-foreground">
              We may update this policy from time to time. Material changes will
              be communicated via email or in-app notification. Continued use of
              the Service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              10. Contact
            </h2>
            <p className="text-muted-foreground">
              For privacy-related inquiries, contact us at
              privacy@trackyourfuture.app.
            </p>
          </section>
        </article>
      </RetroWindow>
    </div>
  );
}
