/**
 * Daily streaks (ADR-029). A day counts when at least one session is completed.
 * A day without a lesson doesn't break the streak when it is a planned rest day or a
 * freeze covers it; one missed day can be won back the next day with two lessons.
 * Missed days are settled lazily by `settleStreak` (on start and before a session is closed).
 */
import { addDays, parseDay } from "./dates";
import type { StreakState } from "./types";

/** Days of `kept` history worth keeping for the calendar. */
const KEEP = 60;
/** Lessons needed on the day after one missed day to win the streak back. */
export const REPAIR_SESSIONS = 2;
/** Days away (not rest days) after which the learner is welcomed back. */
export const COMEBACK_DAYS = 2;
/** At most this many rest days a week. */
export const MAX_REST_DAYS = 2;

/** Monday-first weekday index (0 = Monday … 6 = Sunday). */
export function weekdayIndex(day: string): number {
  return (parseDay(day).getDay() + 6) % 7;
}

export function isRestDay(day: string, restDays: readonly number[] | undefined): boolean {
  return !!restDays?.includes(weekdayIndex(day));
}

/** Valid rest days: unique weekday indexes 0…6, sorted, at most MAX_REST_DAYS. */
export function normalizeRestDays(days: readonly number[]): number[] {
  return [...new Set(days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort((a, b) => a - b).slice(0, MAX_REST_DAYS);
}

/** The latest day the streak is known to be alive on (a lesson, or a settled rest/frozen day). */
function anchor(state: StreakState): string | undefined {
  const a = state.lastDay;
  const b = state.current > 0 ? state.checkedTo : undefined;
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

function trimKept(kept: Record<string, "rest" | "freeze">): Record<string, "rest" | "freeze"> {
  const days = Object.keys(kept).sort().slice(-KEEP);
  return Object.fromEntries(days.map((d) => [d, kept[d]]));
}

export interface Settled {
  state: StreakState;
  /** Freezes spent now. */
  freezesUsed: number;
}

/**
 * Settles the days between the last check and yesterday. Rest days are free; the other
 * missed days are covered by freezes only if there are enough for all of them (a freeze is
 * never wasted on a streak that breaks anyway). Otherwise the streak breaks: after exactly
 * one missed day it can be repaired today, after COMEBACK_DAYS or more the learner gets a
 * welcome-back bonus. Idempotent for the same `today`.
 */
export function settleStreak(input: StreakState, today: string, opts: { restDays?: readonly number[]; freezes: number }): Settled {
  const state: StreakState = { ...input };
  if (state.repair && state.repair.day !== today) delete state.repair;
  if (state.comeback && state.comeback.day !== today) delete state.comeback;
  if (state.frozeOn && state.frozeOn.day !== today) delete state.frozeOn;
  const yesterday = addDays(today, -1);
  const from = anchor(state);
  if (!state.lastDay || !from || from >= yesterday) return { state, freezesUsed: 0 };

  const gap: string[] = [];
  for (let d = addDays(from, 1); d <= yesterday && gap.length <= 400; d = addDays(d, 1)) gap.push(d);
  const missed = gap.filter((d) => !isRestDay(d, opts.restDays));
  state.checkedTo = yesterday;

  if (state.current > 0 && missed.length <= opts.freezes) {
    const kept = { ...(state.kept ?? {}) };
    for (const d of gap) kept[d] = isRestDay(d, opts.restDays) ? "rest" : "freeze";
    state.kept = trimKept(kept);
    if (missed.length) state.frozeOn = { day: today, n: missed.length };
    return { state, freezesUsed: missed.length };
  }

  if (state.current > 0 && missed.length === 1) state.repair = { day: today, streak: state.current };
  if (missed.length >= COMEBACK_DAYS) state.comeback = { day: today, missed: missed.length };
  state.current = 0;
  return { state, freezesUsed: 0 };
}

/** Counts today. `sessionsToday` includes the session being closed; the second one on a repair day wins the streak back. */
export function registerDay(state: StreakState, today: string, sessionsToday = 1): StreakState & { repaired?: boolean } {
  let next: StreakState & { repaired?: boolean } = state;
  if (state.lastDay !== today) {
    const continues = anchor(state) === addDays(today, -1);
    const current = continues ? state.current + 1 : 1;
    next = { ...state, current, best: Math.max(state.best, current), lastDay: today };
  }
  if (next.repair?.day === today && sessionsToday >= REPAIR_SESSIONS) {
    const current = next.repair.streak + next.current;
    const { repair: _, ...rest } = next;
    next = { ...rest, current, best: Math.max(next.best, current), repaired: true };
  }
  return next;
}

/** Streak to display today: alive if the last active (or settled) day was today or yesterday. */
export function liveStreak(state: StreakState, today: string): number {
  const a = anchor(state);
  if (!a || state.current <= 0) return 0;
  return a === today || a === addDays(today, -1) ? state.current : 0;
}

/** What the calendar shows for a past day without lessons. */
export function keptAs(state: StreakState, day: string): "rest" | "freeze" | undefined {
  return state.kept?.[day];
}
