import Link from 'next/link';
import {
  Briefcase,
  FileText,
  Brain,
  GitBranch,
  BarChart3,
  ClipboardList,
} from 'lucide-react';
import { RetroButton } from '@/components/retro-button';

const FEATURES = [
  {
    icon: Briefcase,
    title: 'Application Tracker',
    description: 'Track every job application from draft to offer with a full status pipeline.',
  },
  {
    icon: FileText,
    title: 'Document Manager',
    description: 'Store CVs, cover letters, and supporting documents with version control.',
  },
  {
    icon: Brain,
    title: 'AI Analysis Engine',
    description: 'Parse CVs, extract job descriptions, score matches, and generate cover letters.',
  },
  {
    icon: GitBranch,
    title: 'Status Pipeline',
    description: 'Move applications through draft, applied, phone screen, interview, offer, and more.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Visualize your job search progress with charts and success metrics.',
  },
  {
    icon: ClipboardList,
    title: 'Form Templates',
    description: 'Save reusable answers for common application fields across role categories.',
  },
];

export function LandingContent() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Hero */}
      <section className="mb-16 text-center">
        <h1 className="font-heading text-primary text-shadow-glow mb-4 text-5xl sm:text-6xl">
          Track Your Future
        </h1>
        <p className="font-body text-muted-foreground mx-auto max-w-xl text-lg">
          Your job search command center. Track applications, manage documents,
          and get AI-powered insights -- all in one place.
        </p>
        <div className="mt-8">
          <RetroButton size="lg" asChild>
            <Link href="/register">Initialize System</Link>
          </RetroButton>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="mb-16">
        <h2 className="font-heading text-foreground mb-2 text-center text-2xl">
          {'> '}System Capabilities
        </h2>
        <p className="font-body text-muted-foreground mb-8 text-center text-sm">
          Available modules in your job search command center
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="border-border bg-surface rounded-md border p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <feature.icon className="text-primary size-5" />
                <h3 className="font-heading text-foreground text-lg">
                  {feature.title}
                </h3>
              </div>
              <p className="font-body text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mb-16 text-center">
        <div className="border-border bg-surface rounded-md border p-8">
          <h2 className="font-heading text-primary text-shadow-glow mb-2 text-2xl">
            Ready to take control?
          </h2>
          <p className="font-body text-muted-foreground mb-6 text-sm">
            Free tier includes 25 applications, 10 documents, and basic AI
            features.
          </p>
          <div className="flex justify-center gap-4">
            <RetroButton asChild>
              <Link href="/register">Create Account</Link>
            </RetroButton>
            <RetroButton variant="secondary" asChild>
              <Link href="/pricing">View Pricing</Link>
            </RetroButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-border border-t pt-6">
        <div className="flex flex-wrap justify-center gap-6 font-body text-sm">
          <Link
            href="/privacy"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            href="/pricing"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
        </div>
        <p className="text-muted-foreground mt-4 text-center font-body text-xs">
          Track Your Future -- {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

export { FEATURES };
