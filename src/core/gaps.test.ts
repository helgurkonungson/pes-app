import { describe, expect, it } from "vitest";
import { CLOSE_AT, gapsForNextLesson, MAX_TRIES, openGaps, type GapLesson } from "./gaps";
import type { OpenGrade } from "./types";

const grade = (score: number, gaps: string[], self = false): OpenGrade => ({ score, verdict: "v", strengths: [], gaps, modelAnswer: "", self });
const at = (n: number) => `2026-10-${String(10 + n).padStart(2, "0")}T10:00:00.000Z`;

describe("open-answer gaps", () => {
  it("collects gaps from graded answers, newest first for the next lesson", () => {
    const lessons: GapLesson[] = [
      { finishedAt: at(1), grade: grade(5, ["You didn't name the data owner", "No example"]) },
      { finishedAt: at(2), grade: grade(6, ["Missed the steward's role"]) },
    ];
    expect(openGaps(lessons).map((g) => g.text)).toEqual(["You didn't name the data owner", "No example", "Missed the steward's role"]);
    expect(gapsForNextLesson(lessons)).toEqual(["Missed the steward's role", "No example", "You didn't name the data owner"]);
    expect(gapsForNextLesson(lessons, 2)).toEqual(["Missed the steward's role", "No example"]);
  });

  it("self-checks count too (unticked rubric points); a perfect score adds nothing", () => {
    expect(gapsForNextLesson([{ finishedAt: at(1), grade: grade(5, ["Point B"], true) }])).toEqual(["Point B"]);
    expect(gapsForNextLesson([{ finishedAt: at(1), grade: grade(10, ["nitpick"]) }])).toEqual([]);
  });

  it("a revisiting lesson answered well closes the gaps it revisited", () => {
    const lessons: GapLesson[] = [
      { finishedAt: at(1), grade: grade(4, ["Gap A", "Gap B"]) },
      { finishedAt: at(2), revisit: ["gap a"], grade: grade(CLOSE_AT, []) },
    ];
    expect(gapsForNextLesson(lessons)).toEqual(["Gap B"]);
  });

  it("a weak or skipped answer keeps the gap; it is dropped after MAX_TRIES revisits", () => {
    const lessons: GapLesson[] = [{ finishedAt: at(1), grade: grade(3, ["Gap A"]) }];
    for (let i = 0; i < MAX_TRIES - 1; i++) {
      lessons.push({ finishedAt: at(2 + i), revisit: ["Gap A"], grade: i === 0 ? undefined : grade(CLOSE_AT - 1, []) });
      expect(gapsForNextLesson(lessons)).toEqual(["Gap A"]);
    }
    lessons.push({ finishedAt: at(9), revisit: ["Gap A"], grade: grade(2, []) });
    expect(gapsForNextLesson(lessons)).toEqual([]);
  });

  it("ignores duplicates, junk and order of input; keeps the newest eight", () => {
    const many = Array.from({ length: 12 }, (_, i) => `Gap ${i}`);
    const lessons: GapLesson[] = [
      { finishedAt: at(2), grade: grade(5, many) },
      { finishedAt: at(1), grade: grade(5, ["  gap   0 ", "", "x", 42 as unknown as string]) },
    ];
    const open = openGaps(lessons).map((g) => g.text);
    expect(open).toHaveLength(8);
    expect(open[0]).toBe("Gap 4"); // "gap 0" came first and "Gap 0" is its duplicate
    expect(open.at(-1)).toBe("Gap 11");
    expect(gapsForNextLesson([{ finishedAt: at(1), grade: grade(5, ["a".repeat(500)]) }])[0].length).toBeLessThanOrEqual(220);
  });
});
