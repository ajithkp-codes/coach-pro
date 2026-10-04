# CoachPro

A multi-tenant SaaS web app that personal trainers use to **monitor their clients' health
and fitness**. Each trainer gets a private workspace to record and track every client's body
metrics, health markers, and goals over time. Clients don't log in — it's the trainer's tool.

This is the **Phase 1 (Core tracker) MVP + basic charts**, built to hand to a handful of real
trainers. See [`system-design/`](system-design/) for the full architecture document.

## What's inside

- **Trainer auth** — sign up / sign in, one private tenant per trainer.
- **Client roster** — add, edit, archive, delete clients; consent captured per client.
- **Body metrics** — dated weight & body measurements with full history.
- **Health markers** — blood sugar, cholesterol, vitamin D, blood pressure, and custom
  markers, with reference-range flags.
- **Goals** — health/workout targets with auto-computed progress from recorded readings.
- **Charts** — weight & body-metric trends and health-marker trends over time.
- **Privacy** — per-client JSON export and permanent delete (DPDP/GDPR data rights).
- **API-first** — a versioned REST surface at `/api/v1/*` over the same data layer, so a
  mobile or client app can attach later without a rewrite.

## Tech stack

| Layer | Choice |
|------|--------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 (in-house UI kit in `components/ui`) |
| Backend | Supabase Cloud — Postgres + Auth + Row-Level Security |
| Charts | Recharts |
| Validation | Zod + React Hook Form |
| Tests | Vitest (unit + an RLS tenant-isolation integration test) |

**Multi-tenancy** is enforced at two layers: every row carries `trainer_id`, and Postgres
**RLS** policies make it impossible for one trainer to read or write another's data.

## Getting started

### 1. Create a Supabase project
- Create a project at [supabase.com](https://supabase.com), **region `ap-south-1` (Mumbai)**
  for India/DPDP.
- In **Project Settings → API**, copy the Project URL, the `anon` key, and the
  `service_role` key.

### 2. Configure environment
```bash
cp .env.local.example .env.local
# then fill in the three values
```

### 3. Apply the database schema
Open **SQL Editor** in the Supabase dashboard and run
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
(Or, with the Supabase CLI linked to the project: `npx supabase db push` — no Docker needed.)

This creates the tables, indexes, RLS policies, and a trigger that creates a trainer profile
row automatically on signup.

### 4. (Optional) Faster onboarding
By default Supabase requires email confirmation. For inviting trainers quickly, you can turn
it off under **Authentication → Providers → Email → Confirm email**.

### 5. Install & run
```bash
npm install
npm run dev
```
Open http://localhost:3000, create an account, and add your first client.

### 6. (Optional) Seed demo data
```bash
npm run seed
```
Creates a demo trainer (`demo@coachpro.app` / `coachpro-demo-123`) with two sample clients,
metrics, markers, and goals — handy for a quick walkthrough and to see the charts populated.

## Testing

```bash
npm test
```
- **Unit** — goal-progress math (`tests/progress.test.ts`), runs always.
- **RLS isolation** — `tests/rls.test.ts` creates two trainers and asserts neither can see or
  write the other's data. It runs only when `.env.local` has Supabase keys and the migration
  is applied; otherwise it skips. This is the most important behavioural guarantee in the app.

Also useful: `npm run build` (production build + type check) and `npm run lint`.

## REST API (API-first)

All endpoints require the trainer's session (cookie auth) and are tenant-scoped by RLS:

| Method | Path | Purpose |
|--------|------|---------|
| GET / POST | `/api/v1/clients` | List / create clients |
| GET / PATCH / DELETE | `/api/v1/clients/:id` | Read / update / delete a client |
| GET | `/api/v1/clients/:id/export` | Download the client's full record as JSON |
| GET / POST | `/api/v1/clients/:id/body-metrics` | List / add body metrics |
| GET / POST | `/api/v1/clients/:id/health-markers` | List / add health markers |
| GET / POST | `/api/v1/clients/:id/goals` | List / add goals |

## Deployment

- **App** → Vercel (connect the repo, add the three env vars).
- **Data** → the Supabase project above (encrypted at rest; HTTPS in transit).
- Keep the `service_role` key server-side only — it is never exposed to the browser.

## Privacy & compliance (India / DPDP)

- Consent is captured per client before recording health data.
- Each client's data can be **exported** (portability) and **deleted** (erasure) on request.
- Sensitive health data is isolated per tenant via RLS and encrypted in transit and at rest.
- A short legal review is recommended before public launch (see the architecture doc).

## Before inviting real trainers

A short checklist to go from "works" to "safe to share":

- **Password reset** is built in (`/forgot-password` → email link → `/reset-password`). For the
  email links to work, add your app's `…/auth/callback` URL to Supabase →
  **Authentication → URL Configuration → Redirect URLs**, and set `NEXT_PUBLIC_SITE_URL` in
  production so links point at the right origin (local dev uses the request host automatically).
- **Email confirmation** — decide on/off in Supabase → **Authentication → Providers → Email**.
  Off = instant onboarding; on = trainers must confirm before first sign-in.
- **Rate limiting** on auth/API — not included yet; it needs a shared store (Upstash/Redis) and
  is part of Phase 5 scaling. Add before any public launch.
- **Don't run `npm run seed` against production** (it creates a demo trainer). Rotate the
  `service_role` key if it's ever been shared.
- **Error/loading states** ship with the app (`app/error.tsx`, `global-error.tsx`,
  `not-found.tsx`, dashboard `loading.tsx`). Wire `console.error` in `error.tsx` to Sentry or
  your host's logs when you deploy.

## Project structure

```
app/
  (auth)/            login, signup + auth actions
  (dashboard)/       dashboard, clients (roster + detail tabs), account
  api/v1/            REST route handlers
components/          UI kit + feature components
lib/
  supabase/          server / browser / admin / middleware clients
  data/              shared service layer (used by UI + API)
  catalog/           marker & metric catalogs
  validation.ts      Zod schemas
supabase/migrations/ SQL schema + RLS
scripts/seed.mjs     demo data
tests/               unit + RLS tests
```

## Roadmap (Phases 2–5, attach without rebuild)

Training logs, progress photos + CDN, file sharing via signed links, payments/subscriptions,
trainer reminders, caching/read replicas, and a mobile app.
