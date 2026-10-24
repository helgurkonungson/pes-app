/**
 * What the daily reminder says and when it fires. Pure — the native scheduling lives in
 * src/native/reminders.ts.
 */
import { addDays } from "./dates";

export const DEFAULT_REMINDER_TIME = "19:00";
/** Evening nudge when a streak would break today. */
export const STREAK_RISK_TIME = "21:30";

export interface ReminderPlan {
  id: number;
  at: Date;
  kind: "daily" | "streak";
  /** Cards due on that day (all skillsets). */
  due: number;
}

/** Local Date for a day ("2026-10-24") and time ("19:00"). */
export function atLocal(day: string, time: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
}

/**
 * Reminders for the next `days` days: one daily reminder at `time` (not today if the
 * learner already studied or the time has passed) and, if a streak is running and today
 * isn't done yet, an evening "streak at risk" nudge.
 */
export function planReminders(opts: { today: string; now: Date; time: string; studiedToday: boolean; streak: number; dueOn: (day: string) => number; days?: number }): ReminderPlan[] {
  const out: ReminderPlan[] = [];
  const days = opts.days ?? 7;
  for (let i = 0; i < days; i++) {
    const day = addDays(opts.today, i);
    const at = atLocal(day, opts.time);
    if (i === 0 && (opts.studiedToday || at <= opts.now)) continue;
    out.push({ id: 1000 + i, at, kind: "daily", due: opts.dueOn(day) });
  }
  const risk = atLocal(opts.today, STREAK_RISK_TIME);
  if (opts.streak > 0 && !opts.studiedToday && risk > opts.now && atLocal(opts.today, opts.time) < risk) out.push({ id: 1100, at: risk, kind: "streak", due: opts.dueOn(opts.today) });
  return out;
}
