import Link from 'next/link';
import { auth } from '@/auth';
import { PublicHeader } from '@/components/public-header';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-4">
          <Link
            href="/"
            className="font-heading text-primary text-shadow-glow flex items-center gap-1.5 text-xl"
          >
            <span className="text-muted-foreground" aria-hidden="true">{'>'}</span>
            TYF://
            <span className="cursor-terminal inline-block w-0" aria-hidden="true">&nbsp;</span>
          </Link>
          <nav className="flex items-center gap-4 font-body text-sm">
            {session?.user ? (
              <Link
                href="/dashboard"
                className="border-primary text-primary hover:bg-primary/10 hover:shadow-[0_0_12px_var(--primary)] border px-3 py-1.5 transition-all"
              >
                ./dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/pricing"
                  className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
                >
                  ./pricing
                </Link>
                <Link
                  href="/login"
                  className="border-primary text-primary hover:bg-primary/10 hover:shadow-[0_0_12px_var(--primary)] border px-3 py-1.5 transition-all"
                >
                  ./login
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="border-glow-sweep" aria-hidden="true" />
      </PublicHeader>
      {children}
    </div>
  );
}
