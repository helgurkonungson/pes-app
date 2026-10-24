/**
 * Session flow: flattens generated content into pages
 * (review → theory → quiz → open question) and computes the result.
 */
import { quizXp, streakBonus, XP } from "./scoring";
import type { LessonContent, Mcq, PlacementContent, SessionProgress, TheorySection } from "./types";

export type StepKey = "review" | "theory" | "quiz" | "open" | "placement";

export type Page =
  | { kind: "recap"; step: "review"; recap: string[] }
  | { kind: "mcq"; step: "review" | "quiz" | "placement"; mcq: Mcq; index: number; of: number }
  | { kind: "theory"; step: "theory"; section: TheorySection; index: number; of: number; keyPoints?: string[] }
  | { kind: "open"; step: "open"; q: string; rubric: string[] }
  | { kind: "intro"; step: "placement"; text: string; count: number }
  /** The rest of the lesson is still being written. */
  | { kind: "pending"; step: "theory" | "quiz" };

export function lessonPages(l: LessonContent): Page[] {
  const pages: Page[] = [];
  if (l.review.recap.length) pages.push({ kind: "recap", step: "review", recap: l.review.recap });
  l.review.questions.forEach((mcq, i) => pages.push({ kind: "mcq", step: "review", mcq, index: i, of: l.review.questions.length }));
  const parts = Math.max(l.theory.sections.length, l.building?.sections ?? 0);
  const allParts = l.theory.sections.length >= parts;
  l.theory.sections.forEach((section, i) =>
    pages.push({
      kind: "theory",
      step: "theory",
      section,
      index: i,
      of: parts,
      keyPoints: allParts && i === l.theory.sections.length - 1 ? l.theory.keyPoints : undefined,
    }),
  );
  // a lesson still being written ends, for now, at a page that waits for the next part
  if (l.building) pages.push({ kind: "pending", step: allParts ? "quiz" : "theory" });
  else l.quiz.forEach((mcq, i) => pages.push({ kind: "mcq", step: "quiz", mcq, index: i, of: l.quiz.length }));
  pages.push({ kind: "open", step: "open", q: l.open.q, rubric: l.open.rubric });
  return pages;
}

export function placementPages(p: PlacementContent): Page[] {
  return [
    { kind: "intro", step: "placement", text: p.intro, count: p.questions.length },
    ...p.questions.map((mcq, i): Page => ({ kind: "mcq", step: "placement", mcq, index: i, of: p.questions.length })),
  ];
}

/** Steps present in a page list, in order, with the index of their first page. */
export function stepsOf(pages: Page[]): { step: StepKey; first: number }[] {
  const out: { step: StepKey; first: number }[] = [];
  pages.forEach((p, i) => {
    if (!out.length || out[out.length - 1].step !== p.step) out.push({ step: p.step, first: i });
  });
  return out;
}

/** True when the learner may move past this page. */
export function canAdvance(page: Page, progress: SessionProgress): boolean {
  if (page.kind === "mcq") return progress.mcq[page.mcq.id] !== undefined;
  if (page.kind === "open") return !!progress.grade || progress.openAnswer === "__skipped__";
  if (page.kind === "pending") return false;
  return true;
}

export interface LessonTally {
  correct: number;
  total: number;
  reviewCorrect: number;
  quizCorrect: number;
  xp: number;
}

export function tallyLesson(l: LessonContent, progress: SessionProgress, minutes: number, streak: number): LessonTally {
  let xp = 0;
  let reviewCorrect = 0;
  let quizCorrect = 0;
  for (const q of l.review.questions) {
    if (progress.mcq[q.id] === q.answer) {
      reviewCorrect++;
      xp += XP.reviewCorrect;
    }
  }
  for (const q of l.quiz) {
    if (progress.mcq[q.id] === q.answer) {
      quizCorrect++;
      xp += quizXp(q);
    }
  }
  if (progress.grade) xp += Math.round(progress.grade.score) * (progress.grade.self ? XP.openSelfPerPoint : XP.openPerPoint);
  xp += XP.completionBase + Math.round(minutes * XP.perMinute) + streakBonus(streak);
  return {
    correct: reviewCorrect + quizCorrect,
    total: l.review.questions.length + l.quiz.length,
    reviewCorrect,
    quizCorrect,
    xp,
  };
}

/** Questions answered wrong in a lesson — fed into the next review. */
export function mistakesOf(l: LessonContent, progress: SessionProgress): Mcq[] {
  return [...l.review.questions, ...l.quiz].filter((q) => progress.mcq[q.id] !== undefined && progress.mcq[q.id] !== q.answer);
}
