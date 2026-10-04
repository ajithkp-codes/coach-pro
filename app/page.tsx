import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Sparkline } from "@/components/charts/sparkline";
import { createClient } from "@/lib/supabase/server";

const TRACKS: { icon: IconName; label: string }[] = [
  { icon: "scale", label: "Body metrics" },
  { icon: "pulse", label: "Health markers" },
  { icon: "target", label: "Goals" },
  { icon: "dumbbell", label: "Training" },
  { icon: "camera", label: "Progress photos" },
  { icon: "trendingUp", label: "Trends" },
];

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "users",
    title: "A private workspace per trainer",
    body: "Every client and record is isolated to your account — enforced right down to the database.",
  },
  {
    icon: "calendar",
    title: "A complete, dated record",
    body: "Body metrics, clinical markers, goals, and training for each client, with full history over time.",
  },
  {
    icon: "sparkles",
    title: "Progress at a glance",
    body: "Trend charts, goal progress, and progress photos — so change is obvious the moment you open a client.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-primary text-xs font-bold text-primary-foreground">
            CP
          </div>
          <span className="font-semibold tracking-tight">CoachPro</span>
        </div>
        <nav className="flex items-center gap-2">
          {user ? (
            <ButtonLink href="/dashboard" size="sm">
              Open dashboard
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink href="/signup" size="sm">
                Get started
              </ButtonLink>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(60% 50% at 20% 0%, #e0e7ff 0%, transparent 60%), radial-gradient(50% 40% at 95% 10%, #dbeafe 0%, transparent 55%)",
            }}
          />
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <Icon name="sparkles" size={13} /> For personal trainers
              </span>
              <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                Keep a complete picture of every client you coach.
              </h1>
              <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                CoachPro is the trainer&apos;s tool for recording and tracking each
                client&apos;s body metrics, health markers, goals, and training —
                in one place, over time.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ButtonLink href={user ? "/dashboard" : "/signup"} size="md">
                  {user ? "Open dashboard" : "Create your workspace"}
                </ButtonLink>
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center text-sm font-medium hover:text-primary"
                >
                  I already have an account →
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
                {TRACKS.map((t) => (
                  <span
                    key={t.label}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
                  >
                    <span className="text-primary">
                      <Icon name={t.icon} size={15} />
                    </span>
                    {t.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Product preview */}
            <div className="relative">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef2ff] text-sm font-semibold text-[#4338ca]">
                      AS
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Aarav Sharma</p>
                      <p className="text-xs text-muted-foreground">34 yrs · M</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-info-bg px-2.5 py-0.5 text-xs font-medium text-primary">
                    2 goals
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <PreviewTile icon="scale" label="Weight" value="79.3 kg" delta="-4.7 kg" good spark={[84, 83, 82, 81, 80.5, 79.3]} />
                  <PreviewTile icon="pulse" label="Body fat" value="18.5 %" delta="-3.5 %" good spark={[22, 21, 20, 19, 18.8, 18.5]} color="#0369a1" />
                </div>
                <div className="mt-3 rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">Total cholesterol</span>
                    <span className="font-semibold text-success">In range · 188 mg/dL</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-3/4 rounded-full bg-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-20">
          <div className="grid gap-5 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-sm"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-info-bg text-primary">
                  <Icon name={f.icon} size={20} />
                </span>
                <h2 className="mt-4 text-base font-semibold">{f.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground">
          <span>CoachPro · Client monitoring for personal trainers</span>
          <span>Consent · encryption · per-client export &amp; delete</span>
        </div>
      </footer>
    </div>
  );
}

function PreviewTile({
  icon,
  label,
  value,
  delta,
  good,
  spark,
  color = "#4f46e5",
}: {
  icon: IconName;
  label: string;
  value: string;
  delta: string;
  good?: boolean;
  spark: number[];
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon name={icon} size={14} /> {label}
      </div>
      <div className="mt-1 flex items-end justify-between">
        <div>
          <p className="text-lg font-semibold tracking-tight">{value}</p>
          <span className={good ? "text-xs font-medium text-success" : "text-xs font-medium text-danger"}>
            {delta}
          </span>
        </div>
        <Sparkline data={spark} color={color} width={72} height={30} />
      </div>
    </div>
  );
}
