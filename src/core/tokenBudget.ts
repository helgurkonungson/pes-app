/**
 * Output budgets for AI steps (1.0). Budgets used to be counted for English: a Russian, Hindi or
 * Chinese lesson takes far more tokens for the same words, and the JSON of a function call adds
 * escaping on top — answers were cut off ("finish_reason: length") and the lesson failed.
 * The budget is only a ceiling: providers bill the tokens actually written, not the budget.
 */
import type { Script } from "./textQuality";

/** Tokens per English-equivalent token, roughly, for today's tokenizers (Claude, GPT, Gemini, Llama). */
const FACTOR: Partial<Record<Script, number>> = {
  Latin: 1,
  Cyrillic: 1.8,
  Greek: 2,
  Han: 1.5,
  Kana: 1.5,
  Hangul: 1.6,
  Devanagari: 2.6,
  Arabic: 1.8,
  Hebrew: 1.8,
  Thai: 2.4,
  Armenian: 2.6,
  Georgian: 2.6,
};

/** Highest budget we ask for: what every supported API accepts for one answer. */
export const MAX_OUTPUT_TOKENS = 16_000;

/** `base` English tokens scaled for the lesson's script (unknown script: a safe 1.8), with 25 % headroom for JSON. */
export function outputBudget(base: number, script: Script | null): number {
  const f = script ? (FACTOR[script] ?? 1.8) : 1.8;
  return Math.min(MAX_OUTPUT_TOKENS, Math.round((base * f * 1.25) / 50) * 50);
}

/** The bigger budget for a second try after an answer was cut off. */
export function retryBudget(budget: number): number {
  return Math.min(MAX_OUTPUT_TOKENS, Math.max(budget * 2, budget + 2000));
}
