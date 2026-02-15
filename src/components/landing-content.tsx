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
import { MatrixRain } from '@/components/matrix-rain';
import { TypewriterText } from '@/components/typewriter-text';
import { Reveal } from '@/components/reveal';
import { cn } from '@/lib/utils';

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

const CAPABILITIES = [
  { value: '25', label: 'Applications', note: 'Free tier limit' },
  { value: '10', label: 'Documents', note: 'Free tier limit' },
  { value: '6', label: 'AI Tools', note: 'Full analysis suite' },
];

export function LandingContent() {
  return (
    <div>
      {/* Hero */}
      <Reveal>
        <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <MatrixRain />
          </div>
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-background/30 via-transparent to-background"
            aria-hidden="true"
          />
          <div className="relative z-[2] mx-auto max-w-3xl px-4 py-16 text-center">
            <p className="font-body text-muted-foreground mb-4 text-sm">
              <span className="text-primary">user@tyf:~$</span> ./launch --system
            </p>
            <h1 className="font-heading text-primary text-shadow-glow animate-phosphor-on mb-6 text-5xl sm:text-6xl lg:text-7xl">
              Tracked Your Future
            </h1>
            <div className="font-body text-muted-foreground mx-auto text-center max-w-xl text-lg">
              <TypewriterText className='text-center' text="Track and manage job applications." />
            </div>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <RetroButton size="lg" asChild>
                <Link href="/login">Initialize System</Link>
              </RetroButton>
              <RetroButton size="lg" variant="secondary" asChild>
                <Link href="/pricing">View Pricing</Link>
              </RetroButton>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Features */}
      <Reveal delay={200}>
        <section className="bg-grid py-20">
          <div className="mx-auto max-w-4xl px-4">
            <p className="font-body text-muted-foreground mb-6 text-sm">
              <span className="text-primary">user@tyf:~$</span> ls -la /sys/modules/
            </p>

            {/* Desktop: terminal table */}
            <div className="hidden sm:block">
              <table className="border-border bg-surface w-full border-collapse border crt-screen">
                <tbody>
                  {FEATURES.map((feature, i) => (
                    <tr
                      key={feature.title}
                      className={cn(
                        'transition-colors hover:bg-primary/5',
                        i !== FEATURES.length - 1 && 'border-border border-b',
                      )}
                    >
                      <td className="whitespace-nowrap py-3 pl-4 pr-2">
                        <span className="flex items-center gap-2">
                          <feature.icon className="text-primary size-4 shrink-0" />
                          <span className="font-body text-primary text-sm font-medium">
                            {feature.title}
                          </span>
                        </span>
                      </td>
                      <td className="text-dimmed font-body px-2 py-3 text-sm" aria-hidden="true">--</td>
                      <td className="font-body text-muted-foreground py-3 pl-2 pr-4 text-sm">
                        {feature.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: card grid */}
            <div className="grid gap-4 sm:hidden">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="border-border bg-surface border p-4 crt-screen border-glow"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <feature.icon className="text-primary size-5" />
                    <h3 className="font-heading text-foreground text-lg">{feature.title}</h3>
                  </div>
                  <p className="font-body text-muted-foreground text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Capabilities */}
      <Reveal delay={400}>
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-4">
            <p className="font-body text-muted-foreground mb-6 text-sm">
              <span className="text-primary">user@tyf:~$</span> cat /etc/system.conf
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {CAPABILITIES.map((cap) => (
                <div
                  key={cap.label}
                  className="border-border bg-surface border p-6 text-center crt-screen border-glow"
                >
                  <p className="font-heading text-primary text-shadow-glow text-4xl">{cap.value}</p>
                  <p className="font-body text-foreground mt-1 text-sm font-medium">{cap.label}</p>
                  <p className="font-body text-muted-foreground mt-1 text-xs">{cap.note}</p>
                </div>
              ))}
            </div>
            <p className="font-body text-muted-foreground mt-4 text-center text-xs">
              Unlimited with Pro -- $9/mo
            </p>
          </div>
        </section>
      </Reveal>

      {/* CTA */}
      <Reveal delay={600}>
        <section className="bg-grid py-20">
          <div className="mx-auto max-w-4xl px-4">
            <div className="border-primary/30 bg-surface border p-8 text-center crt-screen">
              <h2 className="font-heading text-primary text-shadow-glow mb-2 text-3xl">
                Ready to take control?
              </h2>
              <p className="font-body text-muted-foreground mb-1 text-sm">
                Free tier includes 25 applications, 10 documents, and basic AI features.
              </p>
              <p className="font-body text-muted-foreground mb-6 text-xs">
                No credit card required.
              </p>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <RetroButton asChild>
                  <Link href="/login">Create Account</Link>
                </RetroButton>
                <RetroButton variant="secondary" asChild>
                  <Link href="/pricing">View Pricing</Link>
                </RetroButton>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Footer */}
      <Reveal delay={800}>
        <footer className="border-border border-t py-8">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between">
            <span className="font-heading text-muted-foreground text-sm">
              TYF:// -- {new Date().getFullYear()}
            </span>
            <nav className="flex gap-6 font-body text-sm">
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/pricing"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
            </nav>
          </div>
        </footer>
      </Reveal>
    </div>
  );
}

export { FEATURES };