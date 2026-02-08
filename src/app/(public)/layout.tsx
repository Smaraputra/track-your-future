import Link from 'next/link';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-border flex h-14 items-center justify-between border-b px-4">
        <Link
          href="/"
          className="font-heading text-primary text-shadow-glow text-xl"
        >
          TYF://
        </Link>
        <nav className="flex items-center gap-4 font-body text-sm">
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="border-primary text-primary hover:bg-primary/10 border px-3 py-1.5 transition-colors"
          >
            Register
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
