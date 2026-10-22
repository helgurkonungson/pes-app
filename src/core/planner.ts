/**
 * Session planner: turns a time budget into a lesson shape, and picks which
 * source chunks feed the lesson. Pure functions — covered by unit tests.
 */
import type { Chunk } from "./types";

export const PORTIONS = [5, 15, 30, 60] as const;
export const MIN_MINUTES = 3;
export const MAX_MINUTES = 120;

/** Reading speed for dense study material, words per minute. */
export const READING_WPM = 180;

/** Share of the session spent on each step. */
export const TIME_SPLIT = { review: 0.15, theory: 0.45, quiz: 0.25, open: 0.15 } as const;

export interface SessionPlan {
  minutes: number;
  reviewQuestions: number;
  theoryWords: number;
  theorySections: number;
  quizQuestions: number;
  openQuestions: number;
  /** How many words of source material to feed the generator. */
  sourceWords: number;
}

export function clampMinutes(minutes: number): number {
  if (!Number.isFinite(minutes)) return 15;
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(minutes)));
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export function planSession(minutesIn: number): SessionPlan {
  const minutes = clampMinutes(minutesIn);
  const theoryWords = Math.min(5000, Math.max(300, roundTo(minutes * TIME_SPLIT.theory * READING_WPM, 50)));
  const reviewQuestions = minutes <= 5 ? 1 : minutes <= 15 ? 2 : minutes <= 30 ? 3 : 4;
  // ~45 s per question including reading the explanation
  const quizQuestions = Math.min(12, Math.max(2, Math.round((minutes * TIME_SPLIT.quiz * 60) / 45)));
  const theorySections = Math.min(8, Math.max(1, Math.round(theoryWords / 400)));
  return {
    minutes,
    reviewQuestions,
    theoryWords,
    theorySections,
    quizQuestions,
    openQuestions: 1,
    sourceWords: Math.min(24000, theoryWords * 4),
  };
}

/** Number of placement-test questions for a portion size. */
export function placementSize(minutes: number): number {
  const m = clampMinutes(minutes);
  return m <= 5 ? 6 : m <= 15 ? 10 : 14;
}

/**
 * Consecutive chunks starting at `cursor` until `sourceWords` is reached
 * (always at least one chunk while any remain).
 */
export function pickChunks(chunks: Chunk[], cursor: number, sourceWords: number): Chunk[] {
  const ordered = [...chunks].sort((a, b) => a.order - b.order).filter((c) => c.order >= cursor);
  const picked: Chunk[] = [];
  let words = 0;
  for (const c of ordered) {
    if (picked.length > 0 && words + c.words > sourceWords * 1.25) break;
    picked.push(c);
    words += c.words;
    if (words >= sourceWords) break;
  }
  return picked;
}

/** Evenly spaced sample of chunks across the whole skillset, for the placement test. */
export function sampleChunks(chunks: Chunk[], count: number): Chunk[] {
  const ordered = [...chunks].sort((a, b) => a.order - b.order);
  if (ordered.length <= count) return ordered;
  const step = ordered.length / count;
  return Array.from({ length: count }, (_, i) => ordered[Math.floor(i * step + step / 2)]);
}

/** Next cursor after teaching `taught` chunks. */
export function advanceCursor(cursor: number, taught: Chunk[]): number {
  if (taught.length === 0) return cursor;
  return Math.max(cursor, ...taught.map((c) => c.order + 1));
}

/** Share of the skillset's source material already taught, 0..1. */
export function coverage(totalChunks: number, cursor: number): number {
  if (totalChunks <= 0) return 0;
  return Math.min(1, Math.max(0, cursor / totalChunks));
}

/** Truncate text to roughly `maxWords` words. */
export function truncateWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + " …";
}
