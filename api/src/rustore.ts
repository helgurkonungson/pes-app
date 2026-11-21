/**
 * RuStore subscriptions for Chompbook Pro (ADR-042). RevenueCat doesn't support RuStore, so the
 * RuStore build sends `rustore:<product id>:<purchase id>` as its key and the server checks that
 * purchase with the RuStore Public API itself ("Getting subscription data (V4)", Pay SDK purchases).
 *
 * Access to the Public API: a key pair from RuStore Console (Company → API RuStore). The server signs
 * `keyId + timestamp` with the private key (SHA512withRSA) and trades it for a JWE token (900 s).
 */

export interface RuStoreEnv {
  /** Key id from RuStore Console → Company → API RuStore. */
  RUSTORE_KEY_ID?: string;
  /** The private key from the same page, base64 PKCS#8 as RuStore gives it (secret). */
  RUSTORE_PRIVATE_KEY?: string;
  /** Public API host. Default https://public-api.rustore.ru (the -m hosts need Russian root certificates, which Workers don't trust). */
  RUSTORE_API?: string;
  /** "1" = also accept sandbox (test) subscriptions — only while testing. */
  RUSTORE_SANDBOX?: string;
  /** Comma-separated product ids that give Pro. Default pro_monthly,pro_annual. */
  RUSTORE_PRODUCTS?: string;
  /** OpenRouter model for RuStore subscribers (Russia, Belarus, CIS) and its fallbacks. */
  RUSTORE_MODEL?: string;
  RUSTORE_FALLBACK_MODELS?: string;
}

export const RUSTORE_APP = "online.chompbook.app";
export const RUSTORE_DEFAULTS = {
  api: "https://public-api.rustore.ru",
  products: "pro_monthly,pro_annual",
  /** Anthropic doesn't serve Russia and Belarus, so RuStore subscribers get other models (task #399). */
  model: "deepseek/deepseek-v4.1-flash-1017",
  fallbacks: "qwen/qwen3-235b-a22b-2507",
};

const PREFIX = "rustore:";

/** `rustore:<product id>:<purchase id>` → its parts; null for any other key. */
export function parseRuStoreUser(user: string): { productId: string; purchaseId: string } | null {
  if (!user.startsWith(PREFIX)) return null;
  const m = user.slice(PREFIX.length).match(/^([A-Za-z0-9_.-]{1,64}):([A-Za-z0-9-]{8,64})$/);
  return m ? { productId: m[1], purchaseId: m[2] } : null;
}

export const isRuStoreUser = (user: string) => user.startsWith(PREFIX);

export function ruStoreProducts(env: RuStoreEnv): string[] {
  return (env.RUSTORE_PRODUCTS || RUSTORE_DEFAULTS.products).split(",").map((s) => s.trim()).filter(Boolean);
}

/** The model chain for a RuStore subscriber, or null for everyone else. */
export function ruStoreModels(env: RuStoreEnv, user: string): { model: string; fallbacks: string[] } | null {
  if (!isRuStoreUser(user)) return null;
  const model = env.RUSTORE_MODEL || RUSTORE_DEFAULTS.model;
  const fallbacks = (env.RUSTORE_FALLBACK_MODELS ?? RUSTORE_DEFAULTS.fallbacks).split(",").map((m) => m.trim()).filter(Boolean);
  return { model, fallbacks };
}

/** ISO 8601 with milliseconds and an explicit offset, as RuStore's examples show it. */
export function ruStoreTimestamp(ms: number): string {
  return new Date(ms).toISOString().replace("Z", "+00:00");
}

function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const clean = b64.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const bin = atob(clean);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes: ArrayBuffer): string {
  const u = new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
  return btoa(s);
}

/** Body of POST /public/auth: keyId, timestamp, and the SHA512withRSA signature of keyId + timestamp. */
export async function ruStoreAuthBody(keyId: string, privateKeyB64: string, now: number): Promise<{ keyId: string; timestamp: string; signature: string }> {
  const timestamp = ruStoreTimestamp(now);
  const key = await crypto.subtle.importKey("pkcs8", b64ToBytes(privateKeyB64), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-512" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(keyId + timestamp));
  return { keyId, timestamp, signature: bytesToB64(sig) };
}

type Fetch = typeof fetch;

/** The JWE token lives 900 s; one per Worker isolate, renewed a minute early. */
let token: { jwe: string; until: number } | null = null;

export function resetRuStoreToken(): void {
  token = null;
}

async function ruStoreToken(env: RuStoreEnv, f: Fetch, now: number): Promise<string> {
  if (token && token.until > now) return token.jwe;
  if (!env.RUSTORE_KEY_ID || !env.RUSTORE_PRIVATE_KEY) throw new Error("RuStore API key is not configured");
  const base = (env.RUSTORE_API || RUSTORE_DEFAULTS.api).replace(/\/+$/, "");
  const res = await f(`${base}/public/auth`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(await ruStoreAuthBody(env.RUSTORE_KEY_ID, env.RUSTORE_PRIVATE_KEY, now)),
  });
  const data = (await res.json().catch(() => null)) as { code?: string; message?: string; body?: { jwe?: string; ttl?: number } } | null;
  const jwe = data?.body?.jwe;
  if (!res.ok || !jwe) throw new Error(`RuStore auth ${res.status}: ${data?.message ?? "no token"}`);
  token = { jwe, until: now + (Math.max(120, data?.body?.ttl ?? 900) - 60) * 1000 };
  return jwe;
}

/** Subset of the V4 subscription answer. */
export interface RuStoreSubscription {
  expiryTimeMillis?: string | number;
  autoRenewing?: boolean;
  /** 0 = payment pending, 1 = paid, 2 = free trial. */
  paymentState?: number;
  cancelReason?: number;
}

/** Active = paid or in the free trial, and the term hasn't ended. */
export function ruStoreState(sub: RuStoreSubscription | null | undefined, now: number): { active: boolean; expiresAt: number | null; trial?: boolean } {
  if (!sub) return { active: false, expiresAt: null };
  const end = Number(sub.expiryTimeMillis);
  const expiresAt = Number.isFinite(end) && end > 0 ? end : null;
  const paid = sub.paymentState === 1 || sub.paymentState === 2;
  const trial = sub.paymentState === 2;
  return { active: paid && expiresAt !== null && expiresAt > now, expiresAt, ...(trial ? { trial } : {}) };
}

/**
 * Asks RuStore about one subscription purchase. "Not found" (or an unknown product) = not Pro;
 * a failure of RuStore itself throws, so the caller can keep a recent "active" answer.
 */
export async function fetchRuStoreSubscription(user: string, env: RuStoreEnv, f: Fetch, now: number): Promise<{ active: boolean; expiresAt: number | null; trial?: boolean }> {
  const p = parseRuStoreUser(user);
  if (!p || !ruStoreProducts(env).includes(p.productId)) return { active: false, expiresAt: null };
  const base = (env.RUSTORE_API || RUSTORE_DEFAULTS.api).replace(/\/+$/, "");
  const path = `${encodeURIComponent(RUSTORE_APP)}/${encodeURIComponent(p.productId)}/${encodeURIComponent(p.purchaseId)}`;
  const kinds = env.RUSTORE_SANDBOX === "1" ? ["v4", "sandbox/v4"] : ["v4"];
  let lastError = "";
  for (const kind of kinds) {
    const ask = async () => f(`${base}/public/${kind}/subscription/${path}`, { headers: { "Public-Token": await ruStoreToken(env, f, now), accept: "application/json" } });
    let res = await ask();
    if (res.status === 401) {
      // the token may have been revoked or expired early: one fresh try
      token = null;
      res = await ask();
    }
    const data = (await res.json().catch(() => null)) as { code?: string; message?: string; body?: RuStoreSubscription | null } | null;
    if (res.ok && data?.code === "OK" && data.body) return ruStoreState(data.body, now);
    const notFound = res.status === 404 || /not found/i.test(data?.message ?? "");
    if (notFound || res.status === 400) continue; // maybe a sandbox purchase; otherwise not Pro
    lastError = `RuStore ${res.status}: ${data?.message ?? ""}`;
  }
  if (lastError) throw new Error(lastError);
  return { active: false, expiresAt: null };
}
