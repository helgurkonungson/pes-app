import { describe, expect, it } from "vitest";
import { ageGroupFromYear, birthYears, meetsMinAge } from "./age";

const now = new Date(2026, 9, 25);

describe("age screen", () => {
  it("bands a birth year conservatively", () => {
    expect(ageGroupFromYear(2007, now)).toBe("adult"); // 18 or 19
    expect(ageGroupFromYear(2008, now)).toBe("teen"); // 17 or 18 → treated as 17
    expect(ageGroupFromYear(2012, now)).toBe("teen");
    expect(ageGroupFromYear(2013, now)).toBe("child");
  });
  it("checks a provider's minimum age", () => {
    expect(meetsMinAge("adult", 18)).toBe(true);
    expect(meetsMinAge("teen", 18)).toBe(false);
    expect(meetsMinAge("teen", 13)).toBe(true);
    expect(meetsMinAge("child", 13)).toBe(false);
    expect(meetsMinAge(undefined, 13)).toBe(false);
  });
  it("offers 100 years, newest first", () => {
    const y = birthYears(now);
    expect(y[0]).toBe(2026);
    expect(y).toHaveLength(100);
  });
});
