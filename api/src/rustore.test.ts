import { beforeEach, describe, expect, it, vi } from "vitest";
import { handle, memoryStore, type Env } from "./logic";
import { fetchRuStoreSubscription, parseRuStoreUser, resetRuStoreToken, ruStoreAuthBody, ruStoreModels, ruStoreState, ruStoreTimestamp } from "./rustore";

const NOW = Date.parse("2026-11-21T10:00:00Z");
const PURCHASE = "3aa0c7bd-964e-4562-b218-fe365adb4ae3";
const USER = `rustore:pro_monthly:${PURCHASE}`;

async function keyPair() {
  const kp = (await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-512" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", kp.privateKey));
  let s = "";
  for (const b of pkcs8) s += String.fromCharCode(b);
  return { publicKey: kp.publicKey, privateB64: btoa(s) };
}

const sub = (over: Record<string, unknown> = {}) => ({ code: "OK", message: "Successful result", body: { expiryTimeMillis: String(NOW + 20 * 86_400_000), autoRenewing: true, paymentState: 1, ...over } });

function rustoreFetch(opts: { subscription?: (url: string) => Response; auth?: () => Response } = {}) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const f = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith("/public/auth")) return opts.auth ? opts.auth() : new Response(JSON.stringify({ code: "OK", body: { jwe: "jwe-token", ttl: 900 } }), { status: 200 });
    if (url.includes("/subscription/")) return opts.subscription ? opts.subscription(url) : new Response(JSON.stringify(sub()), { status: 200 });
    if (url.startsWith("https://openrouter.ai/")) return new Response(JSON.stringify({ choices: [{ message: { content: "{}" } }], usage: { total_tokens: 100 } }), { status: 200 });
    throw new Error(`unexpected ${url}`);
  });
  return { f: f as unknown as typeof fetch, calls };
}

describe("RuStore subscriptions (ADR-042)", () => {
  let env: Env;
  let publicKey: CryptoKey;
  beforeEach(async () => {
    resetRuStoreToken();
    const k = await keyPair();
    publicKey = k.publicKey;
    env = { OPENROUTER_KEY: "or", REVENUECAT_SECRET: "rc", RUSTORE_KEY_ID: "1275328", RUSTORE_PRIVATE_KEY: k.privateB64 };
  });

  it("parses keys from the RuStore build", () => {
    expect(parseRuStoreUser(USER)).toEqual({ productId: "pro_monthly", purchaseId: PURCHASE });
    expect(parseRuStoreUser("rustore:pro_monthly")).toBeNull();
    expect(parseRuStoreUser("rustore:a b:12345678")).toBeNull();
    expect(parseRuStoreUser("$RCAnonymousID:0123456789abcdef0123456789abcdef")).toBeNull();
  });

  it("signs keyId + timestamp with SHA512withRSA", async () => {
    const body = await ruStoreAuthBody("1275328", env.RUSTORE_PRIVATE_KEY!, NOW);
    expect(body.timestamp).toBe("2026-11-21T10:00:00.000+00:00");
    expect(ruStoreTimestamp(NOW)).toBe(body.timestamp);
    const sig = Uint8Array.from(atob(body.signature), (c) => c.charCodeAt(0));
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, sig, new TextEncoder().encode("1275328" + body.timestamp));
    expect(ok).toBe(true);
  });

  it("reads the subscription state", () => {
    expect(ruStoreState(sub().body, NOW)).toEqual({ active: true, expiresAt: NOW + 20 * 86_400_000 });
    expect(ruStoreState(sub({ paymentState: 2 }).body, NOW)).toMatchObject({ active: true, trial: true });
    expect(ruStoreState(sub({ paymentState: 0 }).body, NOW).active).toBe(false);
    expect(ruStoreState(sub({ expiryTimeMillis: String(NOW - 1) }).body, NOW).active).toBe(false);
    expect(ruStoreState(null, NOW).active).toBe(false);
  });

  it("asks RuStore with the JWE token and caches the token", async () => {
    const { f, calls } = rustoreFetch();
    expect((await fetchRuStoreSubscription(USER, env, f, NOW)).active).toBe(true);
    expect((await fetchRuStoreSubscription(USER, env, f, NOW + 1000)).active).toBe(true);
    expect(calls.filter((c) => c.url.endsWith("/public/auth"))).toHaveLength(1);
    const q = calls.find((c) => c.url.includes("/subscription/"))!;
    expect(q.url).toBe(`https://public-api.rustore.ru/public/v4/subscription/online.chompbook.app/pro_monthly/${PURCHASE}`);
    expect((q.init?.headers as Record<string, string>)["Public-Token"]).toBe("jwe-token");
  });

  it("not found or a foreign product = not Pro; sandbox only when allowed", async () => {
    const notFound = () => new Response(JSON.stringify({ code: "ERROR", message: "Purchase not found", body: null }), { status: 404 });
    const a = rustoreFetch({ subscription: notFound });
    expect((await fetchRuStoreSubscription(USER, env, a.f, NOW)).active).toBe(false);
    expect((await fetchRuStoreSubscription(`rustore:coins:${PURCHASE}`, env, a.f, NOW)).active).toBe(false);

    const b = rustoreFetch({ subscription: (url) => (url.includes("/sandbox/") ? new Response(JSON.stringify(sub()), { status: 200 }) : notFound()) });
    expect((await fetchRuStoreSubscription(USER, env, b.f, NOW)).active).toBe(false);
    expect((await fetchRuStoreSubscription(USER, { ...env, RUSTORE_SANDBOX: "1" }, b.f, NOW)).active).toBe(true);
  });

  it("throws when RuStore itself fails or the key is missing", async () => {
    const a = rustoreFetch({ subscription: () => new Response(JSON.stringify({ code: "ERROR", message: "Something went wrong" }), { status: 500 }) });
    await expect(fetchRuStoreSubscription(USER, env, a.f, NOW)).rejects.toThrow(/RuStore 500/);
    resetRuStoreToken();
    await expect(fetchRuStoreSubscription(USER, { ...env, RUSTORE_KEY_ID: "" }, a.f, NOW)).rejects.toThrow(/not configured/);
  });

  it("serves lessons to a RuStore subscriber with the RuStore model chain", async () => {
    const { f, calls } = rustoreFetch();
    const store = memoryStore();
    const req = new Request("https://api.chompbook.online/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${USER}`, "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "system", content: "s" }, { role: "user", content: "hi" }], tools: [{ type: "function", function: { name: "emit_section", parameters: {} } }] }),
    });
    const res = await handle(req, env, { fetch: f, now: () => NOW, store, sleep: async () => {} });
    expect(res.status).toBe(200);
    const up = JSON.parse(String(calls.find((c) => c.url.startsWith("https://openrouter.ai/"))!.init!.body));
    expect(up.model).toBe(ruStoreModels(env, USER)!.model);
    expect(up.model.startsWith("anthropic/")).toBe(false);
    expect(calls.some((c) => c.url.startsWith("https://api.revenuecat.com/"))).toBe(false);
    expect(store.ents.get(USER)?.active).toBe(true);
  });

  it("keeps a recent 'active' answer when RuStore is down", async () => {
    const store = memoryStore();
    await store.putEntitlement(USER, true, NOW - 3600_000, NOW + 86_400_000);
    const { f } = rustoreFetch({ subscription: () => new Response("{}", { status: 502 }) });
    const req = new Request("https://api.chompbook.online/v1/usage", { headers: { authorization: `Bearer ${USER}` } });
    const res = await handle(req, env, { fetch: f, now: () => NOW, store });
    expect(res.status).toBe(200);
  });
});
