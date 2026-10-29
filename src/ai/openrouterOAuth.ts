/**
 * OpenRouter in one tap (ADR-028): OAuth with PKCE. The learner signs in (Google, GitHub or
 * e-mail) on openrouter.ai, OpenRouter sends a one-time code to chompbook.online/oauth/openrouter/,
 * that page hands it to the app by a deep link, and the app swaps the code for the learner's own
 * key. No developer secret is involved; the verifier never leaves the phone.
 * https://openrouter.ai/docs/use-cases/oauth-pkce
 */
import { APP_ID, SITE_URL } from "../build";

export const OPENROUTER_AUTH = "https://openrouter.ai/auth";
export const OPENROUTER_KEYS = "https://openrouter.ai/api/v1/auth/keys";
export const OPENROUTER_CALLBACK = `${SITE_URL}/oauth/openrouter/`;
/** The deep link the callback page opens: `<scheme>://oauth/openrouter?code=…&state=…`. */
export const APP_SCHEME = APP_ID;
const PENDING_KEY = "pes.oauth.openrouter";
/** OpenRouter's code lives 10 minutes; a sign-in older than that is not worth finishing. */
export const PENDING_TTL_MS = 10 * 60_000;

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

export function randomToken(bytes = 32): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return b64url(a);
}

/** S256 code challenge for a verifier. */
export async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return b64url(new Uint8Array(digest));
}

export function authUrl(o: { challenge: string; state: string; callback?: string }): string {
  const cb = new URL(o.callback ?? OPENROUTER_CALLBACK);
  cb.searchParams.set("state", o.state); // OpenRouter keeps the callback's query and adds `code`
  cb.searchParams.set("app", APP_SCHEME); // which app the callback page opens (builds before 0.19 used another id)
  const u = new URL(OPENROUTER_AUTH);
  u.searchParams.set("callback_url", cb.toString());
  u.searchParams.set("code_challenge", o.challenge);
  u.searchParams.set("code_challenge_method", "S256");
  u.searchParams.set("key_label", "Chompbook");
  return u.toString();
}

export interface Pending {
  verifier: string;
  state: string;
  at: number;
}

export function savePending(p: Pending): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(p));
  } catch {
    /* private mode: the flow still works while the app stays open */
  }
  memory = p;
}
let memory: Pending | null = null;

export function loadPending(now = Date.now()): Pending | null {
  let p = memory;
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (raw) p = JSON.parse(raw) as Pending;
  } catch {
    /* ignore */
  }
  if (!p || typeof p.verifier !== "string" || typeof p.state !== "string") return null;
  return now - p.at > PENDING_TTL_MS ? null : p;
}

export function clearPending(): void {
  memory = null;
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

/** Starts a sign-in: remembers verifier and state, returns the page to open. */
export async function beginOpenRouterSignIn(now = Date.now()): Promise<string> {
  const verifier = randomToken(48);
  const state = randomToken(16);
  savePending({ verifier, state, at: now });
  return authUrl({ challenge: await challengeFor(verifier), state });
}

export interface Callback {
  code?: string;
  state?: string;
  error?: string;
}

/** Reads the deep link (or the web callback URL). Null when the URL isn't OpenRouter's callback. */
export function parseCallback(url: string): Callback | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const deep = u.protocol === `${APP_SCHEME}:` && (u.host === "oauth" ? u.pathname.replace(/\/$/, "") === "/openrouter" : u.pathname.replace(/^\/+/, "").replace(/\/$/, "") === "oauth/openrouter");
  const web = url.startsWith(OPENROUTER_CALLBACK.replace(/\/$/, ""));
  if (!deep && !web) return null;
  const code = u.searchParams.get("code") ?? undefined;
  const state = u.searchParams.get("state") ?? undefined;
  const error = u.searchParams.get("error") ?? undefined;
  return { code, state, error };
}

export type ExchangeFailure = "expired" | "state" | "denied" | "network" | "unknown";

export class OAuthError extends Error {
  constructor(public kind: ExchangeFailure) {
    super(`OpenRouter sign-in failed: ${kind}`);
  }
}

type Poster = (url: string, body: unknown) => Promise<{ status: number; data: unknown }>;

/** Checks the callback against the pending sign-in and swaps the code for a key. */
export async function finishOpenRouterSignIn(cb: Callback, post: Poster, now = Date.now()): Promise<string> {
  if (cb.error) throw new OAuthError("denied");
  const p = loadPending(now);
  if (!p) throw new OAuthError("expired");
  if (!cb.code || cb.state !== p.state) throw new OAuthError("state");
  let r: { status: number; data: unknown };
  try {
    r = await post(OPENROUTER_KEYS, { code: cb.code, code_verifier: p.verifier, code_challenge_method: "S256" });
  } catch {
    throw new OAuthError("network");
  }
  const key = (r.data as { key?: unknown } | null)?.key;
  if (r.status >= 200 && r.status < 300 && typeof key === "string" && key.length > 10) {
    clearPending();
    return key;
  }
  if (r.status === 400 || r.status === 403) {
    clearPending();
    throw new OAuthError("expired");
  }
  throw new OAuthError("unknown");
}
