/**
 * Chompbook AI server (ADR-037) — the logic, free of Cloudflare specifics so it is unit tested.
 *
 * The app sends OpenAI-compatible Chat Completions with `Authorization: Bearer <RevenueCat app user id>`.
 * We check that this user has the active "pro" entitlement (RevenueCat, cached), keep a daily token
 * budget per user, and forward the request to OpenRouter with our own key and the model we choose.
 */

export interface Env {
  /** OpenRouter API key (secret). */
  OPENROUTER_KEY: string;
  /** RevenueCat secret API key, v1 REST (secret). */
  REVENUECAT_SECRET: string;
  /** OpenRouter model id, e.g. "anthropic/claude-haiku-5.5". */
  MODEL?: string;
  /** Comma-separated fallback models OpenRouter may use when the main one fails. */
  FALLBACK_MODELS?: string;
  /** Tokens (prompt + completion) per user per UTC day. */
  DAILY_TOKENS?: string;
  /** RevenueCat entitlement identifier. */
  ENTITLEMENT?: string;
}

export interface Store {
  getEntitlement(user: string): Promise<{ active: boolean; checkedAt: number; expiresAt: number | null } | null>;
  putEntitlement(user: string, active: boolean, checkedAt: number, expiresAt: number | null): Promise<void>;
  getUsage(user: string, day: string): Promise<number>;
  addUsage(user: string, day: string, tokens: number): Promise<void>;
  /** Data retention: drop usage days before `beforeDay` and entitlement checks older than `checkedBefore`. */
  cleanup(beforeDay: string, checkedBefore: number): Promise<void>;
}

export interface Deps {
  fetch: typeof fetch;
  now: () => number;
  store: Store;
}

export const DEFAULTS = {
  model: "anthropic/claude-haiku-5.5",
  fallbacks: "deepseek/deepseek-v4.1-flash-1017",
  dailyTokens: 600_000,
  entitlement: "pro",
  /** One request may ask for at most this many output tokens. */
  maxOutputTokens: 16_000,
  /** Largest accepted request body (a long lesson prompt is ~150 KB). */
  maxBodyBytes: 1_500_000,
  /** How long a "Pro is active" answer from RevenueCat is trusted. */
  activeTtlMs: 10 * 60_000,
  /** How long a "not Pro" answer is trusted (short: the purchase may have just happened). */
  inactiveTtlMs: 30_000,
  /** Daily token counts are kept this long (privacy policy, section "Chompbook Pro"). */
  usageRetentionDays: 90,
  /** A cached subscription answer is dropped when the learner hasn't used Chompbook AI this long. */
  entitlementRetentionDays: 30,
};

/** Rough lesson size for "≈ N lessons left" in the app (prompt + answer of a 15-minute AI lesson). */
export const TOKENS_PER_LESSON = 60_000;

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "authorization, content-type, http-referer, x-title, x-chompbook-audience",
  "access-control-max-age": "86400",
};

export function json(status: number, body: unknown, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...CORS, ...extra } });
}

/** OpenAI-style error body; `code` lets the app tell the cases apart. */
export function apiError(status: number, code: string, message: string): Response {
  return json(status, { error: { message, code } });
}

export function utcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** RevenueCat app user ids: anonymous "$RCAnonymousID:<32 hex>" or a custom id. */
export function validUserId(id: string): boolean {
  return /^\$RCAnonymousID:[0-9a-f]{32}$/.test(id) || /^[A-Za-z0-9_.:@-]{8,100}$/.test(id);
}

export function bearer(req: Request): string | null {
  const h = req.headers.get("authorization") ?? "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

type RcEntitlement = { expires_date?: string | null; grace_period_expires_date?: string | null };

/** Active = no expiry (lifetime) or expiry / billing-grace end still in the future. Returns the later end. */
export function entitlementState(sub: unknown, entitlement: string, now: number): { active: boolean; expiresAt: number | null } {
  const ent = (sub as { subscriber?: { entitlements?: Record<string, RcEntitlement> } } | null)?.subscriber?.entitlements?.[entitlement];
  if (!ent) return { active: false, expiresAt: null };
  if (ent.expires_date == null) return { active: true, expiresAt: null };
  const ends = [ent.expires_date, ent.grace_period_expires_date].filter((d): d is string => !!d).map((d) => Date.parse(d)).filter(Number.isFinite);
  const end = ends.length ? Math.max(...ends) : NaN;
  return { active: Number.isFinite(end) && end > now, expiresAt: Number.isFinite(end) ? end : null };
}

export async function checkPro(user: string, env: Env, deps: Deps): Promise<boolean> {
  const now = deps.now();
  const cached = await deps.store.getEntitlement(user);
  if (cached) {
    const ttl = cached.active ? DEFAULTS.activeTtlMs : DEFAULTS.inactiveTtlMs;
    const stillValid = cached.expiresAt === null || cached.expiresAt > now;
    if (now - cached.checkedAt < ttl && (!cached.active || stillValid)) return cached.active;
  }
  const res = await deps.fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(user)}`, {
    headers: { authorization: `Bearer ${env.REVENUECAT_SECRET}`, accept: "application/json" },
  });
  if (!res.ok) {
    // RevenueCat down: trust a recent "active" for up to a day rather than lock paying users out
    if (cached?.active && now - cached.checkedAt < 24 * 3600_000) return true;
    throw new Error(`RevenueCat ${res.status}`);
  }
  const state = entitlementState(await res.json(), env.ENTITLEMENT || DEFAULTS.entitlement, now);
  await deps.store.putEntitlement(user, state.active, now, state.expiresAt);
  return state.active;
}

export function dailyLimit(env: Env): number {
  const n = Number(env.DAILY_TOKENS);
  return Number.isFinite(n) && n > 0 ? n : DEFAULTS.dailyTokens;
}

/** Next 00:00 UTC — when the daily budget resets. */
export function resetAt(now: number): string {
  const d = new Date(now);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1)).toISOString();
}

/**
 * Added in front of the app's messages unless the app says the learner is an adult (header
 * x-chompbook-audience: adult). Pro is sold from 13; model providers ask apps used by minors for
 * extra safeguards (Anthropic: "Guidelines for organizations serving minors").
 */
export const TEEN_SAFETY = [
  "Safety rules from Chompbook: the learner may be 13 to 17 years old.",
  "Keep every lesson, question and piece of feedback educational and suitable for a school textbook.",
  "Do not write sexual content, graphic violence, or instructions for self-harm, drugs, weapons or other dangerous activities, and do not encourage risky behaviour.",
  "If the learner's material touches such topics, cover them briefly and factually at a textbook level, or leave them out.",
  "Never ask for personal information.",
  "If the learner's text suggests they are in danger or distress, kindly suggest talking to a trusted adult or a local helpline.",
].join(" ");

/** Whether the learner is known to be an adult (the app sends the age group it asked for). */
export function isAdult(req: Request): boolean {
  return req.headers.get("x-chompbook-audience") === "adult";
}

/**
 * The request we send upstream: our model (+ fallbacks), capped output, the app's messages/tools
 * as they are (plus the safety rules for learners who may be minors). Forcing a specific function
 * isn't supported by every model there, so "auto".
 */
export function upstreamBody(body: Record<string, unknown>, env: Env, user: string, adult = false): Record<string, unknown> {
  const model = env.MODEL || DEFAULTS.model;
  const fallbacks = (env.FALLBACK_MODELS ?? DEFAULTS.fallbacks).split(",").map((m) => m.trim()).filter(Boolean);
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const out: Record<string, unknown> = {
    messages: adult ? messages : [{ role: "system", content: TEEN_SAFETY }, ...messages],
    model,
    ...(fallbacks.length ? { models: [model, ...fallbacks.filter((m) => m !== model)] } : {}),
    max_tokens: Math.min(Number(body.max_tokens) || 4096, DEFAULTS.maxOutputTokens),
    user: user.slice(-32), // OpenRouter abuse tracking; no personal data
  };
  if (Array.isArray(body.tools)) {
    out.tools = body.tools;
    out.tool_choice = typeof body.tool_choice === "string" ? body.tool_choice : "auto";
  }
  if (typeof body.temperature === "number") out.temperature = body.temperature;
  return out;
}

function tokensOf(data: unknown): number {
  const u = (data as { usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number } } | null)?.usage;
  if (!u) return 0;
  return u.total_tokens ?? (u.prompt_tokens ?? 0) + (u.completion_tokens ?? 0);
}

export async function handle(req: Request, env: Env, deps: Deps): Promise<Response> {
  const url = new URL(req.url);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (url.pathname === "/" || url.pathname === "/health") return json(200, { ok: true, service: "chompbook-ai" });

  const known = ["/v1/models", "/v1/usage", "/v1/chat/completions"];
  if (!known.includes(url.pathname)) return apiError(404, "not_found", "Not found.");

  const user = bearer(req);
  if (!user || !validUserId(user)) return apiError(401, "no_user", "Chompbook AI needs an active Pro subscription.");

  let pro: boolean;
  try {
    pro = await checkPro(user, env, deps);
  } catch {
    return apiError(503, "unavailable", "Chompbook AI can't check the subscription right now. Try again in a minute.");
  }
  if (!pro) return apiError(402, "no_subscription", "Your Chompbook Pro subscription is not active (payment required).");

  const now = deps.now();
  const day = utcDay(now);
  const limit = dailyLimit(env);
  const used = await deps.store.getUsage(user, day);
  const usage = { limit, used, left: Math.max(0, limit - used), resetAt: resetAt(now), tokensPerLesson: TOKENS_PER_LESSON };

  if (url.pathname === "/v1/usage") return json(200, usage);
  if (url.pathname === "/v1/models") {
    if (req.method !== "GET") return apiError(405, "method", "Use GET.");
    return json(200, { object: "list", data: [{ id: "chompbook", object: "model", owned_by: "chompbook" }] });
  }

  if (req.method !== "POST") return apiError(405, "method", "Use POST.");
  if (used >= limit) {
    return apiError(429, "daily_limit", `Today's Chompbook AI limit is used up (per day, about ${Math.round(limit / TOKENS_PER_LESSON)} lessons). It resets at 00:00 UTC.`);
  }
  const raw = await req.text();
  if (raw.length > DEFAULTS.maxBodyBytes) return apiError(413, "too_large", "The request is too large.");
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return apiError(400, "bad_json", "Request body is not JSON.");
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) return apiError(400, "no_messages", "messages are required.");

  let up: Response;
  try {
    up = await deps.fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.OPENROUTER_KEY}`,
        "content-type": "application/json",
        "HTTP-Referer": "https://chompbook.online",
        "X-Title": "Chompbook",
      },
      body: JSON.stringify(upstreamBody(body, env, user, isAdult(req))),
    });
  } catch {
    return apiError(503, "upstream_unreachable", "Chompbook AI is busy right now. Retrying…");
  }
  let data: unknown = null;
  try {
    data = await up.json();
  } catch {
    /* empty body */
  }
  if (!up.ok) {
    // our key or credits (401/402/403) and upstream limits are our problem, not the learner's: report as temporary
    const status = up.status === 400 ? 400 : 503;
    const msg = up.status === 400 ? ((data as { error?: { message?: string } } | null)?.error?.message ?? "Bad request.") : "Chompbook AI is busy right now. Retrying…";
    return apiError(status, up.status === 400 ? "bad_request" : "upstream", msg);
  }
  const spent = tokensOf(data);
  if (spent > 0) await deps.store.addUsage(user, day, spent);
  return json(200, data, { "x-chompbook-tokens-left": String(Math.max(0, limit - used - spent)) });
}

/** What the daily clean-up removes (run by the Worker's cron trigger). */
export function retentionCutoffs(now: number): { beforeDay: string; checkedBefore: number } {
  const day = 86_400_000;
  return { beforeDay: utcDay(now - DEFAULTS.usageRetentionDays * day), checkedBefore: now - DEFAULTS.entitlementRetentionDays * day };
}

export async function cleanup(deps: Pick<Deps, "now" | "store">): Promise<void> {
  const { beforeDay, checkedBefore } = retentionCutoffs(deps.now());
  await deps.store.cleanup(beforeDay, checkedBefore);
}

/** In-memory store for tests and local runs. */
export function memoryStore(): Store & { ents: Map<string, { active: boolean; checkedAt: number; expiresAt: number | null }>; usage: Map<string, number> } {
  const ents = new Map<string, { active: boolean; checkedAt: number; expiresAt: number | null }>();
  const usage = new Map<string, number>();
  return {
    ents,
    usage,
    async getEntitlement(u) {
      return ents.get(u) ?? null;
    },
    async putEntitlement(u, active, checkedAt, expiresAt) {
      ents.set(u, { active, checkedAt, expiresAt });
    },
    async getUsage(u, d) {
      return usage.get(`${u}|${d}`) ?? 0;
    },
    async addUsage(u, d, t) {
      usage.set(`${u}|${d}`, (usage.get(`${u}|${d}`) ?? 0) + t);
    },
    async cleanup(beforeDay, checkedBefore) {
      for (const k of [...usage.keys()]) if (k.split("|")[1] < beforeDay) usage.delete(k);
      for (const [u, e] of [...ents]) if (e.checkedAt < checkedBefore) ents.delete(u);
    },
  };
}
