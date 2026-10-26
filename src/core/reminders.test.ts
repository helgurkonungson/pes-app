import { describe, expect, it } from "vitest";
import { atLocal, planReminders } from "./reminders";

const base = { today: "2026-10-24", time: "19:00", streak: 0, dueOn: (d: string) => (d === "2026-10-25" ? 3 : 0) };

describe("planReminders", () => {
  it("a week of daily reminders, today's included while its time is ahead", () => {
    const plan = planReminders({ ...base, now: atLocal("2026-10-24", "10:00"), studiedToday: false });
    expect(plan.map((p) => p.id)).toEqual([1000, 1001, 1002, 1003, 1004, 1005, 1006]);
    expect(plan[0].at.getHours()).toBe(19);
    expect(plan[1].due).toBe(3);
  });
  it("skips today when already studied or the time has passed", () => {
    expect(planReminders({ ...base, now: atLocal("2026-10-24", "10:00"), studiedToday: true })[0].id).toBe(1001);
    expect(planReminders({ ...base, now: atLocal("2026-10-24", "20:00"), studiedToday: false })[0].id).toBe(1001);
  });
  it("adds an evening streak nudge only when a streak would break today", () => {
    const at = (studiedToday: boolean, streak: number, now = "20:00") => planReminders({ ...base, streak, studiedToday, now: atLocal("2026-10-24", now) }).filter((p) => p.kind === "streak");
    expect(at(false, 4)).toHaveLength(1);
    expect(at(true, 4)).toHaveLength(0);
    expect(at(false, 0)).toHaveLength(0);
    expect(at(false, 4, "22:00")).toHaveLength(0);
  });
  it("no reminders on rest days (2026-10-24 is a Saturday)", () => {
    const plan = planReminders({ ...base, streak: 4, now: atLocal("2026-10-24", "10:00"), studiedToday: false, restDays: [5, 6] });
    expect(plan.map((p) => p.id)).toEqual([1002, 1003, 1004, 1005, 1006]);
  });
  it("no streak pressure for children and teens", () => {
    const nudge = (ageGroup?: "child" | "teen" | "adult") => planReminders({ ...base, streak: 4, studiedToday: false, now: atLocal("2026-10-24", "20:00"), ageGroup }).some((p) => p.kind === "streak");
    expect([nudge(), nudge("adult"), nudge("teen"), nudge("child")]).toEqual([true, true, false, false]);
  });
});
