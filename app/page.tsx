import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const features = [
    {
      title: "Private workspace per trainer",
      body: "Every client and record is isolated to your account — no one else can see your data.",
    },
    {
      title: "A complete, dated record",
      body: "Body metrics, clinical markers, and goals for each client, tracked over time with full history.",
    },
    {
      title: "Progress at a glance",
      body: "Trend charts for weight and health markers, and progress against the goals you set.",
    },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
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

      <main className="mx-auto w-full max-w-5xl flex-1 px-6">
        <section className="py-16 sm:py-24">
          <p className="text-sm font-medium text-primary">
            For personal trainers
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Keep a complete picture of every client you coach.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            CoachPro is the trainer&apos;s tool for recording and tracking each
            client&apos;s body metrics, health markers, and goals — in one place,
            over time.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={user ? "/dashboard" : "/signup"}>
              {user ? "Open dashboard" : "Create your workspace"}
            </ButtonLink>
            <Link
              href="/login"
              className="inline-flex h-10 items-center text-sm font-medium text-foreground hover:text-primary"
            >
              I already have an account →
            </Link>
          </div>
        </section>

        <section className="grid gap-5 pb-20 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-[var(--radius)] border border-border bg-card p-5 shadow-sm"
            >
              <h2 className="text-sm font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-6 text-xs text-muted-foreground">
          CoachPro · Health data handled with consent, encryption, and per-client
          export &amp; delete.
        </div>
      </footer>
    </div>
  );
}
