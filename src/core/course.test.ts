import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildCourseLesson, COURSE_FORMAT, CourseError, courseCoverage, courseModules, nextCourseLesson, parseCourse } from "./course";
import type { Mcq } from "./types";

const AT = "2026-10-23T10:00:00.000Z";
const fixture = (name: string) => readFileSync(new URL(`../../tests/fixtures/${name}`, import.meta.url), "utf8");
const v1 = () => parseCourse(fixture("sample-course.pes.json"), AT);

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (e) {
    return e instanceof CourseError ? e.code : "other";
  }
  return undefined;
}

describe("parseCourse", () => {
  it("parses the sample course", () => {
    const c = v1();
    expect(c.id).toBe("demo-course");
    expect(c.version).toBe(1);
    expect(c.language).toBe("English");
    expect(c.minutes).toBe(10);
    expect(c.lessons).toHaveLength(3);
    expect(c.importedAt).toBe(AT);
    const l = c.lessons[0];
    expect(l.quiz.map((q) => q.id)).toEqual(["demo-01-q1", "demo-01-q2", "demo-01-q3"]);
    expect(l.recall.map((q) => q.id)).toEqual(["demo-01-r1", "demo-01-r2"]);
    expect(l.open.modelAnswer).toContain("Basics");
    expect(l.open.id).toBe("demo-01-open");
  });

  it("keeps the authored option order (no reshuffle on import)", () => {
    const raw = JSON.parse(fixture("sample-course.pes.json"));
    const c = v1();
    expect(c.lessons[0].quiz[0].options).toEqual(raw.lessons[0].quiz[0].options);
    expect(c.lessons[0].quiz[0].answer).toBe(raw.lessons[0].quiz[0].answer);
  });

  it("accepts a BOM and an already-parsed object", () => {
    expect(parseCourse("﻿" + fixture("sample-course.pes.json"), AT).id).toBe("demo-course");
    expect(parseCourse(JSON.parse(fixture("sample-course.pes.json")), AT).id).toBe("demo-course");
  });

  it("rejects bad files with specific codes", () => {
    const base = JSON.parse(fixture("sample-course.pes.json"));
    expect(codeOf(() => parseCourse("{not json", AT))).toBe("not-json");
    expect(codeOf(() => parseCourse(JSON.stringify({ app: "pes" }), AT))).toBe("not-course");
    expect(codeOf(() => parseCourse({ ...base, formatVersion: 99 }, AT))).toBe("newer-format");
    expect(codeOf(() => parseCourse({ ...base, id: "" }, AT))).toBe("no-id");
    expect(codeOf(() => parseCourse({ ...base, id: "bad id with spaces" }, AT))).toBe("no-id");
    expect(codeOf(() => parseCourse({ ...base, lessons: [] }, AT))).toBe("no-lessons");
    expect(codeOf(() => parseCourse({ ...base, lessons: [base.lessons[0], base.lessons[0]] }, AT))).toBe("bad-lesson");
    const broken = structuredClone(base);
    broken.lessons[1].quiz = [];
    expect(codeOf(() => parseCourse(broken, AT))).toBe("bad-lesson");
  });

  it("drops invalid questions but keeps the lesson", () => {
    const base = JSON.parse(fixture("sample-course.pes.json"));
    base.lessons[0].quiz.push({ q: "Broken", options: ["only one"], answer: 0 });
    base.lessons[0].quiz.push({ q: "Bad index", options: ["a", "b"], answer: 5 });
    expect(parseCourse(base, AT).lessons[0].quiz).toHaveLength(3);
  });

  it("normalizes metadata", () => {
    const base = JSON.parse(fixture("sample-course.pes.json"));
    const c = parseCourse({ ...base, language: "Klingon", minutes: 999, hue: -5, version: 0, title: "" }, AT);
    expect(c.language).toBe("Source");
    expect(c.minutes).toBe(15);
    expect(c.hue).toBe(174);
    expect(c.version).toBe(1);
    expect(c.title).toBe("demo-course");
    expect(COURSE_FORMAT).toBe("pes-course");
  });
});

describe("course progress", () => {
  it("next lesson is the first not done, by id", () => {
    const c = v1();
    expect(nextCourseLesson(c, new Set())?.id).toBe("demo-01");
    expect(nextCourseLesson(c, new Set(["demo-01"]))?.id).toBe("demo-02");
    expect(nextCourseLesson(c, new Set(["demo-01", "demo-02", "demo-03"]))).toBeUndefined();
  });

  it("a newer version with an inserted lesson keeps done lessons done", () => {
    const c2 = parseCourse(fixture("sample-course-v2.pes.json"), AT);
    const done = new Set(["demo-01", "demo-02"]);
    // the inserted lesson comes right after lesson 1 and is now next
    expect(nextCourseLesson(c2, done)?.id).toBe("demo-09");
    expect(courseCoverage(c2, done)).toBeCloseTo(2 / 4);
  });

  it("coverage and modules", () => {
    const c = v1();
    expect(courseCoverage(c, new Set(["demo-01"]))).toBeCloseTo(1 / 3);
    expect(courseCoverage(undefined, new Set())).toBe(0);
    expect(courseModules(c).map((m) => [m.module, m.lessons.length])).toEqual([
      ["Module one", 2],
      ["Module two", 1],
    ]);
  });
});

describe("buildCourseLesson", () => {
  const mistake: Mcq = { id: "q4", q: "An old mistake?", options: ["a", "b"], answer: 0, explanation: "" };

  it("first lesson has no review", () => {
    const c = v1();
    const l = buildCourseLesson(c, c.lessons[0], { doneIds: new Set(), mistakes: [] });
    expect(l.mode).toBe("course");
    expect(l.courseLessonId).toBe("demo-01");
    expect(l.review.recap).toEqual([]);
    expect(l.review.questions).toEqual([]);
    expect(l.open.modelAnswer).toBeTruthy();
  });

  it("recaps the previous lesson, asks its recall questions and recent mistakes", () => {
    const c = v1();
    const l = buildCourseLesson(c, c.lessons[1], { doneIds: new Set(["demo-01"]), mistakes: [mistake] });
    expect(l.review.recap).toEqual(c.lessons[0].theory.keyPoints);
    expect(l.review.questions.map((q) => q.q)).toEqual(["An old mistake?", "Recall Basics 1?", "Recall Basics 2?"]);
    const ids = [...l.review.questions, ...l.quiz].map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("does not recap a previous lesson that wasn't done", () => {
    const c = v1();
    const l = buildCourseLesson(c, c.lessons[1], { doneIds: new Set(), mistakes: [] });
    expect(l.review.recap).toEqual([]);
  });

  it("caps and de-duplicates review questions", () => {
    const c = v1();
    const dup = { ...mistake, id: "x1" };
    const l = buildCourseLesson(c, c.lessons[1], { doneIds: new Set(["demo-01"]), mistakes: [mistake, dup], maxReview: 2 });
    expect(l.review.questions).toHaveLength(2);
    expect(l.review.questions.filter((q) => q.q === mistake.q)).toHaveLength(1);
  });
});
