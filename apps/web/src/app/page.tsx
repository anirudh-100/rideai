import { PLATFORM_META, Platform, formatPrice } from '@rideai/shared';

const FEATURES = [
  {
    title: 'AI intent parsing',
    body: 'Type naturally — "auto to India Gate" or "biryani under ₹200". Claude turns it into a structured request.',
  },
  {
    title: 'Live price comparison',
    body: 'We fetch comparable fares across every platform at once and sort them so the cheapest is obvious.',
  },
  {
    title: 'Auto-applied coupons',
    body: "We match coupons to your profile — new-user, win-back, segment — and apply the best one you're eligible for.",
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6">
      {/* Hero */}
      <section className="flex flex-col items-center pt-24 text-center">
        <span className="rounded-full border border-white/10 bg-card px-4 py-1 text-sm text-muted">
          ✦ AI aggregator for India
        </span>
        <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-tight">
          One prompt. Every ride, meal & grocery —{' '}
          <span className="text-primary">compared.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted">
          RideAI compares Ola, Uber & Rapido, Zomato & Swiggy, and Zepto &
          Blinkit behind a single natural-language interface — then auto-applies
          the best coupon and deep-links you into the cheapest platform.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <a
            href="#"
            className="rounded-2xl bg-primary px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Get the app
          </a>
          <span className="text-sm text-best">
            Save up to {formatPrice(120)} per order
          </span>
        </div>
      </section>

      {/* Prompt example */}
      <section className="mx-auto mt-16 max-w-2xl rounded-3xl border border-white/10 bg-card p-6">
        <p className="text-sm text-muted">You type</p>
        <p className="mt-1 text-xl">
          “I want to go from Rajiv Chowk to India Gate”
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Step n={1} label="Parse intent" />
          <Step n={2} label="Compare fares" />
          <Step n={3} label="Pick best coupon" />
          <Step n={4} label="Deep link" />
        </div>
      </section>

      {/* Features */}
      <section className="mt-20 grid gap-5 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border border-white/10 bg-card p-6">
            <h3 className="text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted">{f.body}</p>
          </div>
        ))}
      </section>

      {/* Platforms */}
      <section className="mt-20 pb-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted">
          Comparing across
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {Object.values(Platform).map((p) => {
            const meta = PLATFORM_META[p];
            return (
              <span
                key={p}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-card px-4 py-2"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                {meta.label}
              </span>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function Step({ n, label }: { n: number; label: string }) {
  return (
    <span className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold">
        {n}
      </span>
      {label}
    </span>
  );
}
