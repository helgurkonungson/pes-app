import { describe, expect, it } from "vitest";
import { addDays, daysBetween, lastNDays, longDate, monthLabel, shortDate, weekdayLetter, weekOf } from "./dates";

describe("dates", () => {
  it("month label uses the nominative in Russian", () => {
    expect(monthLabel("2026-10-23", "ru-RU")).toBe("Октябрь 2026");
    expect(monthLabel("2026-03-01", "ru-RU")).toBe("Март 2026");
    expect(monthLabel("2026-10-23", "en-GB")).toBe("October 2026");
  });
  it("weekday letters are Monday-first", () => {
    expect(Array.from({ length: 7 }, (_, i) => weekdayLetter(i, "en-GB")).join("")).toBe("MTWTFSS");
    expect(weekdayLetter(0, "ru-RU")).toBe("П");
    expect(weekdayLetter(6, "ru-RU")).toBe("В");
  });
  it("short and long dates", () => {
    expect(shortDate("2026-10-23", "en-GB")).toBe("23 Oct");
    expect(shortDate("2026-10-23", "ru-RU")).toMatch(/^23 окт/);
    expect(longDate("2026-10-23", "ru-RU")).toBe("Пятница, 23 октября");
  });
  it("calendar arithmetic across month and DST boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
    expect(daysBetween("2026-02-27", "2026-03-01")).toBe(2);
    expect(weekOf("2026-10-23")[0]).toBe("2026-10-19");
    expect(lastNDays(3, "2026-01-01")).toEqual(["2025-12-30", "2025-12-31", "2026-01-01"]);
  });
});
