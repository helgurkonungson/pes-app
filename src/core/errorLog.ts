/**
 * Error journal → developer (ADR-033). Pure — unit tested. Manual sending posts the newest
 * entries; automatic sending (opt-in, off by default) posts only entries that were not sent yet,
 * never "info" lines, and at most once every ten minutes.
 */
import type { LogEntry } from "./types";

export const MANUAL_MAX = 100;
export const AUTO_MAX = 30;
export const AUTO_GAP_MS = 10 * 60_000;

export interface LogMeta {
  version: string;
  platform: string;
  ua: string;
  lang: string;
}

/** Body of POST /api/report for a journal. */
export function logPayload(rows: LogEntry[], meta: LogMeta, auto: boolean) {
  return { app: "chompbook", logs: { ...meta, auto, entries: rows.map(({ id: _id, ...r }) => r) } };
}

/** The newest `max` entries, oldest first. */
export function newest(rows: LogEntry[], max = MANUAL_MAX): LogEntry[] {
  return [...rows].sort((a, b) => (a.id ?? 0) - (b.id ?? 0)).slice(-max);
}

/** What automatic sending would post: problems logged after the last sent entry. */
export function autoBatch(rows: LogEntry[], sentId: number | undefined, max = AUTO_MAX): LogEntry[] {
  return newest(rows.filter((r) => (r.id ?? 0) > (sentId ?? 0) && r.kind !== "info"), max);
}

export function autoDue(lastAt: string | undefined, now: Date): boolean {
  if (!lastAt) return true;
  const t = Date.parse(lastAt);
  return !Number.isFinite(t) || now.getTime() - t >= AUTO_GAP_MS || t > now.getTime();
}

/** Highest id among rows (the new "sent up to" mark). */
export function maxId(rows: LogEntry[], prev?: number): number | undefined {
  return rows.reduce<number | undefined>((m, r) => (r.id !== undefined && (m === undefined || r.id > m) ? r.id : m), prev);
}
