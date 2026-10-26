import { describe, expect, it } from "vitest";
import { buyFreeze, canBuyFreeze, cleanWeekToAward, ENERGY, FREEZE_COST, MAX_FREEZES, sessionEnergy, totalEnergy } from "./energy";
import { isRestDay, liveStreak, normalizeRestDays, registerDay, settleStreak, weekdayIndex } from "./streak";
import type { StreakState } from "./types";

// 2026-10-19 is a Monday
const MON = "2026-10-19";
const day = (n: number) => {
  const d = new Date(2026, 9, 19 + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const streakOf = (current: number, lastDay: string): StreakState => ({ current, best: current, lastDay });

describe("rest days", () => {
  it("weekday indexes are Monday-first", () => {
    expect(weekdayIndex(MON)).toBe(0);
    expect(weekdayIndex(day(6))).toBe(6);
    expect(isRestDay(day(5), [5, 6])).toBe(true);
    expect(isRestDay(day(4), [5, 6])).toBe(false);
  });
  it("normalizes to at most two unique valid days", () => {
    expect(normalizeRestDays([6, 5, 5, 9, -1, 2])).toEqual([2, 5]);
  });
});

describe("settleStreak", () => {
  it("does nothing while the streak is fresh", () => {
    const s = streakOf(4, day(0));
    expect(settleStreak(s, day(1), { freezes: 0 })).toEqual({ state: s, freezesUsed: 0 });
  });

  it("a planned rest day keeps the streak for free", () => {
    // studied Friday, Saturday is a rest day, opened on Sunday
    const r = settleStreak(streakOf(5, day(4)), day(6), { restDays: [5], freezes: 0 });
    expect(r.freezesUsed).toBe(0);
    expect(r.state.current).toBe(5);
    expect(r.state.kept).toEqual({ [day(5)]: "rest" });
    expect(liveStreak(r.state, day(6))).toBe(5);
    // a lesson on Sunday continues it
    expect(registerDay(r.state, day(6)).current).toBe(6);
  });

  it("a freeze covers a missed day and is reported once", () => {
    const r = settleStreak(streakOf(5, day(0)), day(2), { freezes: 1 });
    expect(r.freezesUsed).toBe(1);
    expect(r.state.current).toBe(5);
    expect(r.state.kept).toEqual({ [day(1)]: "freeze" });
    expect(r.state.frozeOn).toEqual({ day: day(2), n: 1 });
    // settling again the same day changes nothing and spends nothing
    const again = settleStreak(r.state, day(2), { freezes: 0 });
    expect(again).toEqual({ state: r.state, freezesUsed: 0 });
    // the notice disappears the next day
    const next = settleStreak(registerDay(r.state, day(2)), day(3), { freezes: 0 });
    expect(next.state.frozeOn).toBeUndefined();
  });

  it("never wastes freezes on a streak that breaks anyway", () => {
    const r = settleStreak(streakOf(9, day(0)), day(4), { freezes: 2 }); // 3 missed days
    expect(r.freezesUsed).toBe(0);
    expect(r.state.current).toBe(0);
    expect(r.state.repair).toBeUndefined();
    expect(r.state.comeback).toEqual({ day: day(4), missed: 3 });
    expect(liveStreak(r.state, day(4))).toBe(0);
    expect(r.state.best).toBe(9);
  });

  it("rest days don't count as missed", () => {
    // studied Thursday; Fri missed; Sat+Sun rest; opened Monday → one missed day → repair
    const r = settleStreak(streakOf(6, day(3)), day(7), { restDays: [5, 6], freezes: 0 });
    expect(r.state.current).toBe(0);
    expect(r.state.repair).toEqual({ day: day(7), streak: 6 });
    expect(r.state.comeback).toBeUndefined();
  });

  it("one missed day can be won back with two lessons the next day", () => {
    const broken = settleStreak(streakOf(12, day(0)), day(2), { freezes: 0 }).state;
    expect(broken.repair).toEqual({ day: day(2), streak: 12 });
    const first = registerDay(broken, day(2), 1);
    expect(first.current).toBe(1);
    expect(first.repaired).toBeUndefined();
    const second = registerDay(first, day(2), 2);
    expect(second.repaired).toBe(true);
    expect(second.current).toBe(13);
    expect(second.best).toBe(13);
    expect(second.repair).toBeUndefined();
    expect(registerDay(second, day(3)).current).toBe(14);
  });

  it("the repair offer expires after its day", () => {
    const broken = settleStreak(streakOf(12, day(0)), day(2), { freezes: 0 }).state;
    const later = settleStreak(broken, day(3), { freezes: 0 }).state;
    expect(later.repair).toBeUndefined();
    expect(registerDay(registerDay(later, day(3), 1), day(3), 2).current).toBe(1);
  });

  it("a first-ever learner has nothing to settle", () => {
    expect(settleStreak({ current: 0, best: 0 }, day(3), { freezes: 2 }).freezesUsed).toBe(0);
  });

  it("keeps the old behaviour of registerDay", () => {
    let s: StreakState = { current: 0, best: 0 };
    s = registerDay(s, day(1));
    s = registerDay(s, day(2));
    expect(s.current).toBe(2);
    s = registerDay(s, day(5));
    expect(s.current).toBe(1);
    expect(s.best).toBe(2);
  });
});

describe("energy", () => {
  const base = { kind: "lesson" as const, correct: 3, total: 5, reviewCorrect: 2, streakBefore: 2, streakAfter: 3, comeback: false, cleanWeek: false };

  it("pays for a session and right review answers", () => {
    expect(sessionEnergy(base)).toEqual([
      { reason: "session", amount: ENERGY.session },
      { reason: "review", amount: 2 },
    ]);
  });

  it("pays extra for a perfect lesson, passed tests, milestones, comeback and a clean week", () => {
    const g = sessionEnergy({ ...base, correct: 5, total: 5, checkpoint: { correct: 4, total: 5 }, streakBefore: 6, streakAfter: 7, comeback: true, cleanWeek: true });
    expect(g.map((x) => x.reason)).toEqual(["session", "review", "perfect", "checkpoint", "streak", "comeback", "week"]);
    expect(totalEnergy(g)).toBe(5 + 2 + 5 + 5 + 20 + 10 + 15);
  });

  it("a failed checkpoint or final pays only the session", () => {
    expect(sessionEnergy({ ...base, reviewCorrect: 0, checkpoint: { correct: 1, total: 5 } })).toEqual([{ reason: "session", amount: 5 }]);
    expect(sessionEnergy({ ...base, kind: "final", correct: 7, total: 15, reviewCorrect: 0 })).toEqual([{ reason: "session", amount: 5 }]);
    expect(sessionEnergy({ ...base, kind: "final", correct: 12, total: 15, reviewCorrect: 0 }).map((x) => x.reason)).toEqual(["session", "final"]);
  });

  it("a repaired streak doesn't pay milestones again", () => {
    // repair 29 → 30 crosses 30 once; 6 → 31 would cross 7 and 30
    expect(totalEnergy(sessionEnergy({ ...base, reviewCorrect: 0, streakBefore: 29, streakAfter: 30 }))).toBe(5 + 50);
    expect(totalEnergy(sessionEnergy({ ...base, reviewCorrect: 0, streakBefore: 30, streakAfter: 31 }))).toBe(5);
  });

  it("freezes cost energy and are capped", () => {
    expect(canBuyFreeze(FREEZE_COST - 1, 0)).toBe(false);
    expect(buyFreeze(FREEZE_COST + 3, 0)).toEqual({ energy: 3, freezes: 1 });
    expect(buyFreeze(500, MAX_FREEZES)).toBeNull();
  });
});

describe("clean week", () => {
  const today = day(9); // Wednesday of the next week
  const all = (from: number, to: number) => new Set(Array.from({ length: to - from + 1 }, (_, i) => day(from + i)));

  it("pays for last week when every day had a lesson", () => {
    expect(cleanWeekToAward(today, all(0, 6), undefined, undefined)).toBe(MON);
  });
  it("rest days count, missed days don't", () => {
    const active = all(0, 4); // Mon–Fri
    expect(cleanWeekToAward(today, active, [5, 6], undefined)).toBe(MON);
    expect(cleanWeekToAward(today, active, [6], undefined)).toBeNull();
  });
  it("pays once", () => {
    expect(cleanWeekToAward(today, all(0, 6), undefined, MON)).toBeNull();
  });
});
