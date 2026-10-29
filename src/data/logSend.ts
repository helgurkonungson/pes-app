/**
 * Sends the error journal to the developer's endpoint (ADR-033): by the button in Settings → Error log,
 * or — only when the learner turned it on — automatically a little after a problem is logged.
 */
import { Capacitor } from "@capacitor/core";
import { autoBatch, autoDue, logPayload, maxId, newest, type LogMeta } from "../core/errorLog";
import type { LogEntry } from "../core/types";
import { useLang } from "../i18n";
import { db, getProfile, updateProfile } from "./db";
import { REPORT_URL } from "./endpoint";

const APP_VERSION: string = __APP_VERSION__;

function meta(): LogMeta {
  let lang = "";
  try {
    lang = useLang.getState().lang;
  } catch {
    /* i18n not ready */
  }
  return { version: APP_VERSION, platform: Capacitor.getPlatform(), ua: typeof navigator !== "undefined" ? navigator.userAgent : "", lang };
}

interface Opts {
  url?: string;
  fetcher?: typeof fetch;
  now?: Date;
}

async function post(rows: LogEntry[], auto: boolean, url: string, fetcher: typeof fetch): Promise<boolean> {
  if (!url || !rows.length) return false;
  try {
    const res = await fetcher(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(logPayload(rows, meta(), auto)) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Is there an endpoint in this build? Without it the journal goes through the share sheet. */
export const canSendLogs = (url = REPORT_URL) => !!url;

/** The button: sends the newest entries. True when the developer received them. */
export async function sendLogsNow({ url = REPORT_URL, fetcher = fetch }: Opts = {}): Promise<boolean> {
  const rows = newest(await db.logs.toArray());
  if (!(await post(rows, false, url, fetcher))) return false;
  const p = await getProfile();
  await updateProfile({ logsSentId: maxId(rows, p.logsSentId) });
  return true;
}

/** Turning automatic reports on starts from now: older entries are not sent by themselves. */
export async function setAutoReports(on: boolean): Promise<void> {
  const last = await db.logs.orderBy("id").last();
  const p = await getProfile();
  await updateProfile(on ? { autoErrorReports: true, logsSentId: Math.max(p.logsSentId ?? 0, last?.id ?? 0) } : { autoErrorReports: false });
}

/** Sends new problems when the learner allowed it; quiet otherwise. True when something was sent. */
export async function autoSendLogs({ url = REPORT_URL, fetcher = fetch, now = new Date() }: Opts = {}): Promise<boolean> {
  if (!url) return false;
  const p = await getProfile();
  if (!p.autoErrorReports || !autoDue(p.logsAutoAt, now)) return false;
  const rows = autoBatch(await db.logs.toArray(), p.logsSentId);
  if (!rows.length) return false;
  if (!(await post(rows, true, url, fetcher))) return false;
  await updateProfile({ logsSentId: maxId(rows, p.logsSentId), logsAutoAt: now.toISOString() });
  return true;
}

let timer: ReturnType<typeof setTimeout> | undefined;
/** Called after a problem is logged: waits a little so one failure's follow-ups go in the same report. */
export function scheduleAutoSend(delayMs = 20_000): void {
  if (!REPORT_URL || typeof setTimeout === "undefined") return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = undefined;
    void autoSendLogs().catch(() => undefined);
  }, delayMs);
}
