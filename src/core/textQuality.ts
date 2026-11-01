/**
 * A sanity check for AI-written lesson text (0.21). Weak or overloaded models sometimes produce
 * "word salad": words of another script glued into a sentence ("Потовые闭塞", "дерматит,Contact"),
 * invented SHOUTING terms, a different language than asked, looping words. Such text must not be
 * served as a lesson — the step is re-asked, and if it stays garbled the lesson fails with a clear
 * message instead. Pure and unit tested; cheap enough to run on every AI answer.
 */
import type { LessonLanguage } from "./types";

export type Script = "Latin" | "Cyrillic" | "Greek" | "Han" | "Kana" | "Hangul" | "Devanagari" | "Arabic" | "Hebrew" | "Thai" | "Armenian" | "Georgian" | "Other";

const SCRIPTS: [Script, RegExp][] = [
  ["Latin", /\p{Script=Latin}/u],
  ["Cyrillic", /\p{Script=Cyrillic}/u],
  ["Han", /\p{Script=Han}/u],
  ["Kana", /[\p{Script=Hiragana}\p{Script=Katakana}]/u],
  ["Devanagari", /\p{Script=Devanagari}/u],
  ["Greek", /\p{Script=Greek}/u],
  ["Hangul", /\p{Script=Hangul}/u],
  ["Arabic", /\p{Script=Arabic}/u],
  ["Hebrew", /\p{Script=Hebrew}/u],
  ["Thai", /\p{Script=Thai}/u],
  ["Armenian", /\p{Script=Armenian}/u],
  ["Georgian", /\p{Script=Georgian}/u],
];

const LETTER = /\p{L}/u;

export function scriptOf(ch: string): Script | null {
  if (!LETTER.test(ch)) return null;
  for (const [name, re] of SCRIPTS) if (re.test(ch)) return name;
  return "Other";
}

/** The script a lesson in this language is written in (null for "Source": taken from the material). */
export function scriptOfLanguage(lang: LessonLanguage): Script | null {
  switch (lang) {
    case "Russian":
    case "Ukrainian":
    case "Belarusian":
      return "Cyrillic";
    case "Chinese":
      return "Han";
    case "Hindi":
      return "Devanagari";
    case "Source":
      return null;
    default:
      return "Latin";
  }
}

/** Letter counts per script. */
function counts(text: string): Map<Script, number> {
  const m = new Map<Script, number>();
  for (const ch of text) {
    const s = scriptOf(ch);
    if (s) m.set(s, (m.get(s) ?? 0) + 1);
  }
  return m;
}

/** The script most letters of the text are written in (null: no letters). */
export function dominantScript(text: string): Script | null {
  let best: Script | null = null;
  let n = 0;
  for (const [s, c] of counts(text)) if (c > n) [best, n] = [s, c];
  return best;
}

/** Runs of letters in one script: "Потовые闭塞" → [Cyrillic "Потовые", Han "闭塞"]. */
function runs(text: string): [Script, string][] {
  const out: [Script, string][] = [];
  let cur: [Script, string] | null = null;
  for (const ch of text) {
    const s = scriptOf(ch);
    if (s && cur && cur[0] === s) cur[1] += ch;
    else {
      if (cur) out.push(cur);
      cur = s ? [s, ch] : null;
    }
  }
  if (cur) out.push(cur);
  return out;
}

/** Scripts whose writing has no spaces between words: Latin terms are glued in normally ("使用Python编程"). */
const noSpaces = (s: Script | null) => s === "Han" || s === "Kana" || s === "Thai";

export interface TextQuality {
  /** 0 = clean; ≥ GARBLED = not fit to be served. */
  score: number;
  garbled: boolean;
  /** What was found (English, for logs and tests). */
  issues: string[];
}

export const GARBLED = 2.5;

/**
 * Scores how broken a piece of AI text looks. `expected` is the script the lesson should be in
 * (scriptOfLanguage, or the material's dominant script for "Source").
 */
export function textQuality(text: string, expected: Script | null = null): TextQuality {
  const issues: string[] = [];
  let score = 0;
  const chars = [...text];
  const total = counts(text);
  const letters = [...total.values()].reduce((a, b) => a + b, 0);
  const dominant = expected ?? dominantScript(text);

  // 1. a different language than asked (most letters in another script)
  if (expected && letters >= 40) {
    const share = (total.get(expected) ?? 0) / letters;
    if (share < 0.35) {
      score += 3;
      issues.push(`wrong script: ${Math.round(share * 100)}% ${expected}`);
    }
  }

  // 2. words of different scripts glued together, directly or across , . ; : without a space
  let glued = 0;
  const examples: string[] = [];
  for (let i = 1; i < chars.length; i++) {
    const b = scriptOf(chars[i]);
    if (!b) continue;
    let j = i - 1;
    if (/[.,;:]/.test(chars[j]) && j > 0) j--; // "word.Word" / "word,Word"
    const a = scriptOf(chars[j]);
    if (!a || a === b) continue;
    if ((noSpaces(a) || noSpaces(b)) && noSpaces(dominant) && (a === "Latin" || b === "Latin")) continue;
    glued++;
    if (examples.length < 3) examples.push(chars.slice(Math.max(0, j - 6), i + 6).join(""));
  }
  if (glued) {
    score += glued;
    issues.push(`glued scripts ×${glued}: ${examples.join(" | ")}`);
  }

  // 3. runs of an unrelated script (not the lesson's, not Latin) — "闭塞" inside a Russian text
  if (dominant) {
    const alien = runs(text).filter(([s]) => s !== dominant && s !== "Latin" && !(dominant === "Han" && s === "Kana") && !(dominant === "Kana" && s === "Han")).map(([, w]) => w);
    if (alien.length) {
      score += alien.length * 0.5;
      issues.push(`other scripts: ${alien.slice(0, 3).join(", ")}`);
    }
  }

  // 4. long words in capitals — invented "terms" (real abbreviations are short)
  const caps = text.match(/(?<![\p{L}])[\p{Lu}]{7,}(?![\p{L}])/gu) ?? [];
  if (caps.length) {
    score += caps.length * 0.5;
    issues.push(`capitalised words: ${caps.slice(0, 3).join(", ")}`);
  }

  // 5. loops: the same word 4+ times in a row, or broken characters
  if (/(?<![\p{L}])([\p{L}]{3,})(?:[\s,.;:—-]+\1(?![\p{L}])){3,}/iu.test(text)) {
    score += 3;
    issues.push("repeated word loop");
  }
  const broken = (text.match(/�/g) ?? []).length;
  if (broken) {
    score += broken;
    issues.push(`broken characters ×${broken}`);
  }

  return { score, garbled: score >= GARBLED, issues };
}
