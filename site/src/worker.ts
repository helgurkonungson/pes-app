/**
 * chompbook.online: static site (./public) + the report endpoint POST /api/report (ADR-033).
 * Lesson reports and error journals are stored in D1 (binding DB) and announced in Telegram
 * (secrets TG_BOT_TOKEN, TG_CHAT_ID). IP addresses are used for rate limiting only, never stored.
 */
import { allowedOrigin, lessonNotice, logsNotice, parseBody } from "./report";

interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  run(): Promise<{ meta?: { last_row_id?: number } }>;
}
interface D1 {
  prepare(sql: string): D1Statement;
}
export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  DB?: D1;
  LIMIT?: { limit(o: { key: string }): Promise<{ success: boolean }> };
  TG_BOT_TOKEN?: string;
  TG_CHAT_ID?: string;
}
export interface Ctx {
  waitUntil(p: Promise<unknown>): void;
}

const SCHEMA = `CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  received_at TEXT NOT NULL,
  type TEXT NOT NULL,
  version TEXT,
  platform TEXT,
  lang TEXT,
  country TEXT,
  auto INTEGER NOT NULL DEFAULT 0,
  summary TEXT,
  body TEXT NOT NULL
)`;
let schemaReady = false;

function json(data: unknown, status: number, origin?: string): Response {
  const headers: Record<string, string> = { "content-type": "application/json", "cache-control": "no-store" };
  if (origin) Object.assign(headers, { "access-control-allow-origin": origin, vary: "Origin" });
  return new Response(JSON.stringify(data), { status, headers });
}

async function store(db: D1 | undefined, row: { type: string; version?: string; platform?: string; lang?: string; country?: string; auto: boolean; summary: string; body: unknown }): Promise<number | undefined> {
  if (!db) return undefined;
  if (!schemaReady) {
    await db.prepare(SCHEMA).run();
    schemaReady = true;
  }
  const res = await db
    .prepare("INSERT INTO reports (received_at, type, version, platform, lang, country, auto, summary, body) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(new Date().toISOString(), row.type, row.version ?? null, row.platform ?? null, row.lang ?? null, row.country ?? null, row.auto ? 1 : 0, row.summary.slice(0, 300), JSON.stringify(row.body))
    .run();
  return res.meta?.last_row_id;
}

async function telegram(env: Env, text: string, fetcher: typeof fetch): Promise<void> {
  if (!env.TG_BOT_TOKEN || !env.TG_CHAT_ID) return;
  try {
    await fetcher(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: env.TG_CHAT_ID, text, disable_web_page_preview: true }),
    });
  } catch {
    /* the report is stored anyway */
  }
}

export async function handleReport(request: Request, env: Env, ctx: Ctx, fetcher: typeof fetch = fetch): Promise<Response> {
  const origin = allowedOrigin(request.headers.get("origin"));
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: origin ? { "access-control-allow-origin": origin, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type", "access-control-max-age": "86400", vary: "Origin" } : {},
    });
  }
  if (request.method !== "POST") return json({ ok: false, error: "method" }, 405, origin);
  if (!env.DB && !env.TG_BOT_TOKEN) return json({ ok: false, error: "not_configured" }, 503, origin);

  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (env.LIMIT && !(await env.LIMIT.limit({ key: ip })).success) return json({ ok: false, error: "rate_limited" }, 429, origin);

  const parsed = parseBody(await request.text());
  if ("error" in parsed) return json({ ok: false, error: parsed.error }, parsed.error === "too_large" ? 413 : 400, origin);

  const country = (request as Request & { cf?: { country?: string } }).cf?.country;
  const notices: string[] = [];
  const ids: (number | undefined)[] = [];
  try {
    for (const r of parsed.reports) {
      const id = await store(env.DB, { type: "lesson", version: r.version, country, auto: true, summary: `${r.reason} · ${r.lessonTitle ?? r.where ?? ""}`, body: r });
      ids.push(id);
      notices.push(lessonNotice(r, id, country));
    }
    if (parsed.logs) {
      const l = parsed.logs;
      const id = await store(env.DB, { type: "log", version: l.version, platform: l.platform, lang: l.lang, country, auto: l.auto, summary: `${l.entries.length} entries · ${l.entries[0]?.message ?? ""}`, body: l });
      ids.push(id);
      notices.push(logsNotice(l, id, country));
    }
  } catch {
    return json({ ok: false, error: "storage" }, 500, origin);
  }
  ctx.waitUntil(Promise.all(notices.map((t) => telegram(env, t, fetcher))));
  return json({ ok: true, ids }, 200, origin);
}

export default {
  async fetch(request: Request, env: Env, ctx: Ctx): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/report") return handleReport(request, env, ctx);
    if (url.pathname.startsWith("/api/")) return json({ ok: false, error: "not_found" }, 404);
    return env.ASSETS.fetch(request);
  },
};
