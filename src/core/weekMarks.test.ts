import { describe, expect, it } from "vitest";
import { weekOf } from "./dates";
import { weekMarks } from "./streak";
import type { StreakState } from "./types";

describe("Home week marks (1.1.0)", () => {
  // Wednesday 2026-11-04; the week runs Mon 11-02 … Sun 11-08
  const today = "2026-11-04";
  const week = weekOf(today);
  const state = { current: 3, best: 3, lastDay: "2026-11-03", kept: { "2026-11-02": "freeze" } } as unknown as StreakState;

  it("marks lessons, kept days, missed days, today and days to come", () => {
    expect(weekMarks(week, today, new Set(["2026-11-03"]), state)).toEqual(["freeze", "done", "today", "future", "future", "future", "future"]);
  });

  it("planned rest days show as rest, past or future; a lesson on a rest day still counts", () => {
    const s = { current: 0, best: 0 } as unknown as StreakState;
    // rest days: Monday (0) and Saturday (5)
    expect(weekMarks(week, today, new Set(), s, [0, 5])).toEqual(["rest", "missed", "today", "future", "future", "rest", "future"]);
    expect(weekMarks(week, today, new Set(["2026-11-02"]), s, [0])[0]).toBe("done");
  });
});
