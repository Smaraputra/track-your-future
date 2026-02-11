import type { Metadata } from 'next';
import { RetroWindow } from '@/components/retro-window';

export const metadata: Metadata = {
  title: 'Terms of Service | Track Your Future',
  description: 'Terms and conditions for using Track Your Future.',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <RetroWindow title="sys://terms-of-service">
        <article className="prose-retro space-y-6 font-body text-sm leading-relaxed">
          <header>
            <h1 className="font-heading text-primary text-2xl">
              Terms of Service
            </h1>
            <p className="text-muted-foreground mt-1">
              Last updated: February 2026
            </p>
          </header>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground">
              By creating an account or using Track Your Future (the
              &quot;Service&quot;), you agree to be bound by these Terms of
              Service (&quot;Terms&quot;). If you do not agree, do not use the
              Service.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              2. Description of Service
            </h2>
            <p className="text-muted-foreground">
              Track Your Future is a multi-tenant SaaS platform for tracking job
              applications. The Service allows you to store CVs and cover
              letters, manage reusable form field answers, track applications
              through a status pipeline, and access AI-powered insights. The
              Service is provided on a Free and Pro tier basis.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              3. Accounts
            </h2>
            <p className="text-muted-foreground">
              You must provide accurate information when creating an account. You
              are responsible for maintaining the security of your credentials.
              You must be at least 16 years old to use the Service. One person
              may not maintain more than one account. We reserve the right to
              suspend or terminate accounts that violate these Terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              4. Subscription and Billing
            </h2>
            <h3 className="font-heading text-foreground text-base">
              4.1 Free Tier
            </h3>
            <p className="text-muted-foreground">
              The Free tier includes: up to 25 active applications, 10 documents,
              3 role categories, 50MB file storage, and limited AI features.
            </p>
            <h3 className="font-heading text-foreground text-base">
              4.2 Pro Tier
            </h3>
            <p className="text-muted-foreground">
              The Pro tier ($9/month) includes: unlimited applications, documents,
              and role categories, 2GB file storage, and the full AI suite.
              Billing is handled through Stripe. Subscriptions renew
              automatically unless cancelled.
            </p>
            <h3 className="font-heading text-foreground text-base">
              4.3 Cancellation
            </h3>
            <p className="text-muted-foreground">
              You may cancel your Pro subscription at any time from your Settings
              page or through Stripe&apos;s Customer Portal. Cancellation takes
              effect at the end of the current billing period. No partial refunds
              are provided for unused portions of a billing period.
            </p>
            <h3 className="font-heading text-foreground text-base">
              4.4 Price Changes
            </h3>
            <p className="text-muted-foreground">
              We may change subscription pricing with 30 days notice. Price
              changes apply at the next renewal date after the notice period.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              5. Acceptable Use
            </h2>
            <p className="text-muted-foreground">You agree not to:</p>
            <ul className="text-muted-foreground list-inside list-disc space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Upload malicious files or code</li>
              <li>Attempt to access other users&apos; data</li>
              <li>
                Circumvent rate limits, plan limits, or security measures
              </li>
              <li>Resell or redistribute the Service without authorization</li>
              <li>Use automated tools to scrape or abuse the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              6. Your Content
            </h2>
            <p className="text-muted-foreground">
              You retain ownership of all content you upload or create in the
              Service, including applications, documents, notes, and form field
              templates. You grant us a limited license to store, process, and
              display your content solely to provide the Service. We do not claim
              intellectual property rights over your content.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              7. AI Features
            </h2>
            <p className="text-muted-foreground">
              AI features are provided &quot;as-is&quot; using third-party AI
              providers. AI outputs (CV parsing, match scores, cover letter
              suggestions, interview preparation) are generated content and should
              be reviewed before use. We do not guarantee the accuracy,
              completeness, or fitness of AI-generated content. AI usage is
              tracked and subject to plan limits.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              8. Data and Privacy
            </h2>
            <p className="text-muted-foreground">
              Your use of the Service is also governed by our{' '}
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
              . All user data is scoped per-tenant; you can only access your own
              data. You may export or delete your data at any time from Settings.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              9. Service Availability
            </h2>
            <p className="text-muted-foreground">
              We strive for high availability but do not guarantee uninterrupted
              service. We may perform maintenance, updates, or modifications that
              temporarily affect availability. We will provide reasonable notice
              for planned downtime when possible.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              10. Limitation of Liability
            </h2>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, Track Your Future and its
              operators shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages, including loss of profits, data,
              or business opportunities arising from your use of the Service. Our
              total liability shall not exceed the amount you paid us in the 12
              months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              11. Disclaimer of Warranties
            </h2>
            <p className="text-muted-foreground">
              The Service is provided &quot;as is&quot; and &quot;as
              available&quot; without warranties of any kind, whether express or
              implied, including but not limited to implied warranties of
              merchantability, fitness for a particular purpose, and
              non-infringement. We do not warrant that the Service will be error
              free or that defects will be corrected.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              12. Termination
            </h2>
            <p className="text-muted-foreground">
              We may suspend or terminate your account if you violate these
              Terms. You may delete your account at any time from Settings. Upon
              termination, your data will be permanently deleted per our Privacy
              Policy. Sections 6 (Your Content), 10 (Limitation of Liability),
              and 11 (Disclaimer) survive termination.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              13. Changes to Terms
            </h2>
            <p className="text-muted-foreground">
              We may modify these Terms at any time. Material changes will be
              communicated via email or in-app notification at least 14 days
              before taking effect. Continued use after the effective date
              constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              14. Governing Law
            </h2>
            <p className="text-muted-foreground">
              These Terms are governed by applicable law. Any disputes arising
              from these Terms or the Service shall be resolved through good-faith
              negotiation before pursuing formal proceedings.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-foreground text-lg">
              15. Contact
            </h2>
            <p className="text-muted-foreground">
              For questions about these Terms, contact us at
              artanodestudios@gmail.com.
            </p>
          </section>
        </article>
      </RetroWindow>
    </div>
  );
}
