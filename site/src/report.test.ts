import { describe, expect, it, vi } from "vitest";
import { allowedOrigin, logsNotice, parseBody } from "./report";
import worker, { handleReport, type Env } from "./worker";

const lesson = { at: "2026-10-29T10:00:00Z", reason: "wrong", where: "lesson · theory 2/3", excerpt: "Text", lessonTitle: "Data quality", version: "0.18.0", sessionId: "s1", skillsetId: "k1" };
const logs = { version: "0.18.0", platform: "android", lang: "ru", auto: true, entries: [{ at: "2026-10-29T10:00:00Z", kind: "error", message: "boom with sk-ant-api03-secretsecret", detail: "stack", version: "0.18.0" }] };

function fakeDb() {
  const rows: unknown[][] = [];
  const db = {
    prepare: (sql: string) => {
      let args: unknown[] = [];
      const st = {
        bind: (...a: unknown[]) => ((args = a), st),
        run: async () => {
          if (sql.startsWith("INSERT")) rows.push(args);
          return { meta: { last_row_id: rows.length } };
        },
      };
      return st;
    },
  };
  return { db, rows };
}

function post(body: unknown, origin = "https://localhost") {
  return new Request("https://chompbook.online/api/report", { method: "POST", headers: { origin, "content-type": "application/json", "cf-connecting-ip": "1.2.3.4" }, body: typeof body === "string" ? body : JSON.stringify(body) });
}

describe("report endpoint: parsing", () => {
  it("accepts lesson reports and error journals, drops unknown fields, redacts keys", () => {
    const p = parseBody(JSON.stringify({ app: "chompbook", reports: [lesson, { reason: "nope" }], logs }));
    if ("error" in p) throw new Error(p.error);
    expect(p.reports).toHaveLength(1);
    expect(p.reports[0]).not.toHaveProperty("sessionId");
    expect(p.logs?.entries[0].message).toBe("boom with [hidden]");
    expect(p.logs?.auto).toBe(true);
  });
  it("refuses junk", () => {
    expect(parseBody("{")).toEqual({ error: "bad_json" });
    expect(parseBody(JSON.stringify({ app: "other", reports: [lesson] }))).toEqual({ error: "unknown_app" });
    expect(parseBody(JSON.stringify({ app: "chompbook" }))).toEqual({ error: "empty" });
    expect(parseBody(JSON.stringify({ app: "chompbook", logs: { entries: Array(201).fill(logs.entries[0]) } }))).toEqual({ error: "too_many" });
    expect(parseBody("x".repeat(300 * 1024))).toEqual({ error: "too_large" });
  });
  it("only the app's own origins get CORS", () => {
    expect(allowedOrigin("https://localhost")).toBe("https://localhost");
    expect(allowedOrigin("capacitor://localhost")).toBe("capacitor://localhost");
    expect(allowedOrigin("http://localhost:5173")).toBe("http://localhost:5173");
    expect(allowedOrigin("https://evil.example")).toBeUndefined();
  });
  it("the Telegram notice is short and says what happened", () => {
    const text = logsNotice({ ...logs, entries: Array(8).fill(logs.entries[0]) }, 7, "DE");
    expect(text).toContain("#7");
    expect(text).toContain("auto");
    expect(text).toContain("…and 3 more");
    expect(text.length).toBeLessThan(3800);
  });
});

describe("report endpoint: worker", () => {
  const ctx = () => {
    const waits: Promise<unknown>[] = [];
    return { waitUntil: (p: Promise<unknown>) => void waits.push(p), waits };
  };

  it("stores each lesson report and the journal, then tells Telegram", async () => {
    const { db, rows } = fakeDb();
    const tg = vi.fn(async () => new Response("{}"));
    const c = ctx();
    const env: Env = { ASSETS: { fetch: async () => new Response("site") }, DB: db, TG_BOT_TOKEN: "t", TG_CHAT_ID: "42" };
    const res = await handleReport(post({ app: "chompbook", reports: [lesson], logs }), env, c, tg as unknown as typeof fetch);
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("https://localhost");
    expect(await res.json()).toEqual({ ok: true, ids: [1, 2] });
    expect(rows.map((r) => r[1])).toEqual(["lesson", "log"]);
    expect(JSON.stringify(rows)).not.toContain("secretsecret");
    expect(JSON.stringify(rows)).not.toContain("1.2.3.4");
    await Promise.all(c.waits);
    expect(tg).toHaveBeenCalledTimes(2);
    expect(String((tg.mock.calls[0] as unknown[])[0])).toBe("https://api.telegram.org/bott/sendMessage");
  });

  it("answers the CORS preflight, rate limits and refuses when not configured", async () => {
    const env: Env = { ASSETS: { fetch: async () => new Response("site") }, DB: fakeDb().db, LIMIT: { limit: async () => ({ success: false }) } };
    const pre = await handleReport(new Request("https://chompbook.online/api/report", { method: "OPTIONS", headers: { origin: "https://localhost" } }), env, ctx());
    expect(pre.status).toBe(204);
    expect(pre.headers.get("access-control-allow-headers")).toBe("content-type");
    expect((await handleReport(post({ app: "chompbook", logs }), env, ctx())).status).toBe(429);
    expect((await handleReport(post({ app: "chompbook", logs }), { ASSETS: env.ASSETS }, ctx())).status).toBe(503);
    expect((await handleReport(post("{"), { ...env, LIMIT: undefined }, ctx())).status).toBe(400);
  });

  it("everything else is the static site", async () => {
    const env: Env = { ASSETS: { fetch: async () => new Response("site") } };
    expect(await (await worker.fetch(new Request("https://chompbook.online/privacy/"), env, ctx())).text()).toBe("site");
    expect((await worker.fetch(new Request("https://chompbook.online/api/other"), env, ctx())).status).toBe(404);
  });
});
