/**
 * Energy (ADR-029): one currency that ties learning, streaks and missed days together.
 * Earned by finishing sessions, reviewing, perfect lessons, passed tests, streak milestones,
 * a clean week and coming back after a break; spent on streak freezes. When the hosted AI
 * arrives it will also pay for AI actions there — never for the learner's own key. Pure.
 */
import { addDays, weekOf } from "./dates";
import { isRestDay } from "./streak";
import type { EnergyReason } from "./types";

export const ENERGY = {
  session: 5,
  reviewCorrect: 1,
  perfect: 5,
  checkpoint: 5,
  final: 15,
  comeback: 10,
  cleanWeek: 15,
  /** A passed test: at least this share right. */
  passShare: 0.7,
  milestones: [
    [7, 20],
    [30, 50],
    [100, 100],
  ] as [number, number][],
} as const;

export const FREEZE_COST = 50;
export const MAX_FREEZES = 2;

export interface EnergyGain {
  reason: EnergyReason;
  amount: number;
}

export interface SessionEnergyInput {
  kind: "placement" | "lesson" | "final";
  correct: number;
  total: number;
  /** Right answers in the lesson's review (spaced-repetition cards). */
  reviewCorrect: number;
  checkpoint?: { correct: number; total: number };
  /** Streak before and after this session (milestones reached in between pay once). */
  streakBefore: number;
  streakAfter: number;
  comeback: boolean;
  cleanWeek: boolean;
}

const passed = (c: number, t: number) => t > 0 && c / t >= ENERGY.passShare;

export function sessionEnergy(x: SessionEnergyInput): EnergyGain[] {
  const out: EnergyGain[] = [{ reason: "session", amount: ENERGY.session }];
  if (x.reviewCorrect > 0) out.push({ reason: "review", amount: x.reviewCorrect * ENERGY.reviewCorrect });
  if (x.kind === "lesson" && x.total >= 3 && x.correct === x.total) out.push({ reason: "perfect", amount: ENERGY.perfect });
  if (x.checkpoint && passed(x.checkpoint.correct, x.checkpoint.total)) out.push({ reason: "checkpoint", amount: ENERGY.checkpoint });
  if (x.kind === "final" && passed(x.correct, x.total)) out.push({ reason: "final", amount: ENERGY.final });
  const streak = ENERGY.milestones.filter(([m]) => x.streakBefore < m && x.streakAfter >= m).reduce((a, [, e]) => a + e, 0);
  if (streak) out.push({ reason: "streak", amount: streak });
  if (x.comeback) out.push({ reason: "comeback", amount: ENERGY.comeback });
  if (x.cleanWeek) out.push({ reason: "week", amount: ENERGY.cleanWeek });
  return out;
}

export function totalEnergy(gains: readonly EnergyGain[] | undefined): number {
  return (gains ?? []).reduce((a, g) => a + g.amount, 0);
}

export function canBuyFreeze(energy: number, freezes: number): boolean {
  return energy >= FREEZE_COST && freezes < MAX_FREEZES;
}

/** Balance after buying a freeze, or null when it isn't possible. */
export function buyFreeze(energy: number, freezes: number): { energy: number; freezes: number } | null {
  return canBuyFreeze(energy, freezes) ? { energy: energy - FREEZE_COST, freezes: freezes + 1 } : null;
}

/**
 * Monday of last week if it was clean — every day a lesson or a planned rest day (a freeze
 * doesn't count) — and hasn't paid yet; otherwise null.
 */
export function cleanWeekToAward(today: string, activeDays: ReadonlySet<string>, restDays: readonly number[] | undefined, lastAwarded: string | undefined): string | null {
  const monday = weekOf(addDays(today, -7))[0];
  if (lastAwarded && lastAwarded >= monday) return null;
  const clean = weekOf(monday).every((d) => activeDays.has(d) || isRestDay(d, restDays));
  return clean ? monday : null;
}
