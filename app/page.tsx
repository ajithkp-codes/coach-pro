import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Reveal } from "@/components/marketing/reveal";
import { LogoMark } from "@/components/brand/logo";
import { LandingNav } from "@/components/marketing/landing-nav";
import { MediaMotion } from "@/components/marketing/media-motion";
import { MediaPhoto } from "@/components/marketing/media-photo";
import { RouteOverlay } from "@/components/marketing/route-overlay";
import { LoadLineOverlay, MobilityRadialOverlay } from "@/components/marketing/tile-overlays";
import { BrowserFrame } from "@/components/marketing/device-frames";
import { DemoBooking } from "@/components/marketing/demo-booking";
import { ProductScreenshot } from "@/components/marketing/product-screenshot";
import { MockWebApp, MockClientReport } from "@/components/marketing/mocks";
import { createClient } from "@/lib/supabase/server";
import { FREE_CLIENT_LIMIT } from "@/lib/constants";
import { getTier, effectiveMonthlyPriceInr, LAUNCH_PROMO } from "@/lib/catalog/plans";

/* ------------------------------------------------------------------ */

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/* Section-shaped scrims, lifted from the design artifact. */
const SCRIM_HERO =
  "linear-gradient(90deg,rgba(6,6,6,.82) 0%,rgba(6,6,6,.46) 46%,rgba(6,6,6,.5) 100%),linear-gradient(180deg,rgba(6,6,6,.5),transparent 16%),linear-gradient(0deg,rgba(6,6,6,.82),transparent 42%)";
const SCRIM_STATEMENT =
  "linear-gradient(0deg,rgba(6,6,6,.78),transparent 55%),linear-gradient(90deg,rgba(6,6,6,.55),transparent 60%)";
const SCRIM_CENTER =
  "radial-gradient(ellipse at center,rgba(6,6,6,.35),rgba(6,6,6,.78))";
const SCRIM_TILE = "linear-gradient(0deg,rgba(6,6,6,.7),transparent 60%)";

const DISCIPLINES = [
  { slot: "d1", title: "Strength", tag: "Gym · Barbell · Lifting", img: "/images/discipline-strength.jpg", pos: "center 30%" },
  { slot: "d2", title: "Endurance", tag: "Running · Cycling", img: "/images/discipline-endurance.jpg", pos: "center" },
  { slot: "d3", title: "Movement", tag: "Dance · Pilates · Mobility", img: "/images/discipline-movement.jpg", pos: "center" },
] as const;

const VALUES = [
  {
    title: "See who's slipping",
    body: "Clients who go quiet or drift off their routine surface on their own, so you reach out before they drop off.",
  },
  {
    title: "One record per client",
    body: "Body stats, health markers, goals and progress photos live in a single timeline. Nothing lost in your DMs.",
  },
  {
    title: "Proof they can see",
    body: "Trend charts turn months of effort into one clear curve you can pull up in their next session.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const primaryHref = user ? "/dashboard" : "/signup";
  const primaryLabel = user ? "Open dashboard" : "Start free";

  return (
    <div data-landing="" className="flex flex-1 flex-col overflow-x-clip bg-[#f5f3ef]">

      {/* ===== NAV ===== */}
      <LandingNav signedIn={!!user} />

      <main className="flex-1">
        {/* ============================================================
            HERO — full-bleed generated motion field, type over it
            ============================================================ */}
        <section className="relative flex min-h-[92vh] flex-col overflow-hidden bg-[#050505] text-[#f6f3ee]">
          <div className="absolute inset-0 z-0 overflow-hidden bg-[#050505]">
            <MediaMotion slot="hero" />
            {/* Vermilion bird mark blended into the grainy field — the grain
                reads straight through it (Tern brand-on-photo treatment). */}
            <div
              className="pointer-events-none absolute -right-[6%] top-1/2 z-[1] -translate-y-1/2"
              style={{ mixBlendMode: "screen", opacity: 0.5 }}
            >
              <LogoMark size={680} tone="brand" className="h-[86vh] w-auto" />
            </div>
            <div className="pointer-events-none absolute inset-0" style={{ background: SCRIM_HERO }} />
            <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: GRAIN, backgroundSize: "180px 180px", opacity: 0.18, mixBlendMode: "overlay" }} />
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-16 pt-32 lg:pt-36">
            <div className="grid items-center gap-12 lg:grid-cols-[42%_58%] lg:gap-8">
              <div>
                <Reveal className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.17em] text-[#ff9076]">
                  For every kind of personal trainers
                </Reveal>
                <Reveal delay={60}>
                  <h1 className="hdisp mt-5 text-[3.5rem] leading-[0.9] text-[#f6f3ee] sm:text-7xl lg:text-[7rem]">
                    See every<br />
                    <em>arc.</em>
                  </h1>
                </Reveal>
                <Reveal delay={120}>
                  <p className="mt-6 max-w-[34ch] text-lg leading-relaxed text-[#f6f3ee]">
                    Strength, running, movement and rehab. CoachPro helps you
                    coach anyone and feel exactly how every client is moving.
                  </p>
                </Reveal>
                <Reveal delay={180} className="mt-8 flex flex-wrap items-center gap-3">
                  <ButtonLink href={primaryHref} className="h-[52px] px-7 text-base font-semibold">
                    {primaryLabel}
                  </ButtonLink>
                  <DemoBooking />
                </Reveal>
              </div>

              {/* Real product UI, chromeless, bled larger against the dark field */}
              <Reveal delay={220} className="relative w-full lg:-mr-10 xl:-mr-24">
                {/* ~1.18x on desktop so the dashboard reads clearly, kept off the
                    float wrapper (which owns `transform`). Origin-center grows it
                    into the dark field without crowding the headline. */}
                <div className="lg:origin-center lg:scale-[1.18]">
                  <div className="animate-float-slow">
                    <BrowserFrame chrome={false}>
                      <ProductScreenshot nativeWidth={1200}>
                        <MockWebApp />
                      </ProductScreenshot>
                    </BrowserFrame>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

        </section>

        {/* ============================================================
            STATEMENT 1 — full-bleed, centered
            ============================================================ */}
        <section className="relative flex min-h-[72vh] items-center justify-center overflow-hidden bg-[#050505] text-center text-[#f6f3ee]">
          <div className="absolute inset-0 z-0 overflow-hidden bg-[#050505]">
            <MediaPhoto src="/images/band-discipline.jpg" position="center 45%" />
            <div className="pointer-events-none absolute inset-0" style={{ background: SCRIM_CENTER }} />
            <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: GRAIN, backgroundSize: "180px 180px", opacity: 0.18, mixBlendMode: "overlay" }} />
          </div>
          <Reveal className="relative z-10 mx-auto max-w-4xl px-6 py-16">
            <p className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.17em] text-[#ff9076]">
              Any discipline
            </p>
            <h2 className="hdisp mt-4 text-[clamp(42px,7vw,104px)] leading-[0.92] text-[#ff5e40]">
              Train anything.<br />
              <em>Coach anyone.</em>
            </h2>
            <p className="mx-auto mt-5 max-w-[40ch] text-lg text-[#dcd6cc]">
              Whatever you teach, and whoever you teach it to, CoachPro holds
              your whole roster in one place.
            </p>
          </Reveal>
        </section>

        {/* ============================================================
            DISCIPLINES — portrait tiles (generated motion fields)
            ============================================================ */}
        <section id="disciplines" className="bg-[#f5f3ef]">
          <div className="mx-auto w-full max-w-6xl px-6 py-24 lg:py-28">
            <Reveal className="max-w-[40rem]">
              <p className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.17em] text-[#bc3420]">
                Built for your practice
              </p>
              <h2 className="hdisp mt-4 text-[clamp(34px,4.6vw,58px)] leading-[1.0] text-[#1a1713]">
                One tool, <em>every discipline.</em>
              </h2>
              <p className="mt-5 max-w-[38rem] text-lg text-[#57514a]">
                CoachPro doesn&rsquo;t care whether your clients lift, run or
                dance. It watches effort and consistency the same way, for
                everyone.
              </p>
            </Reveal>

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {DISCIPLINES.map((d, i) => (
                <Reveal
                  key={d.slot}
                  delay={i * 90}
                  className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#050505] text-[#f6f3ee] last:max-sm:col-span-2"
                >
                  <MediaPhoto src={d.img} position={d.pos} />
                  {d.slot === "d1" && <LoadLineOverlay />}
                  {d.slot === "d2" && <RouteOverlay />}
                  {d.slot === "d3" && <MobilityRadialOverlay />}
                  <div className="pointer-events-none absolute inset-0" style={{ background: SCRIM_TILE }} />
                  <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: GRAIN, backgroundSize: "180px 180px", opacity: 0.18, mixBlendMode: "overlay" }} />
                  <div className="absolute inset-x-5 bottom-4 z-10">
                    <b className="font-serif block text-[22px] font-semibold">{d.title}</b>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#b7afa2]">
                      {d.tag}
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            HONEST PRODUCT MOMENT — light, real app mock
            ============================================================ */}
        <section id="product" className="bg-[#f5f3ef] pb-24 lg:pb-28">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.15fr] lg:gap-10">
              <Reveal>
                <p className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.17em] text-[#bc3420]">
                  The product
                </p>
                <h2 className="hdisp mt-4 text-[clamp(34px,4.6vw,58px)] leading-[1.0] text-[#1a1713]">
                  One calm place for <em>your whole roster.</em>
                </h2>
                <p className="mt-5 max-w-[38rem] text-lg text-[#57514a]">
                  Open CoachPro and everyone you train is in front of you,
                  sorted so the people who need you come first. It stays quiet
                  until something needs your attention.
                </p>
                <div className="mt-7">
                  <ButtonLink href={primaryHref} className="h-[52px] px-7 text-base font-semibold">
                    {primaryLabel}
                  </ButtonLink>
                </div>
              </Reveal>

              <Reveal delay={90} className="relative lg:-mr-6 xl:-mr-20">
                <BrowserFrame chrome={false}>
                  <ProductScreenshot nativeWidth={1200}>
                    <MockClientReport />
                  </ProductScreenshot>
                </BrowserFrame>
              </Reveal>
            </div>

            <div className="mt-16 grid gap-7 sm:grid-cols-3">
              {VALUES.map((v, i) => (
                <Reveal key={v.title} delay={i * 80} className="border-t-2 border-[#e8402a] pt-4">
                  <h3 className="font-serif text-[23px] font-semibold tracking-[-0.01em] text-[#1a1713]">
                    {v.title}
                  </h3>
                  <p className="mt-2.5 text-[15px] text-[#57514a]">{v.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            STATEMENT 2 — full-bleed
            ============================================================ */}
        <section className="relative flex min-h-[72vh] items-end overflow-hidden bg-[#050505] text-[#f6f3ee]">
          <div className="absolute inset-0 z-0 overflow-hidden bg-[#050505]">
            <MediaPhoto src="/images/band-arc.jpg" position="center 40%" />
            <div className="pointer-events-none absolute inset-0" style={{ background: SCRIM_STATEMENT }} />
            <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: GRAIN, backgroundSize: "180px 180px", opacity: 0.18, mixBlendMode: "overlay" }} />
          </div>
          <Reveal className="relative z-10 mx-auto w-full max-w-6xl px-6 py-14">
            <p className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.17em] text-[#ff9076]">
              Progress over time
            </p>
            <h2 className="hdisp mt-4 text-[clamp(42px,7vw,104px)] leading-[0.92] text-[#ff5e40]">
              You see the<br />
              <em>whole arc.</em>
            </h2>
            <p className="mt-4 max-w-[40ch] text-lg text-[#dcd6cc]">
              You see more than today&rsquo;s session. You see the shape of
              someone&rsquo;s progress across weeks, so you always know where
              they&rsquo;re headed.
            </p>
          </Reveal>
        </section>

        {/* ============================================================
            PRICING — real plans, in INR
            ============================================================ */}
        <section id="pricing" className="bg-[#f5f3ef]">
          <div className="mx-auto w-full max-w-6xl px-6 py-24 lg:py-28">
            <Reveal className="max-w-[40rem]">
              <p className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.17em] text-[#bc3420]">
                Pricing
              </p>
              <h2 className="hdisp mt-4 text-[clamp(34px,4.6vw,58px)] leading-[1.0] text-[#1a1713]">
                Priced per coach, <em>not per client.</em>
              </h2>
              <p className="mt-5 max-w-[38rem] text-lg text-[#57514a]">
                Track as many clients as you like. Start free, upgrade when you
                want AI-assisted programming and a bigger roster.
                {LAUNCH_PROMO.active && (
                  <span className="font-medium text-[#1a1713]">
                    {" "}Paid plans are {LAUNCH_PROMO.percentOff}% off during launch.
                  </span>
                )}
              </p>
            </Reveal>

            <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
              <Reveal>
                <PricingCard
                  name="Free"
                  price="₹0"
                  suffix="/mo"
                  tagline="Everything you need to coach your first clients."
                  features={[
                    `Up to ${getTier("free").clientLimit} active clients`,
                    "Full roster, metrics, markers & goals",
                    "Manual & AI-imported training plans",
                    "Shareable read-only plan links",
                    "Export & delete anytime",
                  ]}
                  cta={primaryLabel}
                  href={primaryHref}
                />
              </Reveal>
              <Reveal delay={90}>
                <PricingCard
                  name="Pro"
                  strike={LAUNCH_PROMO.active ? `₹${getTier("pro").priceInr}` : undefined}
                  price={`₹${effectiveMonthlyPriceInr("pro")}`}
                  suffix="/mo"
                  note={LAUNCH_PROMO.active ? LAUNCH_PROMO.label : undefined}
                  tagline="AI-assisted programming for a growing roster."
                  features={[
                    `Up to ${getTier("pro").clientLimit} active clients`,
                    "Everything in Free",
                    "AI workout plan generation",
                    "Trend charts & progress photos",
                    "Priority support",
                  ]}
                  cta={user ? "Go Pro" : "Start free"}
                  href={user ? "/account/billing" : "/signup"}
                  highlight
                />
              </Reveal>
              <Reveal delay={180}>
                <PricingCard
                  name="Studio"
                  strike={LAUNCH_PROMO.active ? `₹${getTier("studio").priceInr}` : undefined}
                  price={`₹${effectiveMonthlyPriceInr("studio")}`}
                  suffix="/mo"
                  note={LAUNCH_PROMO.active ? LAUNCH_PROMO.label : undefined}
                  tagline="For full-time coaches and studios at scale."
                  features={[
                    "Unlimited active clients",
                    "Everything in Pro",
                    "Higher AI generation limits",
                    "First in line for new features",
                  ]}
                  cta={user ? "Go Studio" : "Start free"}
                  href={user ? "/account/billing" : "/signup"}
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ============================================================
            CTA — full-bleed
            ============================================================ */}
        <section className="bg-[#f5f3ef] pb-24 lg:pb-28">
          <div className="mx-auto w-full max-w-6xl px-6">
            <Reveal className="relative isolate overflow-hidden rounded-[26px] px-8 py-16 text-center text-[#f6f3ee] sm:px-12 lg:py-20">
              <div className="absolute inset-0 z-0 overflow-hidden bg-[#050505]">
                <MediaPhoto src="/images/band-cta.jpg" position="center 55%" />
                <div className="pointer-events-none absolute inset-0" style={{ background: "rgba(6,6,6,.62)" }} />
                <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: GRAIN, backgroundSize: "180px 180px", opacity: 0.18, mixBlendMode: "overlay" }} />
              </div>
              <div className="relative z-10">
                <p className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.17em] text-[#ff9076]">
                  Start free today
                </p>
                <h2 className="hdisp mt-3 text-[clamp(34px,5vw,60px)] leading-[1.0] text-[#f6f3ee]">
                  Coach like you can<br />
                  <em>see everything.</em>
                </h2>
                <p className="mx-auto mt-4 max-w-[34rem] text-lg text-[#e3ddd3]">
                  Set up your roster in minutes. Your first {FREE_CLIENT_LIMIT}{" "}
                  clients are free, forever.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <ButtonLink href={primaryHref} className="h-[52px] px-7 text-base font-semibold">
                    {primaryLabel}
                  </ButtonLink>
                  {!user && (
                    <ButtonLink
                      href="/login"
                      variant="ghost"
                      className="h-[52px] px-6 text-base text-[#f6f3ee] hover:bg-white/10"
                    >
                      Sign in
                    </ButtonLink>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-[#e0dacf] bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-[#1a1713]/45 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <LogoMark size={22} />
            <span className="font-bold text-[#1a1713]/70">CoachPro</span>
          </div>
          <span className="text-center text-xs">
            Private by design · Consent, encryption, export &amp; delete · Made in India
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PricingCard({
  name, price, strike, note, suffix, tagline, features, cta, href, highlight,
}: {
  name: string; price: string; strike?: string; note?: string; suffix?: string; tagline: string;
  features: string[]; cta: string; href: string; highlight?: boolean;
}) {
  return (
    <div className={`relative flex h-full flex-col gap-3.5 rounded-2xl border p-7 ${
      highlight
        ? "border-[#e8402a] bg-white shadow-md"
        : "border-[#e0dacf] bg-white"
    }`}>
      {highlight && (
        <span className="absolute -top-[11px] left-6 rounded-full bg-[#e8402a] px-2.5 py-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#160a07]">
          Most popular
        </span>
      )}
      <div className="font-serif text-[22px] font-semibold text-[#1a1713]">{name}</div>
      <p className="text-sm text-[#716a5e]">{tagline}</p>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
        {strike && (
          <span className="font-sans text-[22px] font-semibold tracking-[-0.02em] text-[#a39b8d] line-through">{strike}</span>
        )}
        <span className="font-sans text-[40px] font-bold tracking-[-0.02em] text-[#1a1713]">{price}</span>
        {suffix && <span className="text-sm font-medium text-[#716a5e]"> {suffix}</span>}
      </p>
      {note && (
        <p className="-mt-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#bc3420]">{note}</p>
      )}
      <ul className="mt-1 flex flex-1 flex-col gap-2.5">
        {features.map((f) => (
          <li key={f} className="flex gap-2.5 text-sm text-[#57514a]">
            <span className="mt-0.5 shrink-0 text-[#0e8a84]"><Icon name="check" size={16} strokeWidth={2.4} /></span>
            {f}
          </li>
        ))}
      </ul>
      <ButtonLink
        href={href}
        variant={highlight ? "primary" : "secondary"}
        className="mt-3 w-full"
      >
        {cta}
      </ButtonLink>
    </div>
  );
}
