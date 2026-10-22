import { describe, expect, it } from "vitest";
import { BADGES, newBadges } from "./badges";
import { buildChunks, countWords, looksLikeHeading, sectionsFromPlainText } from "./chunker";
import { addDays, daysBetween, weekOf } from "./dates";
import { canAdvance, lessonPages, mistakesOf, placementPages, stepsOf, tallyLesson } from "./flow";
import { advanceCursor, clampMinutes, coverage, pickChunks, placementSize, planSession, sampleChunks } from "./planner";
import { levelFromXp, levelProgress, rankFor, scorePlacement, xpForLevel } from "./scoring";
import { compareVersions } from "./semver";
import { liveStreak, registerDay } from "./streak";
import type { Chunk, LessonContent, Mcq, SessionProgress } from "./types";

const words = (n: number, w = "word") => Array.from({ length: n }, () => w).join(" ");
const chunk = (order: number, w: number): Chunk => ({ id: `c${order}`, skillsetId: "s", sourceId: "src", order, title: `C${order}`, text: words(w), words: w });
const mcq = (id: string, answer = 0, difficulty: Mcq["difficulty"] = "m", topic = "T"): Mcq => ({ id, q: id, options: ["a", "b", "c", "d"], answer, explanation: "", difficulty, topic });

describe("dates", () => {
  it("adds days across month ends", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(daysBetween("2026-10-20", "2026-10-23")).toBe(3);
  });
  it("builds Monday-first weeks", () => {
    const w = weekOf("2026-10-23"); // Friday
    expect(w[0]).toBe("2026-10-19");
    expect(w[6]).toBe("2026-10-25");
  });
});

describe("planner", () => {
  it("scales the lesson with the portion size", () => {
    const p5 = planSession(5);
    const p60 = planSession(60);
    expect(p5.theoryWords).toBeGreaterThanOrEqual(300);
    expect(p60.theoryWords).toBeGreaterThan(p5.theoryWords * 5);
    expect(p60.quizQuestions).toBeGreaterThan(p5.quizQuestions);
    expect(p5.reviewQuestions).toBe(1);
    expect(p60.reviewQuestions).toBe(4);
    expect(p60.theoryWords).toBeLessThanOrEqual(5000);
  });
  it("clamps custom minutes", () => {
    expect(clampMinutes(1)).toBe(3);
    expect(clampMinutes(500)).toBe(120);
    expect(clampMinutes(NaN)).toBe(15);
    expect(placementSize(5)).toBe(6);
    expect(placementSize(30)).toBe(14);
  });
  it("picks consecutive chunks from the cursor", () => {
    const cs = [chunk(0, 1000), chunk(1, 1000), chunk(2, 1000), chunk(3, 1000)];
    expect(pickChunks(cs, 1, 1800).map((c) => c.order)).toEqual([1, 2]);
    expect(pickChunks(cs, 3, 5000).map((c) => c.order)).toEqual([3]);
    expect(pickChunks(cs, 4, 1000)).toEqual([]);
    // always at least one chunk, even if it is larger than the budget
    expect(pickChunks([chunk(0, 9000)], 0, 1000)).toHaveLength(1);
  });
  it("advances the cursor and reports coverage", () => {
    expect(advanceCursor(1, [chunk(1, 1), chunk(2, 1)])).toBe(3);
    expect(advanceCursor(5, [])).toBe(5);
    expect(coverage(10, 3)).toBeCloseTo(0.3);
    expect(coverage(0, 3)).toBe(0);
  });
  it("samples chunks evenly", () => {
    const cs = Array.from({ length: 20 }, (_, i) => chunk(i, 10));
    const s = sampleChunks(cs, 4).map((c) => c.order);
    expect(s).toHaveLength(4);
    expect(s[0]).toBeLessThan(5);
    expect(s[3]).toBeGreaterThan(14);
  });
});

describe("chunker", () => {
  it("detects headings", () => {
    expect(looksLikeHeading("Chapter 3 Data Quality")).toBe(true);
    expect(looksLikeHeading("Глава 4. Архитектура данных")).toBe(true);
    expect(looksLikeHeading("# Intro")).toBe(true);
    expect(looksLikeHeading("DATA GOVERNANCE")).toBe(true);
    expect(looksLikeHeading("This is a normal sentence that goes on.")).toBe(false);
  });
  it("splits plain text at headings and groups to target size", () => {
    const text = `# One\n${words(900)}\n\n# Two\n${words(900)}\n\n# Three\n${words(300)}`;
    const sections = sectionsFromPlainText(text);
    expect(sections.map((s) => s.heading)).toEqual(["One", "Two", "Three"]);
    const chunks = buildChunks(sections, "Book", 1500, 2200);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0].title).toBe("One");
    expect(chunks.every((c) => c.words <= 2200)).toBe(true);
    const total = chunks.reduce((a, c) => a + c.words, 0);
    expect(total).toBeGreaterThanOrEqual(2100);
  });
  it("splits a giant section and labels page ranges", () => {
    const pages = Array.from({ length: 6 }, (_, i) => ({ label: `p. ${i + 1}`, text: words(400) }));
    const chunks = buildChunks(pages, "PDF", 1500, 2200);
    expect(chunks[0].title).toBe("pp. 1–4");
    const giant = buildChunks([{ heading: "Huge", text: Array.from({ length: 40 }, () => words(200) + ".").join("\n\n") }], "X", 1500, 2200);
    expect(giant.length).toBeGreaterThan(3);
    expect(giant.every((c) => c.words <= 2300)).toBe(true);
    expect(countWords("a b  c\nd")).toBe(4);
  });
});

describe("scoring", () => {
  it("maps XP to levels", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(3)).toBe(300);
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(650)).toBe(4);
    const p = levelProgress(150);
    expect(p.level).toBe(2);
    expect(p.toNext).toBe(150);
    expect(p.ratio).toBeCloseTo(0.25);
    expect(rankFor(1)).toBe("Novice");
    expect(rankFor(9)).toBe("Practitioner");
  });
  it("scores a placement test by topic", () => {
    const qs = [mcq("a", 0, "e", "Governance"), mcq("b", 1, "m", "Governance"), mcq("c", 2, "h", "ML"), mcq("d", 3, "m", "ML")];
    const r = scorePlacement(qs, { a: 0, b: 1, c: 0, d: 0 }, "t");
    expect(r.score).toBe(2);
    expect(r.level).toBe("intermediate");
    expect(r.strengths).toEqual(["Governance"]);
    expect(r.gaps).toEqual(["ML"]);
  });
});

describe("streak", () => {
  it("extends on consecutive days and resets after a gap", () => {
    let s = registerDay({ current: 0, best: 0 }, "2026-10-20");
    s = registerDay(s, "2026-10-21");
    s = registerDay(s, "2026-10-21");
    expect(s.current).toBe(2);
    s = registerDay(s, "2026-10-24");
    expect(s).toEqual({ current: 1, best: 2, lastDay: "2026-10-24" });
    expect(liveStreak(s, "2026-10-25")).toBe(1);
    expect(liveStreak(s, "2026-10-26")).toBe(0);
  });
});

describe("flow", () => {
  const lesson: LessonContent = {
    title: "L",
    review: { recap: ["x"], questions: [mcq("r1", 1)] },
    theory: { sections: [{ heading: "A", body: "a" }, { heading: "B", body: "b" }], keyPoints: ["k"] },
    quiz: [mcq("q1", 0, "e"), mcq("q2", 2, "h")],
    open: { id: "o", q: "Why?", rubric: ["r"] },
  };
  it("builds pages in the session order", () => {
    const pages = lessonPages(lesson);
    expect(pages.map((p) => p.kind)).toEqual(["recap", "mcq", "theory", "theory", "mcq", "mcq", "open"]);
    expect(stepsOf(pages).map((s) => s.step)).toEqual(["review", "theory", "quiz", "open"]);
    expect(placementPages({ intro: "hi", questions: [mcq("p1")] }).map((p) => p.kind)).toEqual(["intro", "mcq"]);
  });
  it("gates progress on answers", () => {
    const pages = lessonPages(lesson);
    const prog: SessionProgress = { page: 0, mcq: {}, seconds: 0 };
    expect(canAdvance(pages[1], prog)).toBe(false);
    expect(canAdvance(pages[1], { ...prog, mcq: { r1: 0 } })).toBe(true);
    expect(canAdvance(pages[6], prog)).toBe(false);
    expect(canAdvance(pages[6], { ...prog, openAnswer: "__skipped__" })).toBe(true);
  });
  it("tallies XP and mistakes", () => {
    const prog: SessionProgress = {
      page: 6,
      mcq: { r1: 1, q1: 0, q2: 0 },
      seconds: 600,
      grade: { score: 8, verdict: "", strengths: [], gaps: [], modelAnswer: "" },
    };
    const t = tallyLesson(lesson, prog, 15, 3);
    expect(t.correct).toBe(2);
    expect(t.total).toBe(3);
    // review 5 + quiz e 8 + open 8*3=24 + completion 20 + 15 min + streak bonus 4
    expect(t.xp).toBe(5 + 8 + 24 + 20 + 15 + 4);
    expect(mistakesOf(lesson, prog).map((q) => q.id)).toEqual(["q2"]);
  });
});

describe("badges & versions", () => {
  it("awards only new badges", () => {
    const ctx = { sessionsDone: 1, placementsDone: 1, streak: 3, skillsets: 1, level: 1 };
    expect(newBadges(ctx, {})).toEqual(["baseline", "first-step", "streak-3"]);
    expect(newBadges(ctx, { baseline: "x" })).not.toContain("baseline");
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
  });
  it("compares versions", () => {
    expect(compareVersions("v0.1.10", "0.1.9")).toBe(1);
    expect(compareVersions("0.2.0", "0.2.0")).toBe(0);
    expect(compareVersions("0.1.0", "v1.0.0")).toBe(-1);
  });
});
