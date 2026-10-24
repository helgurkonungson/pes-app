import { describe, expect, it } from "vitest";
import { buildCoursePlacement, coveredLessonIds, nextCourseLesson } from "./course";
import { needsPlacement, scorePlacement, skippedPlacement } from "./scoring";
import type { Course, Mcq } from "./types";

const q = (id: string, ref?: string, topic = "T"): Mcq => ({ id, q: id, options: ["a", "b", "c", "d"], answer: 0, explanation: "", topic, ref });

describe("placement", () => {
  it("material is known only when every question about it was right", () => {
    const qs = [q("1", "A"), q("2", "A"), q("3", "B"), q("4", "C"), q("5")];
    const r = scorePlacement(qs, { "1": 0, "2": 0, "3": 1, "5": 0 }, "x");
    expect(r.known).toEqual(["A"]);
    expect(r.score).toBe(3);
  });
  it("skipping = beginner, nothing known", () => {
    expect(skippedPlacement("x")).toMatchObject({ level: "beginner", known: [], skipped: true, total: 0 });
  });
  it("every skillset starts with the test; old auto-skips get it while no lesson is done", () => {
    expect(needsPlacement({ lessonsDone: 0 })).toBe(true);
    expect(needsPlacement({ lessonsDone: 0, placementSkipped: true })).toBe(true);
    expect(needsPlacement({ lessonsDone: 2, placementSkipped: true })).toBe(false);
    expect(needsPlacement({ lessonsDone: 0, placement: skippedPlacement("x") })).toBe(false);
  });
  it("course test: one (hardest) question per lesson, spread over the course; known lessons are skipped", () => {
    const lesson = (i: number) => ({ id: `l${i}`, title: `L${i}`, sources: [], theory: { sections: [], keyPoints: [] }, quiz: [{ ...q(`e${i}`), difficulty: "e" as const }, { ...q(`h${i}`), difficulty: "h" as const }], recall: [], open: { id: "o", q: "?", rubric: [] } });
    const course = { id: "c", version: 1, title: "C", description: "", language: "English", goal: "", minutes: 10, hue: 1, lessons: Array.from({ length: 20 }, (_, i) => lesson(i)), importedAt: "x" } as Course;
    const p = buildCoursePlacement(course, 10, "intro")!;
    expect(p.questions).toHaveLength(10);
    expect(p.questions[0]).toMatchObject({ q: "h1", ref: "l1", topic: "L1", id: "p1" });
    expect(new Set(p.questions.map((x) => x.ref)).size).toBe(10);
    expect(nextCourseLesson(course, coveredLessonIds(new Set(), ["l0", "l1"]))?.id).toBe("l2");
    expect(buildCoursePlacement({ ...course, lessons: course.lessons.slice(0, 2) }, 10, "i")).toBeNull();
  });
});
