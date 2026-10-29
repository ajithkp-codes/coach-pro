/**
 * The single error-reporting choke point for the whole app.
 *
 * Everything that wants to record a failure — the server instrumentation hook
 * (`onRequestError`), a swallowed `catch` in a Server Action, or a client error
 * boundary — calls `reportError` instead of a bare `console.error`. That gives
 * us one place to see failures today and one line to change to ship them to a
 * real provider tomorrow.
 *
 * Today: structured JSON to stdout/stderr, which Vercel (and any host) indexes
 * and makes searchable immediately — so nothing is silently lost.
 *
 * To add Sentry later: `npm i @sentry/nextjs`, initialise it in
 * `instrumentation.ts` / `instrumentation-client.ts`, then add one line to
 * `forward()` below:  `Sentry.captureException(error, { extra: context })`.
 * No call site changes — they already funnel through here.
 */

export interface ErrorContext {
  /** Where it happened, e.g. "aiImportAction" or "onRequestError". */
  source?: string;
  /** The trainer the request belonged to, when known (never PII beyond the id). */
  trainerId?: string;
  /** Anything else useful for triage; keep it free of client PII. */
  [key: string]: unknown;
}

/** Normalise an unknown throwable into a serialisable shape. */
function describe(error: unknown): { name: string; message: string; stack?: string; digest?: string } {
  if (error instanceof Error) {
    const digest = "digest" in error && error.digest != null ? String(error.digest) : undefined;
    return { name: error.name, message: error.message, stack: error.stack, digest };
  }
  return { name: "NonError", message: typeof error === "string" ? error : JSON.stringify(error) };
}

/**
 * Record an error. Fire-and-forget: it never throws and never awaits, so a
 * reporting failure can't take down the path that was already failing.
 */
export function reportError(error: unknown, context: ErrorContext = {}): void {
  const described = describe(error);
  try {
    console.error(
      JSON.stringify({
        level: "error",
        at: new Date().toISOString(),
        ...context,
        error: described,
      }),
    );
  } catch {
    // Last-resort: stringify failed (circular context). Log the essentials raw.
    console.error("[reportError]", context.source ?? "unknown", described.message);
  }

  forward(error, context);
}

/**
 * Extension point for an external provider (Sentry, etc.). Intentionally a
 * no-op until one is wired in — see the file header. Must stay synchronous and
 * swallow its own errors so it can never affect the caller.
 */
function forward(error: unknown, context: ErrorContext): void {
  // e.g. Sentry.captureException(error, { extra: context });
  void error;
  void context;
}
