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

const TRACKS: { icon: IconName; label: string; desc: string }[] = [
  { icon: "scale", label: "Body metrics", desc: "Weight & measurements, dated" },
  { icon: "pulse", label: "Health markers", desc: "Blood sugar, lipids, BP, more" },
  { icon: "target", label: "Goals", desc: "Targets with live progress" },
  { icon: "dumbbell", label: "Training", desc: "Sessions, sets, reps, effort" },
  { icon: "camera", label: "Progress photos", desc: "Private, side-by-side" },
  { icon: "file", label: "Plan sharing", desc: "Secure links, no login" },
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
      <header className="sticky top-0 z-40 border-b border-transparent">
        <div className="glass border-b border-border">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3.5">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                CP
              </div>
              <span className="font-semibold tracking-tight">CoachPro</span>
            </Link>
            <nav className="hidden items-center gap-7 text-sm text-muted-foreground sm:flex">
              <a href="#how" className="hover:text-foreground">How it works</a>
              <a href="#features" className="hover:text-foreground">Features</a>
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
        {/* ===== Hero ===== */}
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
                The operating system for personal trainers
              </Reveal>
              <Reveal delay={60}>
                <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                  Coach every client like
                  <br className="hidden sm:block" /> they&apos;re your{" "}
                  <span className="text-gradient">only one.</span>
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                  Your clients trust you with their health. CoachPro gives you one
                  calm place to track every metric, marker, goal, workout and photo —
                  so nothing slips, progress is obvious, and your results speak for
                  themselves.
                </p>
              </Reveal>
              <Reveal delay={180} className="mt-8 flex flex-wrap items-center gap-3">
                <ButtonLink href={primaryHref} size="md" className="h-11 px-6 text-base">
                  {primaryLabel}
                </ButtonLink>
                <a href="#how" className="inline-flex h-11 items-center gap-1 px-2 text-sm font-medium hover:text-primary">
                  See how it works <Icon name="chevronRight" size={16} />
                </a>
              </Reveal>
              <Reveal delay={240} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {["Free to start", "No card required", "Your data, exportable anytime"].map((t) => (
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

          {/* trust strip */}
          <div className="border-y border-border bg-card/60">
            <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 py-4 text-sm text-muted-foreground">
              {[
                { icon: "checkCircle", t: "Private & encrypted" },
                { icon: "sparkles", t: "Works on any device" },
                { icon: "file", t: "Export anytime" },
                { icon: "target", t: "Built API-first" },
              ].map((x) => (
                <span key={x.t} className="inline-flex items-center gap-1.5">
                  <span className="text-primary"><Icon name={x.icon as IconName} size={15} /></span>
                  {x.t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Problem ===== */}
        <section className="mx-auto w-full max-w-6xl px-6 py-20">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">The problem</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Great coaching, trapped in a dozen browser tabs.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Spreadsheets, screenshots, chat threads and sticky notes. When a
              client&apos;s story is scattered, you lose time — and the proof of your
              work disappears.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { icon: "pulse", title: "Data everywhere", body: "Weigh-ins in one app, blood work in another, notes on paper. Nothing adds up to a clear picture." },
              { icon: "trendingDown", title: "Progress stays invisible", body: "Clients can't see how far they've come — so motivation fades right when it matters most." },
              { icon: "clock", title: "Follow-ups fall through", body: "Who's due for an update? Whose markers slipped? Without a system, things quietly slip." },
            ].map((p, i) => (
              <Reveal key={p.title} delay={i * 80}>
                <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger-bg text-danger">
                    <Icon name={p.icon as IconName} size={20} />
                  </span>
                  <h3 className="mt-4 font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ===== Plan (how it works) ===== */}
        <section id="how" className="border-y border-border bg-card/50">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">How it works</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Up and running in three steps.
              </h2>
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                { n: "1", icon: "users", title: "Add your clients", body: "Create a private profile for everyone you coach — a minute each, consent captured up front." },
                { n: "2", icon: "scale", title: "Track everything in one place", body: "Log metrics, markers, goals, training and photos as you go. It all lands on one timeline." },
                { n: "3", icon: "trendingUp", title: "Show progress that retains", body: "Open any client to trends, goal progress and before-and-afters that keep them coming back." },
              ].map((s, i) => (
                <Reveal key={s.n} delay={i * 90}>
                  <div className="relative h-full rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <span className="absolute right-5 top-5 text-5xl font-bold text-muted/70">{s.n}</span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-info-bg text-primary">
                      <Icon name={s.icon as IconName} size={20} />
                    </span>
                    <h3 className="mt-4 font-semibold">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Feature folds ===== */}
        <section id="features" className="mx-auto w-full max-w-6xl px-6">
          <FeatureFold
            eyebrow="One glance, full control"
            title="See every client the moment you log in."
            body="Your dashboard surfaces who's progressing, who needs attention, and what's happened lately — so you walk into every session already prepared."
            points={["Live roster with weight trends", "Automatic 'needs attention' flags", "Reminders and recent activity"]}
            visual={<MockDashboard />}
          />
          <FeatureFold
            reverse
            eyebrow="The whole picture"
            title="Track more than the number on the scale."
            body="Body composition, clinical markers with healthy-range flags, and goals that update themselves from the readings you log. The complete health story, not just weight."
            points={["Blood sugar, lipids, vitamins, BP", "In-range / watch flags at a glance", "Goals that track themselves"]}
            visual={
              <div className="flex flex-col gap-4">
                <MockMarkers />
                <MockGoals />
              </div>
            }
          />
          <FeatureFold
            eyebrow="Proof of your work"
            title="Make progress impossible to ignore."
            body="Beautiful trend charts and private side-by-side photos turn months of effort into a story your client can see — the single best thing for retention and referrals."
            points={["Trend charts for any metric", "Private progress photo galleries", "Share plans via secure links"]}
            visual={
              <div className="flex flex-col gap-4">
                <MockChart />
                <MockPhotos />
              </div>
            }
          />
        </section>

        {/* ===== What you track ===== */}
        <section className="border-y border-border bg-card/50">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything a client needs. In one timeline.
              </h2>
            </Reveal>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TRACKS.map((t, i) => (
                <Reveal key={t.label} delay={(i % 3) * 80}>
                  <div className="flex h-full items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-info-bg text-primary">
                      <Icon name={t.icon} size={20} />
                    </span>
                    <div>
                      <h3 className="font-semibold">{t.label}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Transformation ===== */}
        <section className="mx-auto w-full max-w-5xl px-6 py-20">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              From scattered to sorted.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-2xl border border-border bg-muted/40 p-6">
                <p className="text-sm font-semibold text-muted-foreground">Without CoachPro</p>
                <ul className="mt-4 flex flex-col gap-3 text-sm">
                  {["Hunting through chats for last month's weight", "Guessing whether a marker improved", "Clients who can't see their own wins", "Admin that eats your evenings"].map((t) => (
                    <li key={t} className="flex items-start gap-2 text-muted-foreground">
                      <span className="mt-0.5 text-danger"><Icon name="alert" size={16} /></span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={90}>
              <div className="h-full rounded-2xl border border-primary/30 bg-card p-6 shadow-md">
                <p className="text-sm font-semibold text-primary">With CoachPro</p>
                <ul className="mt-4 flex flex-col gap-3 text-sm">
                  {["Every client's full history, one tap away", "Trends and ranges that read themselves", "Progress your clients can actually see", "Evenings back — the system does the remembering"].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <span className="mt-0.5 text-success"><Icon name="checkCircle" size={16} /></span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ===== Pricing ===== */}
        <section id="pricing" className="border-t border-border bg-card/50">
          <div className="mx-auto w-full max-w-5xl px-6 py-20">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, honest pricing.</h2>
              <p className="mt-4 text-lg text-muted-foreground">Start free. Upgrade when your roster grows.</p>
            </Reveal>
            <div className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-2">
              <Reveal>
                <PricingCard
                  name="Free"
                  price="₹0"
                  tagline="Everything you need to get started"
                  features={[`Up to ${FREE_CLIENT_LIMIT} active clients`, "All tracking features", "Charts, photos & file sharing", "Reminders & export"]}
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

        {/* ===== Final CTA ===== */}
        <section className="relative overflow-hidden" style={{ background: "#0b1020" }}>
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{ background: "radial-gradient(50% 60% at 30% 0%, rgba(99,102,241,0.35), transparent 60%), radial-gradient(45% 55% at 90% 100%, rgba(56,189,248,0.25), transparent 60%)" }}
          />
          <div className="relative mx-auto w-full max-w-3xl px-6 py-20 text-center">
            <Reveal>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Coach like the pro you already are.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
                Give every client the attention of a full-time team — without the
                admin. Set up your workspace in minutes.
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
            <span className="ml-2">Client monitoring for personal trainers</span>
          </div>
          <span>Consent · encryption · export &amp; delete, by design</span>
        </div>
      </footer>
    </div>
  );
}

function FeatureFold({
  eyebrow,
  title,
  body,
  points,
  visual,
  reverse,
}: {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  visual: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className="grid items-center gap-10 py-16 lg:grid-cols-2 lg:gap-16">
      <Reveal className={reverse ? "lg:order-2" : ""}>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
        <h3 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h3>
        <p className="mt-4 text-lg text-muted-foreground">{body}</p>
        <ul className="mt-6 flex flex-col gap-3">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-2.5 text-sm font-medium">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success-bg text-success">
                <Icon name="check" size={14} strokeWidth={2.4} />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal delay={100} className={reverse ? "lg:order-1" : ""}>
        <div className="relative">
          <div
            className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl opacity-50 blur-2xl"
            style={{ background: "radial-gradient(circle, rgba(129,140,248,0.35), transparent 70%)" }}
          />
          {visual}
        </div>
      </Reveal>
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
