import { describe, expect, it, vi } from "vitest";
import { cleanup, DEFAULTS, TEEN_SAFETY, entitlementState, handle, memoryStore, resetAt, retentionCutoffs, upstreamBody, utcDay, validUserId, type Env } from "./logic";

const USER = "$RCAnonymousID:0123456789abcdef0123456789abcdef";
const NOW = Date.parse("2026-10-29T10:00:00Z");
const env: Env = { OPENROUTER_KEY: "or-key", REVENUECAT_SECRET: "rc-secret", DAILY_TOKENS: "1000" };

function rc(expires: string | null | undefined, extra: Record<string, unknown> = {}) {
  return { subscriber: { entitlements: expires === undefined ? {} : { pro: { expires_date: expires, ...extra } } } };
}

function setup(opts: { sub?: unknown; rcStatus?: number; upstream?: (body: Record<string, unknown>) => Response } = {}) {
  const store = memoryStore();
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.startsWith("https://api.revenuecat.com/")) return new Response(JSON.stringify(opts.sub ?? rc("2026-11-29T10:00:00Z")), { status: opts.rcStatus ?? 200 });
    if (url.startsWith("https://openrouter.ai/")) {
      const body = JSON.parse(String(init?.body));
      return opts.upstream ? opts.upstream(body) : new Response(JSON.stringify({ choices: [{ message: { content: "{}" } }], usage: { total_tokens: 300 } }), { status: 200 });
    }
    throw new Error(`unexpected ${url}`);
  });
  const deps = { fetch: fetchMock as unknown as typeof fetch, now: () => NOW, store };
  return { store, calls, deps };
}

const chat = (body: unknown = { model: "chompbook", messages: [{ role: "user", content: "hi" }], max_tokens: 99999, tools: [{ type: "function" }], tool_choice: { type: "function", function: { name: "x" } } }, user = USER) =>
  new Request("https://api.chompbook.online/v1/chat/completions", { method: "POST", headers: { authorization: `Bearer ${user}`, "content-type": "application/json" }, body: JSON.stringify(body) });

describe("Chompbook AI server (ADR-037)", () => {
  it("validates user ids and dates", () => {
    expect(validUserId(USER)).toBe(true);
    expect(validUserId("$RCAnonymousID:xyz")).toBe(false);
    expect(validUserId("a b c")).toBe(false);
    expect(utcDay(NOW)).toBe("2026-10-29");
    expect(resetAt(NOW)).toBe("2026-10-30T00:00:00.000Z");
  });

  it("reads the entitlement: expiry, grace period, lifetime, missing", () => {
    expect(entitlementState(rc("2026-11-01T00:00:00Z"), "pro", NOW).active).toBe(true);
    expect(entitlementState(rc("2026-10-01T00:00:00Z"), "pro", NOW).active).toBe(false);
    expect(entitlementState(rc("2026-10-01T00:00:00Z", { grace_period_expires_date: "2026-10-30T00:00:00Z" }), "pro", NOW).active).toBe(true);
    expect(entitlementState(rc(null), "pro", NOW)).toEqual({ active: true, expiresAt: null });
    expect(entitlementState(rc(undefined), "pro", NOW).active).toBe(false);
    expect(entitlementState(null, "pro", NOW).active).toBe(false);
  });

  it("rejects requests without a user or without Pro", async () => {
    const a = setup();
    const r1 = await handle(new Request("https://api.chompbook.online/v1/chat/completions", { method: "POST", body: "{}" }), env, a.deps);
    expect(r1.status).toBe(401);
    const b = setup({ sub: rc("2026-10-01T00:00:00Z") });
    const r2 = await handle(chat(), env, b.deps);
    expect(r2.status).toBe(402);
    expect((await r2.json()).error.code).toBe("no_subscription");
    expect(b.calls.some((c) => c.url.startsWith("https://openrouter.ai/"))).toBe(false);
  });

  it("forwards to OpenRouter with our key and model, counts tokens, caches the entitlement", async () => {
    const s = setup();
    const r = await handle(chat(), env, s.deps);
    expect(r.status).toBe(200);
    expect(r.headers.get("x-chompbook-tokens-left")).toBe("700");
    const up = s.calls.find((c) => c.url.startsWith("https://openrouter.ai/"))!;
    expect((up.init?.headers as Record<string, string>).authorization).toBe("Bearer or-key");
    const sent = JSON.parse(String(up.init?.body));
    expect(sent.model).toBe(DEFAULTS.model);
    expect(sent.models[0]).toBe(DEFAULTS.model);
    expect(sent.max_tokens).toBe(DEFAULTS.maxOutputTokens);
    expect(sent.tool_choice).toBe("auto"); // forcing a function isn't supported by every upstream model
    expect(sent.messages[0].content).toBe(TEEN_SAFETY); // no "adult" header: safety rules first
    expect(s.store.usage.get(`${USER}|2026-10-29`)).toBe(300);
    // second request: RevenueCat is not asked again within the cache window
    await handle(chat(), env, s.deps);
    expect(s.calls.filter((c) => c.url.startsWith("https://api.revenuecat.com/")).length).toBe(1);
  });

  it("stops at the daily budget with a 'daily' error the app won't retry", async () => {
    const s = setup();
    await s.store.addUsage(USER, "2026-10-29", 1000);
    const r = await handle(chat(), env, s.deps);
    expect(r.status).toBe(429);
    const body = await r.json();
    expect(body.error.code).toBe("daily_limit");
    expect(body.error.message).toMatch(/per day/);
  });

  it("reports usage and models for a Pro user", async () => {
    const s = setup();
    await s.store.addUsage(USER, "2026-10-29", 250);
    const u = await handle(new Request("https://api.chompbook.online/v1/usage", { headers: { authorization: `Bearer ${USER}` } }), env, s.deps);
    expect(await u.json()).toMatchObject({ limit: 1000, used: 250, left: 750, resetAt: "2026-10-30T00:00:00.000Z" });
    const m = await handle(new Request("https://api.chompbook.online/v1/models", { headers: { authorization: `Bearer ${USER}` } }), env, s.deps);
    expect((await m.json()).data[0].id).toBe("chompbook");
  });

  it("hides our own upstream problems as a temporary 503", async () => {
    const s = setup({ upstream: () => new Response(JSON.stringify({ error: { message: "Insufficient credits" } }), { status: 402 }) });
    const r = await handle(chat(), env, s.deps);
    expect(r.status).toBe(503);
    expect(s.store.usage.size).toBe(0);
  });

  it("keeps a recently active user working when RevenueCat is down", async () => {
    const s = setup({ rcStatus: 500 });
    await s.store.putEntitlement(USER, true, NOW - 60 * 60_000, Date.parse("2026-11-29T00:00:00Z"));
    expect((await handle(chat(), env, s.deps)).status).toBe(200);
    const fresh = setup({ rcStatus: 500 });
    expect((await handle(chat(), env, fresh.deps)).status).toBe(503);
  });

  it("builds a safe upstream body", () => {
    const b = upstreamBody({ messages: [{ role: "user", content: "x" }], max_tokens: 500, model: "evil/expensive", temperature: 0.2 }, { ...env, MODEL: "m1", FALLBACK_MODELS: "m2, m1 ,m3" }, USER);
    expect(b).toMatchObject({ model: "m1", models: ["m1", "m2", "m3"], max_tokens: 500, temperature: 0.2 });
    expect(b.tools).toBeUndefined();
    expect(String(b.user).length).toBeLessThanOrEqual(32);
    expect(upstreamBody({ messages: [] }, { ...env, FALLBACK_MODELS: "" }, USER).models).toBeUndefined();
    // learners who may be minors get the safety rules first; adults get the app's messages as they are
    expect((b.messages as { content: string }[]).map((m) => m.content)).toEqual([TEEN_SAFETY, "x"]);
    expect(upstreamBody({ messages: [{ role: "user", content: "x" }] }, env, USER, true).messages).toEqual([{ role: "user", content: "x" }]);
  });

  it("answers CORS preflight and health", async () => {
    const s = setup();
    expect((await handle(new Request("https://api.chompbook.online/v1/chat/completions", { method: "OPTIONS" }), env, s.deps)).status).toBe(204);
    expect((await handle(new Request("https://api.chompbook.online/health"), env, s.deps)).status).toBe(200);
    expect((await handle(new Request("https://api.chompbook.online/v1/other", { headers: { authorization: `Bearer ${USER}` } }), env, s.deps)).status).toBe(404);
  });
  it("forgets old usage and unused subscription answers (retention)", async () => {
    const now = Date.parse("2026-12-31T05:00:00Z");
    expect(retentionCutoffs(now)).toEqual({ beforeDay: "2026-10-02", checkedBefore: now - 30 * 86_400_000 });
    const store = memoryStore();
    await store.addUsage("u1", "2026-10-01", 5);
    await store.addUsage("u1", "2026-10-02", 7);
    await store.putEntitlement("old", true, now - 31 * 86_400_000, null);
    await store.putEntitlement("recent", true, now - 86_400_000, null);
    await cleanup({ now: () => now, store });
    expect([...store.usage.keys()]).toEqual(["u1|2026-10-02"]);
    expect([...store.ents.keys()]).toEqual(["recent"]);
  });
});
