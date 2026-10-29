/**
 * Local error journal (Settings → Error log). Keeps the last 200 entries on the phone;
 * the learner sends it to the developer (endpoint or share sheet; automatically only if allowed,
 * ADR-033). Never stores keys.
 */
import type { LogEntry } from "../core/types";
import { db } from "./db";
import { scheduleAutoSend } from "./logSend";

const APP_VERSION: string = __APP_VERSION__;

const MAX = 200;
/** Anything that looks like a secret is masked before it is written. */
const SECRET = /\b(sk-or-v1-[a-f0-9]{16,}|sk-[A-Za-z0-9_-]{8,}|AIza[0-9A-Za-z_-]{20,}|AQVN[0-9A-Za-z_-]{20,}|gsk_[A-Za-z0-9]{16,}|nvapi-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._-]{12,})/g;

export function redact(s: string): string {
  return s.replace(SECRET, "[hidden]");
}

export async function logEvent(kind: LogEntry["kind"], message: string, detail?: string): Promise<void> {
  try {
    await db.logs.add({ at: new Date().toISOString(), kind, message: redact(message).slice(0, 500), detail: detail ? redact(detail).slice(0, 2000) : undefined, version: APP_VERSION });
    const n = await db.logs.count();
    if (n > MAX) {
      const old = await db.logs.orderBy("id").limit(n - MAX).primaryKeys();
      await db.logs.bulkDelete(old);
    }
    if (kind !== "info") scheduleAutoSend();
  } catch {
    /* the journal must never break the app */
  }
}

/** The journal as plain text for sending (newest first), with device info. */
export async function logText(): Promise<string> {
  const rows = await db.logs.orderBy("id").reverse().toArray();
  const head = [`Chompbook ${APP_VERSION}`, typeof navigator !== "undefined" ? navigator.userAgent : "", `${rows.length} entries`, ""].join("\n");
  return head + rows.map((r) => `${r.at} [${r.kind}] v${r.version} ${r.message}${r.detail ? `\n    ${r.detail.replace(/\n/g, "\n    ")}` : ""}`).join("\n");
}

/** Catches crashes and unhandled promise errors once, at start. */
export function installErrorLogging(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("error", (e) => void logEvent("error", e.message || "Script error", e.error?.stack ?? `${e.filename}:${e.lineno}`));
  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason as { message?: string; stack?: string } | undefined;
    void logEvent("error", r?.message ?? String(e.reason), r?.stack);
  });
}
