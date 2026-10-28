/**
 * Provider-agnostic AI call layer (SERVER ONLY).
 *
 * One `callAi(system, user, maxTokens)` works with any provider's key — the key
 * is resolved from env, the provider is inferred from the key (or set explicitly
 * via AI_PROVIDER), and the request is dispatched to the matching API:
 *   • OpenAI-compatible (OpenAI, OpenRouter, Groq, Together, DeepSeek, local …)
 *   • Anthropic (Claude)
 *   • Google Gemini
 *
 * Config (.env.local, all optional except the key):
 *   AI_API_KEY   the key (any provider). Falls back to GEMINI_API_KEY /
 *                ANTHROPIC_API_KEY / OPENAI_API_KEY for convenience.
 *   AI_PROVIDER  "openai" | "anthropic" | "gemini" — inferred from the key if unset.
 *   AI_MODEL     model id — a sensible per-provider default is used if unset.
 *   AI_BASE_URL  base URL for OpenAI-compatible providers (default OpenAI's).
 *
 * The key is used per request only and is never stored or logged here.
 */

export type AiProvider = "openai" | "anthropic" | "gemini";

export interface AiConfig {
  key: string;
  provider: AiProvider;
  model: string;
  baseUrl: string;
}

const TIMEOUT_MS = 150_000;
const MAX_ATTEMPTS = 5; // 1 try + 4 retries on transient overload (429/500/503, and Gemini's empty-body 404)

/** Exponential backoff with an 8s cap: 1s, 2s, 4s, 8s, 8s… */
function backoffMs(attempt: number): number {
  return Math.min(1000 * 2 ** (attempt - 1), 8000);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Parse a JSON body, tolerating an empty/invalid payload. */
function parseJson<T>(text: string): T | null {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Gemini thinking budget (tokens the model may "think" before answering).
 * Extraction doesn't need deep reasoning, so default to 0 (off) for speed — the
 * thinking is what made gemini-3.x time out. Set GEMINI_THINKING_BUDGET=-1 for
 * dynamic/model-decided, or a positive number to allow some.
 */
function geminiThinkingBudget(): number | null {
  const raw = process.env.GEMINI_THINKING_BUDGET;
  if (raw == null || raw.trim() === "") return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null; // omit → let the model decide
  return Math.trunc(n);
}

const DEFAULT_MODEL: Record<AiProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-5-5",
  gemini: "gemini-3.8-flash",
};

/** Guess the provider from the shape of the API key. */
function inferProvider(key: string): AiProvider {
  if (key.startsWith("sk-ant-")) return "anthropic";
  if (key.startsWith("AIza") || key.startsWith("AQ.")) return "gemini";
  return "openai"; // OpenAI and the many OpenAI-compatible gateways
}

/** Resolve the active AI config from an override key or env; null if no key. */
export function resolveAiConfig(overrideKey?: string): AiConfig | null {
  const key =
    (overrideKey ?? "").trim() ||
    process.env.AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENAI_API_KEY;
  if (!key) return null;

  const envProvider = process.env.AI_PROVIDER as AiProvider | undefined;
  const provider =
    envProvider === "openai" || envProvider === "anthropic" || envProvider === "gemini"
      ? envProvider
      : inferProvider(key);

  const model =
    process.env.AI_MODEL ||
    process.env.GEMINI_MODEL ||
    process.env.ANTHROPIC_MODEL ||
    process.env.OPENAI_MODEL ||
    DEFAULT_MODEL[provider];

  const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  return { key, provider, model, baseUrl };
}

/** True when a usable AI key is configured. */
export function isAiConfigured(): boolean {
  return resolveAiConfig() !== null;
}

type CallResult = { text: string } | { error: string };

function mapHttpError(status: number): string {
  if (status === 401 || status === 403) return "The API key was rejected.";
  if (status === 429 || status === 503) {
    return "The AI service is busy right now — please try again in a moment.";
  }
  if (status === 400) return "The AI request was rejected — check the model name and key.";
  if (status === 404) return "That AI model wasn’t found — check AI_MODEL.";
  return `AI request failed (status ${status}).`;
}

type FetchOutcome = { status: number; ok: boolean; text: string } | { error: string };

/** The default set of retryable statuses — transient server-side overload. */
function defaultTransient(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503;
}

/**
 * fetch with a per-attempt timeout, exponential backoff, and retries on transient
 * overload. `isTransient` decides which (status, body) pairs are worth retrying —
 * Gemini sheds free-tier load as an *empty-body* 404, so its caller opts that in
 * while still letting a real 404 (e.g. a retired model, which carries a message)
 * surface to the user.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  isTransient: (status: number, body: string) => boolean = defaultTransient,
): Promise<FetchOutcome> {
  let lastStatus = 503;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...init, signal: ctrl.signal });
      const text = await res.text();
      lastStatus = res.status;
      if (isTransient(res.status, text) && attempt < MAX_ATTEMPTS) {
        await sleep(backoffMs(attempt));
        continue;
      }
      return { status: res.status, ok: res.ok, text };
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      if (aborted && attempt < MAX_ATTEMPTS) {
        await sleep(backoffMs(attempt));
        continue;
      }
      return {
        error: aborted
          ? "The AI service took too long to respond — please try again."
          : "Couldn’t reach the AI service.",
      };
    } finally {
      clearTimeout(timer);
    }
  }
  return { error: mapHttpError(lastStatus) };
}

async function callOpenAiCompatible(
  cfg: AiConfig,
  system: string,
  userText: string,
  maxTokens: number,
): Promise<CallResult> {
  const out = await fetchWithRetry(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${cfg.key}` },
    body: JSON.stringify({
      model: cfg.model,
      temperature: 0,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userText },
      ],
    }),
  });
  if ("error" in out) return out;
  if (!out.ok) return { error: mapHttpError(out.status) };
  const data = parseJson<{ choices?: { message?: { content?: string } }[] }>(out.text);
  return { text: data?.choices?.[0]?.message?.content ?? "" };
}

async function callAnthropic(
  cfg: AiConfig,
  system: string,
  userText: string,
  maxTokens: number,
): Promise<CallResult> {
  const out = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": cfg.key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userText }],
    }),
  });
  if ("error" in out) return out;
  if (!out.ok) return { error: mapHttpError(out.status) };
  const data = parseJson<{ content?: { type: string; text?: string }[] }>(out.text);
  return { text: data?.content?.find((b) => b.type === "text")?.text ?? "" };
}

async function callGemini(
  cfg: AiConfig,
  system: string,
  userText: string,
  maxTokens: number,
): Promise<CallResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent`;
  const budget = geminiThinkingBudget();
  const generationConfig: Record<string, unknown> = {
    responseMimeType: "application/json",
    temperature: 0,
    maxOutputTokens: maxTokens,
  };
  if (budget != null) generationConfig.thinkingConfig = { thinkingBudget: budget };
  const out = await fetchWithRetry(
    url,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": cfg.key },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: userText }] }],
        generationConfig,
      }),
    },
    // Under free-tier load Gemini sheds generateContent as an *empty-body* 404 (and
    // as 503). Retry both; a real 404 (e.g. a retired model) carries a message body
    // and is left to surface so the user can fix AI_MODEL.
    (status, body) => defaultTransient(status) || (status === 404 && body.trim() === ""),
  );
  if ("error" in out) return out;
  if (!out.ok) {
    // Gemini reports a bad key as 400, not 401/403.
    if (out.status === 400) return { error: "The API key was rejected." };
    if (out.status === 404) return { error: "That AI model wasn’t found — check AI_MODEL." };
    return { error: mapHttpError(out.status) };
  }
  const data = parseJson<{ candidates?: { content?: { parts?: { text?: string }[] } }[] }>(out.text);
  const text = (data?.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  return { text };
}

/**
 * Send a system instruction + user text to the configured provider and return
 * the model's text (callers ask for JSON in the prompt and parse it themselves).
 * `overrideKey` lets a caller pass a per-request key instead of the env one.
 */
export async function callAi(
  system: string,
  userText: string,
  maxTokens: number,
  overrideKey?: string,
): Promise<CallResult> {
  const cfg = resolveAiConfig(overrideKey);
  if (!cfg) return { error: "AI isn’t configured — no API key is set." };
  switch (cfg.provider) {
    case "anthropic":
      return callAnthropic(cfg, system, userText, maxTokens);
    case "gemini":
      return callGemini(cfg, system, userText, maxTokens);
    default:
      return callOpenAiCompatible(cfg, system, userText, maxTokens);
  }
}
