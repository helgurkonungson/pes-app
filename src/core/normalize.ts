/**
 * Cleans AI output before it reaches the UI: assigns ids, validates answers,
 * shuffles options (models tend to put the right answer first) and trims text.
 */
import type { Difficulty, LessonContent, Mcq, OpenGrade, PlacementContent } from "./types";

/** Small deterministic PRNG so shuffles are reproducible in tests. */
export function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v.trim() : fallback);
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : []);

export function normalizeMcqs(raw: unknown, prefix: string, rand: () => number = Math.random): Mcq[] {
  if (!Array.isArray(raw)) return [];
  const out: Mcq[] = [];
  raw.forEach((r, i) => {
    const o = (r ?? {}) as Record<string, unknown>;
    const options = strArr(o.options).slice(0, 6);
    const answer = typeof o.answer === "number" ? Math.round(o.answer) : parseInt(String(o.answer), 10);
    const q = str(o.q ?? o.question);
    if (!q || options.length < 2 || !(answer >= 0 && answer < options.length)) return;
    // Fisher–Yates shuffle keeping track of the right answer
    const idx = options.map((_, k) => k);
    for (let k = idx.length - 1; k > 0; k--) {
      const j = Math.floor(rand() * (k + 1));
      [idx[k], idx[j]] = [idx[j], idx[k]];
    }
    const d = str(o.difficulty) as Difficulty;
    out.push({
      id: `${prefix}${i + 1}`,
      q,
      options: idx.map((k) => options[k]),
      answer: idx.indexOf(answer),
      explanation: str(o.explanation),
      difficulty: d === "e" || d === "m" || d === "h" ? d : "m",
      topic: str(o.topic) || undefined,
    });
  });
  return out;
}

export function normalizeLesson(raw: unknown, rand: () => number = Math.random): LessonContent {
  const o = (raw ?? {}) as Record<string, any>;
  const sections = Array.isArray(o.theory?.sections)
    ? o.theory.sections.map((s: any) => ({ heading: str(s?.heading), body: str(s?.body) })).filter((s: { body: string }) => s.body)
    : [];
  const quiz = normalizeMcqs(o.quiz, "q", rand);
  const openQ = str(o.open?.q ?? o.open?.question);
  if (!sections.length || !quiz.length || !openQ) throw new Error("Lesson is missing theory, quiz or open question.");
  return {
    title: str(o.title, "Today's lesson"),
    review: { recap: strArr(o.review?.recap).slice(0, 6), questions: normalizeMcqs(o.review?.questions, "r", rand) },
    theory: { sections, keyPoints: strArr(o.theory?.keyPoints).slice(0, 8) },
    quiz,
    open: { id: "open", q: openQ, rubric: strArr(o.open?.rubric).slice(0, 6) },
  };
}

export function normalizePlacement(raw: unknown, rand: () => number = Math.random): PlacementContent {
  const o = (raw ?? {}) as Record<string, unknown>;
  const questions = normalizeMcqs(o.questions, "p", rand);
  if (questions.length < 3) throw new Error("Placement test came back too short.");
  return { intro: str(o.intro, "A short test to find your starting point."), questions };
}

export function normalizeGrade(raw: unknown): OpenGrade {
  const o = (raw ?? {}) as Record<string, unknown>;
  const n = typeof o.score === "number" ? o.score : parseFloat(String(o.score));
  return {
    score: Number.isFinite(n) ? Math.min(10, Math.max(0, Math.round(n))) : 0,
    verdict: str(o.verdict),
    strengths: strArr(o.strengths).slice(0, 5),
    gaps: strArr(o.gaps).slice(0, 5),
    modelAnswer: str(o.modelAnswer ?? o.model_answer),
  };
}
