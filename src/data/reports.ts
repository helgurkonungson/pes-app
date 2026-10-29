/**
 * Lesson reports: saved on the phone first (never lost), then delivered to the developer —
 * silently to the report endpoint when the build has one (VITE_REPORT_URL), otherwise as a
 * ready e-mail to support@chompbook.online that the learner sends from their mail app.
 */
import { nowIso } from "../core/ids";
import { DEFAULT_REPORT_EMAIL, reportMailto, reportsToText } from "../core/report";
import type { LessonReport } from "../core/types";
import { shareText } from "../native/share";
import { db } from "./db";
import { REPORT_EMAIL_OVERRIDE, REPORT_URL } from "../build";
import { redact } from "./logs";

export { REPORT_URL };
export const REPORT_EMAIL: string = REPORT_EMAIL_OVERRIDE || DEFAULT_REPORT_EMAIL;

/** Saves the report and tries to deliver it. Returns whether it already reached the developer. */
export async function submitReport(r: LessonReport): Promise<{ id: number; sent: boolean }> {
  const clean: LessonReport = { ...r, comment: r.comment ? redact(r.comment) : undefined, excerpt: redact(r.excerpt) };
  const id = await db.reports.add(clean);
  const sent = await deliver([{ ...clean, id }]);
  return { id, sent };
}

/** POSTs reports to the endpoint; marks the delivered ones. False when there is no endpoint or it failed. */
export async function deliver(reports: LessonReport[], fetcher: typeof fetch = fetch): Promise<boolean> {
  if (!REPORT_URL || !reports.length) return false;
  try {
    const res = await fetcher(REPORT_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ app: "chompbook", reports: reports.map(({ id: _id, ...r }) => r) }),
    });
    if (!res.ok) return false;
    const at = nowIso();
    await Promise.all(reports.filter((r) => r.id !== undefined).map((r) => db.reports.update(r.id!, { sentAt: at })));
    return true;
  } catch {
    return false;
  }
}

/** Retries reports that never reached the endpoint (called at start). */
export async function retryUnsent(): Promise<void> {
  if (!REPORT_URL) return;
  const rows = (await db.reports.toArray()).filter((r) => !r.sentAt);
  if (rows.length) await deliver(rows);
}

/**
 * Opens the mail app with the report(s) filled in, addressed to support. On Android the WebView
 * hands `mailto:` to the mail app. Without an address (never in practice) the share sheet is used.
 */
export async function shareReports(reports: LessonReport[], title: string): Promise<void> {
  const text = reportsToText(reports);
  try {
    if (REPORT_EMAIL) {
      window.location.href = reportMailto(REPORT_EMAIL, title, text);
      return;
    }
    await shareText(title, text);
  } catch {
    /* no mail app / share sheet closed */
  }
}
