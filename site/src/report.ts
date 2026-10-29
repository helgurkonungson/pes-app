/**
 * Pure part of the report endpoint (chompbook.online/api/report): checks and trims what the app
 * sends — lesson reports (ADR-025) and error journals (ADR-033) — and writes the Telegram notice.
 * No Cloudflare APIs here, so it is unit tested with the app's tests (`npm test`).
 */

export const MAX_BODY = 256 * 1024;
export const MAX_REPORTS = 20;
export const MAX_ENTRIES = 200;

/** Same patterns as the app's src/data/logs.ts — checked again on the server, just in case. */
const SECRET = /\b(sk-or-v1-[a-f0-9]{16,}|sk-[A-Za-z0-9_-]{8,}|AIza[0-9A-Za-z_-]{20,}|AQVN[0-9A-Za-z_-]{20,}|gsk_[A-Za-z0-9]{16,}|nvapi-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._-]{12,})/g;

export function redact(s: string): string {
  return s.replace(SECRET, "[hidden]");
}

/** A string field, redacted and cut; anything else → undefined. */
function str(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = redact(v).trim();
  return s ? (s.length > max ? `${s.slice(0, max - 1)}…` : s) : undefined;
}

export interface LessonReportIn {
  at?: string;
  reason?: string;
  comment?: string;
  where?: string;
  excerpt?: string;
  lessonTitle?: string;
  mode?: string;
  provider?: string;
  model?: string;
  version?: string;
}

export interface LogEntryIn {
  at?: string;
  kind?: string;
  message?: string;
  detail?: string;
  version?: string;
}

export interface LogsIn {
  version?: string;
  platform?: string;
  ua?: string;
  lang?: string;
  auto: boolean;
  entries: LogEntryIn[];
}

export interface Parsed {
  reports: LessonReportIn[];
  logs?: LogsIn;
}

const REASONS = ["harmful", "inappropriate", "wrong", "quality", "other"];
const KINDS = ["error", "ai", "import", "info"];

function report(r: unknown): LessonReportIn | undefined {
  if (!r || typeof r !== "object") return undefined;
  const o = r as Record<string, unknown>;
  const reason = typeof o.reason === "string" && REASONS.includes(o.reason) ? o.reason : undefined;
  if (!reason) return undefined;
  return {
    at: str(o.at, 40),
    reason,
    comment: str(o.comment, 1000),
    where: str(o.where, 120),
    excerpt: str(o.excerpt, 1600),
    lessonTitle: str(o.lessonTitle, 200),
    mode: str(o.mode, 40),
    provider: str(o.provider, 40),
    model: str(o.model, 120),
    version: str(o.version, 20),
  };
}

function entry(e: unknown): LogEntryIn | undefined {
  if (!e || typeof e !== "object") return undefined;
  const o = e as Record<string, unknown>;
  const message = str(o.message, 500);
  if (!message) return undefined;
  return { at: str(o.at, 40), kind: typeof o.kind === "string" && KINDS.includes(o.kind) ? o.kind : "info", message, detail: str(o.detail, 2000), version: str(o.version, 20) };
}

/** Body → what will be stored, or an error code for the response. */
export function parseBody(text: string): Parsed | { error: string } {
  if (text.length > MAX_BODY) return { error: "too_large" };
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { error: "bad_json" };
  }
  if (!json || typeof json !== "object") return { error: "bad_json" };
  const o = json as Record<string, unknown>;
  if (o.app !== "chompbook") return { error: "unknown_app" };
  const rawReports = Array.isArray(o.reports) ? o.reports : [];
  if (rawReports.length > MAX_REPORTS) return { error: "too_many" };
  const reports = rawReports.map(report).filter((r): r is LessonReportIn => !!r);
  let logs: LogsIn | undefined;
  if (o.logs && typeof o.logs === "object") {
    const l = o.logs as Record<string, unknown>;
    const raw = Array.isArray(l.entries) ? l.entries : [];
    if (raw.length > MAX_ENTRIES) return { error: "too_many" };
    const entries = raw.map(entry).filter((e): e is LogEntryIn => !!e);
    if (entries.length) logs = { version: str(l.version, 20), platform: str(l.platform, 20), ua: str(l.ua, 300), lang: str(l.lang, 10), auto: l.auto === true, entries };
  }
  if (!reports.length && !logs) return { error: "empty" };
  return { reports, logs };
}

const cut = (s: string | undefined, max: number) => (s ? (s.length > max ? `${s.slice(0, max - 1)}…` : s) : "");

/** Plain-text Telegram notice (no parse mode, so nothing needs escaping). */
export function lessonNotice(r: LessonReportIn, id: number | undefined, country?: string): string {
  const head = `🚩 Lesson report #${id ?? "?"} · ${r.reason} · v${r.version ?? "?"}${country ? ` · ${country}` : ""}`;
  const meta = [r.where, r.provider && `${r.provider}${r.model ? ` / ${r.model}` : ""}`].filter(Boolean).join(" · ");
  return [head, r.lessonTitle && `«${r.lessonTitle}»`, meta, r.comment && `💬 ${cut(r.comment, 600)}`, r.excerpt && `— ${cut(r.excerpt, 600)}`].filter(Boolean).join("\n").slice(0, 3800);
}

export function logsNotice(l: LogsIn, id: number | undefined, country?: string): string {
  const errors = l.entries.filter((e) => e.kind === "error").length;
  const head = `🐞 Error log #${id ?? "?"} · ${l.auto ? "auto" : "sent by the learner"} · v${l.version ?? "?"} · ${l.platform ?? "?"}${l.lang ? ` · ${l.lang}` : ""}${country ? ` · ${country}` : ""}`;
  const lines = l.entries.slice(0, 5).map((e) => `[${e.kind}] ${cut(e.message, 300)}`);
  const more = l.entries.length > 5 ? `…and ${l.entries.length - 5} more` : "";
  return [head, `${l.entries.length} entries, ${errors} crashes`, ...lines, more].filter(Boolean).join("\n").slice(0, 3800);
}

/** Origins the app runs on: the Android/iOS WebView, local dev and the site itself. */
export function allowedOrigin(origin: string | null): string | undefined {
  if (!origin) return undefined;
  if (origin === "https://localhost" || origin === "capacitor://localhost" || origin === "ionic://localhost" || origin === "https://chompbook.online") return origin;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
  return undefined;
}
