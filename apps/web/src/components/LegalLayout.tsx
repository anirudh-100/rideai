/**
 * Shared shell for /privacy and /terms pages — consistent typography,
 * back-to-home link, table-of-contents sticky on desktop.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';

export function LegalLayout({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  effectiveDate: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-white"
      >
        ← Back to home
      </Link>

      <h1 className="mt-6 text-4xl font-bold leading-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted">
        Effective {effectiveDate} · RideAI, India
      </p>

      <article className="legal mt-10 space-y-6 text-[15px] leading-7 text-white/85">
        {children}
      </article>

      <footer className="mt-16 border-t border-white/10 pt-6 text-xs text-muted">
        Questions? Email{' '}
        <a href="mailto:legal@rideai.in" className="text-primary hover:underline">
          legal@rideai.in
        </a>{' '}
        ·{' '}
        <Link href="/privacy" className="text-primary hover:underline">
          Privacy
        </Link>{' '}
        ·{' '}
        <Link href="/terms" className="text-primary hover:underline">
          Terms
        </Link>
      </footer>
    </main>
  );
}

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id}>
      <h2 className="mt-8 text-xl font-semibold text-white">{title}</h2>
      <div className="mt-3 space-y-3 text-white/80">{children}</div>
    </section>
  );
}
