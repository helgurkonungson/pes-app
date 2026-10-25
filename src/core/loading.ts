/**
 * What the "preparing the lesson" screen shows while it waits: a progress value that always
 * moves (real steps when the writer reports them, a slowing creep otherwise — never 100 %
 * before the lesson is there) and a phrase that changes every few seconds. Pure.
 */

/** Seconds for the creep to cover ~63 % of the remaining way. */
const STEP_TAU = 20;
const BLIND_TAU = 45;

/**
 * 0…1. With steps: finished steps plus a creep inside the current one (≤ 85 % of a step).
 * Without: time-based, approaching 90 %.
 */
export function loadingProgress(opts: { steps?: { done: number; total: number } | null; secondsInStep: number; secondsTotal: number }): number {
  const { steps } = opts;
  if (steps && steps.total > 0) {
    const done = Math.min(steps.done, steps.total);
    const creep = done < steps.total ? 0.85 * (1 - Math.exp(-Math.max(0, opts.secondsInStep) / STEP_TAU)) : 0;
    return Math.min(0.97, (done + creep) / steps.total);
  }
  return 0.9 * (1 - Math.exp(-Math.max(0, opts.secondsTotal) / BLIND_TAU));
}

export const PHRASES = {
  early: ["loading.early1", "loading.early2", "loading.early3"],
  mid: ["loading.mid1", "loading.mid2", "loading.mid3"],
  late: ["loading.late1", "loading.late2", "loading.late3"],
} as const;

export type LoadingPhrase = (typeof PHRASES)[keyof typeof PHRASES][number];

/** Seconds each phrase stays. */
export const PHRASE_SECONDS = 4;

/** The phrase for this moment: picked by how far along it is, rotating every PHRASE_SECONDS. */
export function loadingPhrase(progress: number, seconds: number): LoadingPhrase {
  const list = progress < 0.35 ? PHRASES.early : progress < 0.75 ? PHRASES.mid : PHRASES.late;
  return list[Math.floor(Math.max(0, seconds) / PHRASE_SECONDS) % list.length];
}
