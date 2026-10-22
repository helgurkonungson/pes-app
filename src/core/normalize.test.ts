import { describe, expect, it } from "vitest";
import { normalizeGrade, normalizeLesson, normalizeMcqs, normalizePlacement, rng } from "./normalize";

describe("normalize", () => {
  it("keeps the right answer after shuffling", () => {
    const raw = [{ q: "2+2?", options: ["4", "3", "5", "22"], answer: 0, explanation: "math", difficulty: "e" }];
    for (let seed = 1; seed < 30; seed++) {
      const [m] = normalizeMcqs(raw, "q", rng(seed));
      expect(m.options[m.answer]).toBe("4");
      expect(m.id).toBe("q1");
    }
  });
  it("drops broken questions", () => {
    const raw = [{ q: "", options: ["a", "b"], answer: 0 }, { q: "x", options: ["a"], answer: 0 }, { q: "y", options: ["a", "b"], answer: 5 }, { q: "ok", options: ["a", "b"], answer: "1" }];
    const out = normalizeMcqs(raw, "q", rng(1));
    expect(out).toHaveLength(1);
    expect(out[0].options[out[0].answer]).toBe("b");
    expect(out[0].difficulty).toBe("m");
  });
  it("validates lessons", () => {
    const ok = normalizeLesson(
      {
        title: "T",
        review: { recap: ["a"], questions: [] },
        theory: { sections: [{ heading: "H", body: "B" }], keyPoints: ["k"] },
        quiz: [{ q: "q", options: ["a", "b", "c", "d"], answer: 2, explanation: "e" }],
        open: { q: "Why?", rubric: ["r"] },
      },
      rng(3),
    );
    expect(ok.open.id).toBe("open");
    expect(() => normalizeLesson({ title: "T" })).toThrow();
    expect(() => normalizePlacement({ questions: [] })).toThrow();
  });
  it("clamps grades", () => {
    expect(normalizeGrade({ score: 14 }).score).toBe(10);
    expect(normalizeGrade({ score: "7.6", model_answer: "m" })).toMatchObject({ score: 8, modelAnswer: "m" });
  });
});
