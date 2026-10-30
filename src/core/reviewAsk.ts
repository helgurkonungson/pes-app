/**
 * When to ask for a Google Play rating (0.19.2): only at a good moment — right after a lesson
 * whose open answer scored well, or on a streak milestone — and rarely. Google decides on its
 * own whether the card is shown (it has its own quota), so asking too often only wastes it.
 */
export const REVIEW_ASK = {
  /** Lessons finished (all skillsets) before the first ask. */
  minLessons: 3,
  /** Open-answer score (out of 10) that makes a good moment. */
  minScore: 8,
  streaks: [3, 7, 14, 30, 60, 100, 365],
  /** Days between asks. */
  gapDays: 120,
  maxAsks: 3,
} as const;

export interface ReviewAskState {
  at: string;
  count: number;
}

export function shouldAskForReview(o: { lessonsDone: number; openScore?: number; streak: number; state?: ReviewAskState; now?: Date }): boolean {
  const now = o.now ?? new Date();
  if (o.lessonsDone < REVIEW_ASK.minLessons) return false;
  if (o.state) {
    if (o.state.count >= REVIEW_ASK.maxAsks) return false;
    const days = (now.getTime() - Date.parse(o.state.at)) / 86_400_000;
    if (!(days >= REVIEW_ASK.gapDays)) return false;
  }
  const goodAnswer = typeof o.openScore === "number" && o.openScore >= REVIEW_ASK.minScore;
  const milestone = (REVIEW_ASK.streaks as readonly number[]).includes(o.streak);
  return goodAnswer || milestone;
}

export function recordReviewAsk(state: ReviewAskState | undefined, now: Date = new Date()): ReviewAskState {
  return { at: now.toISOString(), count: (state?.count ?? 0) + 1 };
}
