/** XP, levels, ranks and placement scoring. Pure functions. */
import type { Difficulty, LearnerLevel, Mcq, PlacementResult, Skillset } from "./types";

export const XP = {
  reviewCorrect: 5,
  quizCorrect: { e: 8, m: 10, h: 14 } as Record<Difficulty, number>,
  openPerPoint: 3, // score 0..10 → 0..30 XP
  openSelfPerPoint: 2, // self-checked answers earn a bit less
  completionBase: 20,
  perMinute: 1,
  placement: 50,
  streakBonusPerDay: 2, // capped
  streakBonusCap: 20,
} as const;

export function quizXp(q: Mcq): number {
  return XP.quizCorrect[q.difficulty ?? "m"];
}

export function streakBonus(streak: number): number {
  return Math.min(XP.streakBonusCap, Math.max(0, streak - 1) * XP.streakBonusPerDay);
}

/** Cumulative XP needed to reach `level` (level 1 = 0 XP, 2 = 100, 3 = 300, 4 = 600 …). */
export function xpForLevel(level: number): number {
  const n = Math.max(1, Math.floor(level));
  return 50 * n * (n - 1);
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export interface LevelProgress {
  level: number;
  intoLevel: number;
  levelSpan: number;
  ratio: number;
  toNext: number;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const start = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const intoLevel = xp - start;
  const levelSpan = next - start;
  return { level, intoLevel, levelSpan, ratio: levelSpan ? intoLevel / levelSpan : 0, toNext: next - xp };
}

const RANKS: [number, string][] = [
  [1, "Novice"],
  [3, "Apprentice"],
  [5, "Learner"],
  [8, "Practitioner"],
  [12, "Specialist"],
  [16, "Expert"],
  [21, "Master"],
  [27, "Grandmaster"],
  [34, "Sage"],
];

export function rankFor(level: number): string {
  let rank = RANKS[0][1];
  for (const [min, name] of RANKS) if (level >= min) rank = name;
  return rank;
}

export function levelFromScore(ratio: number): LearnerLevel {
  if (ratio < 0.4) return "beginner";
  if (ratio < 0.75) return "intermediate";
  return "advanced";
}

/** Scores a placement test from the learner's answers (question id → chosen index). */
export function scorePlacement(questions: Mcq[], answers: Record<string, number>, at: string): PlacementResult {
  let score = 0;
  const topicHits = new Map<string, { ok: number; all: number }>();
  for (const q of questions) {
    const ok = answers[q.id] === q.answer;
    if (ok) score++;
    const topic = (q.topic || "General").trim();
    const t = topicHits.get(topic) ?? { ok: 0, all: 0 };
    t.all++;
    if (ok) t.ok++;
    topicHits.set(topic, t);
  }
  const strengths: string[] = [];
  const gaps: string[] = [];
  for (const [topic, t] of topicHits) {
    if (t.ok / t.all >= 0.67) strengths.push(topic);
    else gaps.push(topic);
  }
  const total = questions.length;
  // material is "known" when every question about it was answered right
  const byRef = new Map<string, boolean>();
  for (const q of questions) if (q.ref) byRef.set(q.ref, (byRef.get(q.ref) ?? true) && answers[q.id] === q.answer);
  const known = [...byRef].filter(([, ok]) => ok).map(([ref]) => ref);
  return { score, total, level: levelFromScore(total ? score / total : 0), strengths, gaps, at, known };
}

/** A skipped placement test: the learner starts from zero, nothing is skipped in lessons. */
export function skippedPlacement(at: string): PlacementResult {
  return { score: 0, total: 0, level: "beginner", strengths: [], gaps: [], at, known: [], skipped: true };
}

/** Accuracy 0..1, or null when nothing was answered. */
export function accuracy(correct: number, total: number): number | null {
  return total > 0 ? correct / total : null;
}

export function pct(ratio: number | null | undefined): string {
  if (ratio == null || !Number.isFinite(ratio)) return "—";
  return `${Math.round(ratio * 100)}%`;
}

/**
 * The first session of every skillset is a placement test. Older versions skipped it
 * automatically (no AI, imported courses) — such skillsets still get it while no lesson is done.
 */
export function needsPlacement(s: Pick<Skillset, "placement" | "placementSkipped" | "lessonsDone">): boolean {
  if (s.placement) return false;
  return !s.placementSkipped || s.lessonsDone === 0;
}
