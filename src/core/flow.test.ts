import { describe, expect, it } from "vitest";
import { canAdvance, lessonPages, mistakesOf, placementPages, stepsOf, tallyLesson } from "./flow";
import { XP } from "./scoring";
import type { LessonContent, SessionProgress } from "./types";

const lesson: LessonContent = {
  title: "L",
  review: { recap: ["a"], questions: [{ id: "rv1", q: "R?", options: ["x", "y"], answer: 0, explanation: "" }] },
  theory: { sections: [{ heading: "H1", body: "B1" }, { heading: "H2", body: "B2" }], keyPoints: ["k"] },
  quiz: [
    { id: "q1", q: "Q1?", options: ["a", "b", "c", "d"], answer: 1, explanation: "", difficulty: "h" },
    { id: "q2", q: "Q2?", options: ["a", "b", "c", "d"], answer: 2, explanation: "", difficulty: "e" },
  ],
  open: { id: "open", q: "Why?", rubric: ["r1"] },
};
const progress = (p: Partial<SessionProgress>): SessionProgress => ({ page: 0, mcq: {}, seconds: 0, ...p });

describe("flow", () => {
  it("pages follow review → theory → quiz → open, key points on the last theory page", () => {
    const pages = lessonPages(lesson);
    expect(pages.map((p) => p.kind)).toEqual(["recap", "mcq", "theory", "theory", "mcq", "mcq", "open"]);
    expect(stepsOf(pages).map((s) => s.step)).toEqual(["review", "theory", "quiz", "open"]);
    const theory = pages.filter((p) => p.kind === "theory");
    expect(theory[0].kind === "theory" && theory[0].keyPoints).toBeFalsy();
    expect(theory[1].kind === "theory" && theory[1].keyPoints).toEqual(["k"]);
  });
  it("lessons without review start with theory", () => {
    const pages = lessonPages({ ...lesson, review: { recap: [], questions: [] } });
    expect(pages[0].kind).toBe("theory");
  });
  it("placement pages start with an intro", () => {
    const pages = placementPages({ intro: "Hi", questions: lesson.quiz });
    expect(pages.map((p) => p.kind)).toEqual(["intro", "mcq", "mcq"]);
  });
  it("can't skip unanswered questions or the open question", () => {
    const pages = lessonPages(lesson);
    expect(canAdvance(pages[1], progress({}))).toBe(false);
    expect(canAdvance(pages[1], progress({ mcq: { rv1: 1 } }))).toBe(true);
    const open = pages[pages.length - 1];
    expect(canAdvance(open, progress({}))).toBe(false);
    expect(canAdvance(open, progress({ openAnswer: "__skipped__" }))).toBe(true);
    expect(canAdvance(open, progress({ grade: { score: 5, verdict: "", strengths: [], gaps: [], modelAnswer: "", self: true } }))).toBe(true);
  });
  it("self-checked answers earn less XP than AI-graded ones", () => {
    const grade = { score: 10, verdict: "", strengths: [], gaps: [], modelAnswer: "" };
    const ai = tallyLesson(lesson, progress({ grade }), 15, 1).xp;
    const self = tallyLesson(lesson, progress({ grade: { ...grade, self: true } }), 15, 1).xp;
    expect(ai - self).toBe(10 * (XP.openPerPoint - XP.openSelfPerPoint));
  });
  it("tallies correct answers and collects mistakes", () => {
    const p = progress({ mcq: { rv1: 0, q1: 1, q2: 0 } });
    const t = tallyLesson(lesson, p, 15, 1);
    expect([t.correct, t.total, t.reviewCorrect, t.quizCorrect]).toEqual([2, 3, 1, 1]);
    expect(mistakesOf(lesson, p).map((q) => q.id)).toEqual(["q2"]);
    // "I don't know" (-1) counts as a mistake
    expect(mistakesOf(lesson, progress({ mcq: { q1: -1 } })).map((q) => q.id)).toEqual(["q1"]);
  });
});
