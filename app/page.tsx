import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Reveal } from "@/components/marketing/reveal";
import { CountUp } from "@/components/marketing/animations";
import { LogoMark } from "@/components/brand/logo";
import { BrowserFrame } from "@/components/marketing/device-frames";
import {
  MockDashboard,
  MockChart,
  MockMarkers,
  MockPhotos,
} from "@/components/marketing/mocks";
import { ProductScreenshot } from "@/components/marketing/product-screenshot";
import { createClient } from "@/lib/supabase/server";
import { FREE_CLIENT_LIMIT, PRO_PRICE_INR } from "@/lib/constants";

/* ------------------------------------------------------------------ */

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: "scale", title: "Body metrics", body: "Weight, body fat, measurements with full history and trend charts." },
  { icon: "pulse", title: "Health markers", body: "Blood sugar, cholesterol, BP with healthy-range flags that spot risk." },
  { icon: "target", title: "Smart goals", body: "Set targets. Progress computes itself from every reading." },
  { icon: "camera", title: "Progress photos", body: "Timestamped before-and-after gallery. Visual proof." },
  { icon: "trendingUp", title: "Trend charts", body: "One-tap charts. Show the 3-month curve in the next session." },
  { icon: "download", title: "Export & privacy", body: "DPDP-ready. Export or delete anytime. Your data, your control." },
];

const COMPARISON: { old: string; now: string }[] = [
  { old: "15 Excel sheets", now: "One dashboard" },
  { old: "WhatsApp photo search", now: "Instant progress charts" },
  { old: "Manual calculations", now: "Auto-computed goals" },
  { old: "Data on one phone", now: "Cloud-synced, always safe" },
  { old: '"I think you lost 4 kg"', now: '"You lost 6.2 kg since March"' },
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const primaryHref = user ? "/dashboard" : "/signup";
  const primaryLabel = user ? "Open dashboard" : "Start free";

  return (
    <div data-landing="" className="flex flex-1 flex-col overflow-x-clip">
      {/* ===== NAV ===== */}
      <header className="fixed left-0 right-0 top-0 z-40">
        <div className="glass-strong border-b border-white/[0.06]">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3.5">
            <Link href="/" className="flex items-center gap-2.5">
              <LogoMark size={30} id="nav-logo" />
              <span className="text-[15px] font-extrabold tracking-tight text-white">
                Coach<span className="text-gradient">Pro</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-8 text-sm text-white/60 sm:flex">
              <a href="#product" className="transition-colors hover:text-white">Product</a>
              <a href="#features" className="transition-colors hover:text-white">Features</a>
              <a href="#pricing" className="transition-colors hover:text-white">Pricing</a>
            </nav>
            <div className="flex items-center gap-2">
              {user ? (
                <ButtonLink href="/dashboard" size="sm">Open dashboard</ButtonLink>
              ) : (
                <>
                  <ButtonLink href="/login" variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/5">Sign in</ButtonLink>
                  <ButtonLink href="/signup" size="sm">Start free</ButtonLink>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ============================================================
            HERO
            ============================================================ */}
        <section className="relative flex min-h-[100svh] items-center overflow-hidden">
          <Image
            src="/images/hero-gym.jpg"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#141210]/95 via-[#141210]/80 to-[#141210]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141210] via-transparent to-[#141210]/40" />

          {/* Hero content — text left-aligned with site content, product bleeds to right edge */}
          <div className="relative z-10 flex w-full items-center pb-20 pt-28 lg:pb-24 lg:pt-32">
            {/* Text column — stays within max-w-6xl left edge */}
            <div
              className="w-full shrink-0 px-6 lg:w-[46%] lg:pl-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] lg:pr-12"
            >
              <Reveal className="inline-flex items-center gap-2 rounded-full border border-[#ff8a66]/20 bg-[#ff8a66]/8 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#ff8a66]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff8a66] opacity-75" />
                  <span className="inline-flex h-2 w-2 rounded-full bg-[#ff8a66]" />
                </span>
                Built for Indian fitness coaches
              </Reveal>

              <Reveal delay={60}>
                <h1 className="mt-8 text-[2.75rem] font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-[4.25rem]">
                  TRACK.<br />
                  MEASURE.<br />
                  <span className="bg-gradient-to-r from-[#ff8a66] to-[#ff6a43] bg-clip-text text-transparent">
                    TRANSFORM.
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={120}>
                <p className="mt-7 max-w-lg text-lg leading-relaxed text-white/70">
                  Your clients&apos; progress is buried in WhatsApp and lost in Excel.
                  CoachPro gives you{" "}
                  <strong className="text-white">one clean record per client</strong> with
                  body stats, health markers, goals, and progress photos.
                </p>
              </Reveal>

              <Reveal delay={180} className="mt-9 flex flex-wrap items-center gap-4">
                <ButtonLink
                  href={primaryHref}
                  size="md"
                  className="animate-glow-pulse h-14 px-8 text-base font-bold"
                >
                  {primaryLabel}, it&apos;s ₹0
                </ButtonLink>
                <a href="#product" className="inline-flex h-14 items-center gap-1.5 px-4 text-sm font-semibold text-white/60 transition-colors hover:text-white">
                  See how it works <Icon name="chevronRight" size={16} />
                </a>
              </Reveal>

              <Reveal delay={240} className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/60">
                {["Free up to 10 clients", "No card required", "DPDP-compliant"].map((t) => (
                  <span key={t} className="inline-flex items-center gap-2">
                    <span className="text-[#ff8a66]"><Icon name="checkCircle" size={16} /></span>
                    {t}
                  </span>
                ))}
              </Reveal>
            </div>

            {/* Product screenshot — takes remaining 58% width, bleeds to right viewport edge */}
            <Reveal delay={200} className="relative hidden lg:block lg:flex-1">
              <div
                className="pointer-events-none absolute -inset-16 -z-10 opacity-60 blur-[80px]"
                style={{ background: "radial-gradient(circle, rgba(255,106,67,0.4), transparent 70%)" }}
              />
              <div className="pr-4">
                <BrowserFrame>
                  <ProductScreenshot nativeWidth={1200}>
                    <MockDashboard />
                  </ProductScreenshot>
                </BrowserFrame>
              </div>
            </Reveal>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#141210] to-transparent" />
        </section>

        {/* ============================================================
            PROBLEM SECTION (no "The problem" label)
            ============================================================ */}
        <section className="relative overflow-hidden bg-[#141210]">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-2 lg:gap-20 lg:py-32">
            <Reveal>
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                You became a coach to change lives.{" "}
                <span className="bg-gradient-to-r from-[#ff6a43] to-[#ff8a66] bg-clip-text text-transparent">
                  Not to update spreadsheets at midnight.
                </span>
              </h2>
              <div className="mt-8 space-y-5 text-base leading-relaxed text-white/60">
                <p>
                  It&apos;s 11 PM and you&apos;re still copying weigh-ins into Excel,
                  scrolling WhatsApp for that blood report photo, manually
                  calculating who&apos;s on track.
                </p>
                <p>
                  Your best client quits. Not because they weren&apos;t progressing.
                  They lost 6 kg, their glucose normalised.
                  But they couldn&apos;t <em className="text-white/70">see</em> it.
                  You never had a way to show them.
                </p>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="relative overflow-hidden rounded-2xl">
                <Image
                  src="/images/trainer-client.jpg"
                  alt="Personal trainer coaching a client"
                  width={600}
                  height={400}
                  className="h-full w-full object-cover"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141210]/80 via-transparent to-[#141210]/20" />
                <div className="absolute inset-0 bg-[#ff6a43]/5 mix-blend-overlay" />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ============================================================
            TRANSITION
            ============================================================ */}
        <section className="relative flex min-h-[50vh] items-center justify-center overflow-hidden">
          <Image
            src="/images/gym-dark.jpg"
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[#141210]/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#ff6a43]/10 to-[#ff8a66]/5" />

          <Reveal className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              From chaos{" "}
              <span className="bg-gradient-to-r from-[#ff6a43] to-[#ff8a66] bg-clip-text text-transparent">
                to clarity
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
              Everything that used to take your evening now takes 10 seconds.
              One dashboard. Every client. All their data.
            </p>
          </Reveal>
        </section>

        {/* ============================================================
            PRODUCT
            ============================================================ */}
        <section id="product" className="bg-[#141210]">
          <div className="mx-auto w-full max-w-6xl px-6 py-24 lg:py-32">
            <div className="mx-auto max-w-3xl">
              <Reveal className="text-center">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff8a66]">
                  What changes
                </p>
              </Reveal>
              <div className="mt-10 space-y-4">
                {COMPARISON.map((row, i) => (
                  <Reveal key={row.old} delay={i * 60}>
                    <div className="flex items-center gap-5 border-b border-white/[0.04] py-3">
                      <div className="flex flex-1 items-center gap-3 text-sm">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                          <Icon name="x" size={12} strokeWidth={3} />
                        </span>
                        <span className="text-white/50 line-through decoration-white/15">{row.old}</span>
                      </div>
                      <Icon name="chevronRight" size={14} className="shrink-0 text-white/15" />
                      <div className="flex flex-1 items-center gap-3 text-sm">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ff8a66]/10 text-[#ff8a66]">
                          <Icon name="check" size={12} strokeWidth={3} />
                        </span>
                        <span className="font-semibold text-white/80">{row.now}</span>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            FEATURES
            ============================================================ */}
        <section id="features">
          {/* Feature 1: Data tracking */}
          <div className="relative overflow-hidden">
            <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-2 lg:gap-20 lg:py-32">
              <Reveal>
                <div className="relative overflow-hidden rounded-2xl">
                  <Image
                    src="/images/weights.jpg"
                    alt="Fitness equipment"
                    width={600}
                    height={400}
                    className="h-full w-full object-cover"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#141210]/30 to-[#141210]/60" />
                  <div className="absolute inset-0 bg-[#ff8a66]/5 mix-blend-overlay" />
                </div>
              </Reveal>

              <Reveal delay={80}>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff8a66]">
                  Everything in one place
                </p>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Every metric.<br />
                  Every marker.<br />
                  <span className="text-white">One timeline.</span>
                </h2>
                <p className="mt-5 text-base leading-relaxed text-white/60">
                  Body stats, clinical markers with healthy-range flags, goals
                  that update from every reading, and progress photos. All on one
                  screen, ready for the next session.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  {FEATURES.slice(0, 3).map((f) => (
                    <span key={f.title} className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-white/80">
                      <Icon name={f.icon} size={16} className="text-[#ff8a66]" />
                      {f.title}
                    </span>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>

          {/* Feature 2: Charts & insights */}
          <div className="relative border-y border-white/[0.03]">
            <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-2 lg:gap-20 lg:py-32">
              <Reveal className="order-2 lg:order-1">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff6a43]">
                  Visual proof of progress
                </p>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Show the trend.<br />
                  <span className="text-white">Win the client.</span>
                </h2>
                <p className="mt-5 text-base leading-relaxed text-white/60">
                  Trend charts, progress photos, and goal completion. Everything
                  your client needs to see that their effort is working. Pull it
                  up in 10 seconds during their next session.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  {FEATURES.slice(3).map((f) => (
                    <span key={f.title} className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-white/80">
                      <Icon name={f.icon} size={16} className="text-[#ff6a43]" />
                      {f.title}
                    </span>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={80} className="order-1 lg:order-2">
                <div className="relative">
                  <div
                    className="pointer-events-none absolute -inset-10 -z-10 opacity-40 blur-[60px]"
                    style={{ background: "radial-gradient(circle, rgba(255,106,67,0.2), transparent 70%)" }}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <MockChart className="col-span-2" />
                    <MockMarkers />
                    <MockPhotos />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ============================================================
            STATS
            ============================================================ */}
        <section className="relative overflow-hidden">
          <Image
            src="/images/runner.jpg"
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[#141210]/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#ff6a43]/8 to-[#ff8a66]/5" />

          <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-24 lg:py-32">
            <div className="grid grid-cols-2 gap-12 text-center md:grid-cols-4">
              {[
                { value: 50, suffix: "+", label: "Metrics per client" },
                { value: 10, suffix: "s", label: "To log a reading" },
                { value: FREE_CLIENT_LIMIT, suffix: "", label: "Free clients" },
                { value: 100, suffix: "%", label: "Data exportable" },
              ].map((s, i) => (
                <Reveal key={s.label} delay={i * 80}>
                  <p className="text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
                    <span className="text-white">
                      <CountUp target={s.value} suffix={s.suffix} />
                    </span>
                  </p>
                  <p className="mt-3 text-sm font-semibold text-white/60">{s.label}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            PRICING
            ============================================================ */}
        <section id="pricing" className="relative overflow-hidden">
          <Image
            src="/images/stretching.jpg"
            alt=""
            fill
            className="object-cover opacity-[0.07]"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[#141210]/95" />

          <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-24 lg:py-32">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                Simple, honest pricing.
              </h2>
              <p className="mt-4 text-lg text-white/60">
                Start free. No credit card. Upgrade when your roster grows beyond {FREE_CLIENT_LIMIT} clients.
              </p>
            </Reveal>

            <div className="mx-auto mt-16 grid max-w-3xl gap-6 sm:grid-cols-2">
              <Reveal>
                <PricingCard
                  name="Free"
                  price="₹0"
                  tagline="Everything you need to get started"
                  features={[`Up to ${FREE_CLIENT_LIMIT} active clients`, "All tracking features", "Charts & progress photos", "Export & delete anytime"]}
                  cta={primaryLabel}
                  href={primaryHref}
                />
              </Reveal>
              <Reveal delay={90}>
                <PricingCard
                  name="Pro"
                  price={`₹${PRO_PRICE_INR}`}
                  suffix="/mo"
                  tagline="For a growing practice"
                  features={["Unlimited active clients", "Everything in Free", "Priority support", "Early access to new features"]}
                  cta={user ? "Go Pro" : "Start free, upgrade later"}
                  href={user ? "/account/billing" : "/signup"}
                  highlight
                />
              </Reveal>
            </div>

            <Reveal delay={180}>
              <p className="mx-auto mt-10 max-w-md text-center text-sm text-white/50">
                That&apos;s less than <strong className="text-white/60">₹35/day</strong>. Less than one protein shake.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ============================================================
            CTA
            ============================================================ */}
        <section className="relative flex min-h-[60vh] items-center overflow-hidden">
          <Image
            src="/images/gym-dark.jpg"
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[#141210]/75" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 60% at 30% 40%, rgba(255,106,67,0.2), transparent 60%), " +
                "radial-gradient(50% 50% at 70% 60%, rgba(255,138,102,0.1), transparent 50%)",
            }}
          />

          <div className="relative z-10 mx-auto w-full max-w-3xl px-6 py-28 text-center lg:py-36">
            <Reveal>
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Stop tracking on Excel.{" "}
                <span className="bg-gradient-to-r from-[#ff8a66] to-[#ff6a43] bg-clip-text text-transparent">
                  Start coaching with clarity.
                </span>
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
                Set up in 2 minutes. Add your first client. See the difference from day one.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <ButtonLink
                  href={primaryHref}
                  className="animate-glow-pulse h-14 bg-white px-8 text-base font-bold text-[#141210] hover:bg-white/90"
                >
                  {primaryLabel}, it&apos;s free
                </ButtonLink>
                {!user && (
                  <ButtonLink href="/login" variant="ghost" className="h-14 px-6 text-base text-white/60 hover:bg-white/5 hover:text-white">
                    Sign in
                  </ButtonLink>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/[0.04] bg-[#141210]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-white/50 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <LogoMark size={22} id="footer-logo" />
            <span className="font-bold text-white/70">CoachPro</span>
          </div>
          <span className="text-center text-xs">
            Private by design · Consent, encryption, export & delete · Made in India
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PricingCard({
  name, price, suffix, tagline, features, cta, href, highlight,
}: {
  name: string; price: string; suffix?: string; tagline: string;
  features: string[]; cta: string; href: string; highlight?: boolean;
}) {
  return (
    <div className={`relative flex h-full flex-col rounded-2xl border p-8 backdrop-blur-sm transition-all duration-300 ${
      highlight
        ? "border-[#ff6a43]/30 bg-white/[0.06] shadow-[0_0_60px_rgba(255,106,67,0.1)]"
        : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05]"
    }`}>
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-gradient-to-r from-[#ff6a43] to-[#ff8a66] px-4 py-1 text-[11px] font-bold text-white shadow-lg">
            Most popular
          </span>
        </div>
      )}
      <h3 className="text-lg font-extrabold text-white">{name}</h3>
      <p className="mt-1 text-sm text-white/50">{tagline}</p>
      <p className="mt-6">
        <span className="text-5xl font-black tracking-tight text-white">{price}</span>
        {suffix && <span className="text-base text-white/60">{suffix}</span>}
      </p>
      <ul className="mt-7 flex flex-1 flex-col gap-3.5 text-sm text-white/70">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ff8a66]/10 text-[#ff8a66]">
              <Icon name="check" size={12} strokeWidth={3} />
            </span>
            {f}
          </li>
        ))}
      </ul>
      <ButtonLink
        href={href}
        variant={highlight ? "primary" : "outline"}
        className={`mt-8 w-full ${highlight ? "animate-glow-pulse" : ""}`}
      >
        {cta}
      </ButtonLink>
    </div>
  );
}
