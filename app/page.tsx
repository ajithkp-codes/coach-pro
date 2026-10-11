import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Reveal } from "@/components/marketing/reveal";
import {
  MockDashboard,
  MockChart,
  MockGoals,
  MockMarkers,
  MockPhotos,
} from "@/components/marketing/mocks";
import { createClient } from "@/lib/supabase/server";
import { FREE_CLIENT_LIMIT, PRO_PRICE_INR } from "@/lib/constants";

const TRACKS: { icon: IconName; label: string }[] = [
  { icon: "scale", label: "Body metrics" },
  { icon: "pulse", label: "Health markers" },
  { icon: "target", label: "Goals" },
  { icon: "dumbbell", label: "Training" },
  { icon: "camera", label: "Progress photos" },
  { icon: "file", label: "Plan sharing" },
];

const VALUES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "users",
    title: "Everything in one place",
    body: "Every client's metrics, markers, goals, training and photos in one record. No more spreadsheets, screenshots or chat threads.",
  },
  {
    icon: "clock",
    title: "Minutes, not evenings",
    body: "Log a client's numbers in seconds. CoachPro keeps the full history, so you never rebuild it from memory.",
  },
  {
    icon: "trendingUp",
    title: "Progress they can see",
    body: "Trends, goal tracking and before and after photos make results obvious. That is what keeps clients and brings referrals.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const primaryHref = user ? "/dashboard" : "/signup";
  const primaryLabel = user ? "Open dashboard" : "Start free";

  return (
    <div className="flex flex-1 flex-col overflow-x-clip">
      {/* ===== Nav ===== */}
      <header className="sticky top-0 z-40">
        <div className="glass border-b border-border">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3.5">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                CP
              </div>
              <span className="font-semibold tracking-tight">CoachPro</span>
            </Link>
            <nav className="hidden items-center gap-7 text-sm text-muted-foreground sm:flex">
              <a href="#why" className="hover:text-foreground">Why CoachPro</a>
              <a href="#product" className="hover:text-foreground">Product</a>
              <a href="#pricing" className="hover:text-foreground">Pricing</a>
            </nav>
            <div className="flex items-center gap-2">
              {user ? (
                <ButtonLink href="/dashboard" size="sm">Open dashboard</ButtonLink>
              ) : (
                <>
                  <ButtonLink href="/login" variant="ghost" size="sm">Sign in</ButtonLink>
                  <ButtonLink href="/signup" size="sm">Start free</ButtonLink>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ===== Fold 1: Hero ===== */}
        <section className="relative overflow-hidden">
          <div className="mesh-bg pointer-events-none absolute inset-0 -z-10" />
          <div
            className="animate-blob pointer-events-none absolute -left-24 top-10 -z-10 h-72 w-72 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, #a5b4fc, transparent 70%)" }}
          />
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
            <div>
              <Reveal className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="text-primary"><Icon name="sparkles" size={13} /></span>
                Client tracking for personal trainers
              </Reveal>
              <Reveal delay={60}>
                <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                  Show the results.
                  <br />
                  <span className="text-gradient">Keep the clients.</span>
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                  Clients stay when they can see progress. CoachPro turns every
                  weigh-in, marker and workout into results your clients can see,
                  and a record you can trust.
                </p>
              </Reveal>
              <Reveal delay={180} className="mt-8 flex flex-wrap items-center gap-3">
                <ButtonLink href={primaryHref} size="md" className="h-11 px-6 text-base">
                  {primaryLabel}
                </ButtonLink>
                <a href="#product" className="inline-flex h-11 items-center gap-1 px-2 text-sm font-medium hover:text-primary">
                  See the product <Icon name="chevronRight" size={16} />
                </a>
              </Reveal>
              <Reveal delay={240} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {["Free to start", "No card required", "Export your data anytime"].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5">
                    <span className="text-success"><Icon name="checkCircle" size={16} /></span>
                    {t}
                  </span>
                ))}
              </Reveal>
            </div>

            {/* Product composition */}
            <Reveal delay={120} className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="animate-float">
                <MockDashboard />
              </div>
              <div className="absolute -bottom-8 -left-6 hidden w-56 animate-float-slow sm:block">
                <MockGoals />
              </div>
              <div className="glass absolute -right-4 top-6 hidden items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium shadow-lg sm:flex">
                <span className="text-warning"><Icon name="alert" size={14} /></span>
                2 clients need attention
              </div>
            </Reveal>
          </div>
        </section>

        {/* ===== Fold 2: Why (answers the other angles) ===== */}
        <section id="why" className="border-y border-border bg-card/50">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Built around how you actually coach.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Three things slow every coach down. CoachPro fixes all three.
              </p>
            </Reveal>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {VALUES.map((v, i) => (
                <Reveal key={v.title} delay={i * 80}>
                  <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-info-bg text-primary">
                      <Icon name={v.icon} size={20} />
                    </span>
                    <h3 className="mt-4 font-semibold">{v.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Fold 3: Product ===== */}
        <section id="product" className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                One screen, the full picture
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Open a client. See everything.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Body stats, clinical markers with healthy-range flags, goals that
                update from the readings you log, training history and progress
                photos. All on one timeline, ready to show any time.
              </p>
              <ul className="mt-6 grid grid-cols-2 gap-3">
                {TRACKS.map((t) => (
                  <li key={t.label} className="flex items-center gap-2.5 text-sm font-medium">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-info-bg text-primary">
                      <Icon name={t.icon} size={15} />
                    </span>
                    {t.label}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={100}>
              <div className="relative">
                <div
                  className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl opacity-50 blur-2xl"
                  style={{ background: "radial-gradient(circle, rgba(129,140,248,0.35), transparent 70%)" }}
                />
                <div className="grid grid-cols-2 gap-4">
                  <MockChart className="col-span-2" />
                  <MockMarkers />
                  <MockPhotos />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ===== Fold 4: Pricing ===== */}
        <section id="pricing" className="border-t border-border bg-card/50">
          <div className="mx-auto w-full max-w-5xl px-6 py-20">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple pricing.</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Start free. Upgrade when your roster grows.
              </p>
            </Reveal>
            <div className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-2">
              <Reveal>
                <PricingCard
                  name="Free"
                  price="₹0"
                  tagline="Everything you need to get started"
                  features={[`Up to ${FREE_CLIENT_LIMIT} active clients`, "All tracking features", "Charts, photos and file sharing", "Reminders and export"]}
                  cta={primaryLabel}
                  href={primaryHref}
                  variant="outline"
                />
              </Reveal>
              <Reveal delay={90}>
                <PricingCard
                  name="Pro"
                  price={`₹${PRO_PRICE_INR}`}
                  suffix="/mo"
                  tagline="For a growing practice"
                  features={["Unlimited active clients", "Everything in Free", "Priority support"]}
                  cta={user ? "Go Pro" : "Start free, upgrade later"}
                  href={user ? "/account/billing" : "/signup"}
                  highlight
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ===== Closing CTA ===== */}
        <section className="relative overflow-hidden" style={{ background: "#0b1020" }}>
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{ background: "radial-gradient(50% 60% at 30% 0%, rgba(99,102,241,0.35), transparent 60%), radial-gradient(45% 55% at 90% 100%, rgba(56,189,248,0.25), transparent 60%)" }}
          />
          <div className="relative mx-auto w-full max-w-3xl px-6 py-20 text-center">
            <Reveal>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Start tracking in minutes.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
                Set up your workspace, add your first client, and see the
                difference on day one.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink href={primaryHref} className="h-11 bg-white px-6 text-base text-[#0b1020] hover:bg-slate-100">
                  {primaryLabel}
                </ButtonLink>
                {!user && (
                  <ButtonLink href="/login" variant="ghost" className="h-11 px-6 text-base text-white hover:bg-white/10">
                    Sign in
                  </ButtonLink>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">CP</div>
            <span className="font-medium text-foreground">CoachPro</span>
            <span className="ml-2">Client tracking for personal trainers</span>
          </div>
          <span>Private by design. Consent, encryption, export and delete.</span>
        </div>
      </footer>
    </div>
  );
}

function PricingCard({
  name,
  price,
  suffix,
  tagline,
  features,
  cta,
  href,
  highlight,
  variant = "primary",
}: {
  name: string;
  price: string;
  suffix?: string;
  tagline: string;
  features: string[];
  cta: string;
  href: string;
  highlight?: boolean;
  variant?: "primary" | "outline";
}) {
  return (
    <div
      className={`flex h-full flex-col rounded-2xl border bg-card p-6 shadow-sm ${
        highlight ? "border-primary ring-1 ring-primary/20" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{name}</h3>
        {highlight && (
          <span className="rounded-full bg-info-bg px-2.5 py-0.5 text-xs font-medium text-primary">
            Most popular
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>
      <p className="mt-4">
        <span className="text-3xl font-bold tracking-tight">{price}</span>
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </p>
      <ul className="mt-5 flex flex-1 flex-col gap-2.5 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <span className="text-success"><Icon name="check" size={16} strokeWidth={2.4} /></span>
            {f}
          </li>
        ))}
      </ul>
      <ButtonLink href={href} variant={highlight ? "primary" : variant} className="mt-6 w-full">
        {cta}
      </ButtonLink>
    </div>
  );
}
