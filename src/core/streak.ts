/** Daily streaks: a day counts when at least one session is completed. */
import { addDays } from "./dates";
import type { StreakState } from "./types";

export function registerDay(state: StreakState, today: string): StreakState {
  if (state.lastDay === today) return state;
  const current = state.lastDay === addDays(today, -1) ? state.current + 1 : 1;
  return { current, best: Math.max(state.best, current), lastDay: today };
}

/** Streak to display today: still alive if the last active day was today or yesterday. */
export function liveStreak(state: StreakState, today: string): number {
  if (!state.lastDay) return 0;
  if (state.lastDay === today || state.lastDay === addDays(today, -1)) return state.current;
  return 0;
}
