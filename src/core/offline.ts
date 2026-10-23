/**
 * Offline lessons: built on the device from the learner's own sources, with no
 * AI. The learner reads the next portion of the source, then answers
 * fill-in-the-gap questions made from that text and checks a short summary
 * against the key sentences. Pure functions — covered by unit tests.
 *
 * Note: no regex lookbehind here (Safari < 16.4 can't parse it).
 */
import { rng } from "./normalize";
import { planSession } from "./planner";
import type { Chunk, LessonContent, Mcq, TheorySection } from "./types";

// ---------- text helpers ----------

/** Unit of reading: one sentence, remembering whether a paragraph ends after it. */
export interface Unit {
  text: string;
  words: number;
  /** Word offset of the unit inside its chunk. */
  start: number;
  paraEnd: boolean;
}

const wordCount = (s: string) => (s.match(/\S+/g) ?? []).length;

const ABBREV = new Set(
  "т.е т.д т.п т.н т.к т.ч e.g i.e etc vs cf al fig pp p no mr mrs ms dr st jr гл стр рис см ср др напр прим г гг в вв ст ч п пп им тыс млн млрд руб коп".split(" "),
);

/** Splits text into sentences without lookbehind. Keeps abbreviations like "e.g." together reasonably well. */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  const re = /[.!?…]+["»”')\]]*\s+/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const end = m.index + m[0].length;
    const next = text.charAt(end);
    // a sentence ends when the next one starts with a capital, digit, quote or bracket,
    // and the dot isn't part of an abbreviation such as "т. е." / "e.g." / "гл." or an initial
    const prev = text.slice(last, m.index).match(/([\p{L}.]+)$/u)?.[1] ?? "";
    const abbrev = !/[!?…]/.test(m[0]) && (ABBREV.has(prev.toLowerCase()) || /^\p{Lu}$/u.test(prev));
    if (/[A-ZА-ЯЁ0-9«"“(\[—–-]/u.test(next) && !abbrev) {
      out.push(text.slice(last, end).trim());
      last = end;
    }
  }
  const rest = text.slice(last).trim();
  if (rest) out.push(rest);
  return out.filter(Boolean);
}

export function toUnits(text: string): Unit[] {
  const units: Unit[] = [];
  let offset = 0;
  const paras = text
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
  for (const p of paras) {
    const sents = splitSentences(p);
    sents.forEach((s, i) => {
      const w = wordCount(s);
      units.push({ text: s, words: w, start: offset, paraEnd: i === sents.length - 1 });
      offset += w;
    });
  }
  return units;
}

// ---------- choosing what to read ----------

export interface Segment {
  chunk: Chunk;
  units: Unit[];
}

export interface Reading {
  segments: Segment[];
  words: number;
  readTo: { cursor: number; word: number };
}

/** Words of source the learner reads in an offline lesson of `minutes`. */
export function readingWords(minutes: number): number {
  // ~60% of the time goes to reading at ~180 wpm; the rest to review, gaps and summary
  return Math.max(250, Math.round((minutes * 0.6 * 180) / 50) * 50);
}

/**
 * Picks the next portion to read, starting at chunk `cursor` / word `cursorWord`.
 * Stops at a paragraph end near the budget; finishes a chunk when only a small
 * tail would remain.
 */
export function selectReading(chunks: Chunk[], cursor: number, cursorWord: number, budget: number): Reading {
  const ordered = [...chunks].sort((a, b) => a.order - b.order).filter((c) => c.order >= cursor);
  const segments: Segment[] = [];
  let words = 0;
  let readTo = { cursor, word: cursorWord };
  for (const chunk of ordered) {
    if (segments.length >= 3 || (segments.length > 0 && words >= budget * 0.8)) break;
    const all = toUnits(chunk.text);
    const startWord = chunk.order === cursor ? cursorWord : 0;
    const units = all.filter((u) => u.start >= startWord);
    if (!units.length) {
      readTo = { cursor: chunk.order + 1, word: 0 };
      continue;
    }
    const taken: Unit[] = [];
    let i = 0;
    for (; i < units.length; i++) {
      taken.push(units[i]);
      words += units[i].words;
      const remaining = units.slice(i + 1).reduce((a, u) => a + u.words, 0);
      if (words >= budget) {
        if (remaining <= budget * 0.25) continue; // take the short tail too
        if (units[i].paraEnd || words >= budget * 1.3) break;
      }
    }
    segments.push({ chunk, units: taken });
    const done = taken.length >= units.length;
    readTo = done ? { cursor: chunk.order + 1, word: 0 } : { cursor: chunk.order, word: units[taken.length].start };
    if (!done) break;
  }
  return { segments, words, readTo };
}

// ---------- key sentences ----------

const STOP = new Set(
  (
    "the a an and or but if then of to in on at by for with from as is are was were be been being this that these those it its into than " +
    "not no can could should would will may might must do does did have has had which who whom what when where why how all any each " +
    "more most other some such only own same so too very also just our your their there here about over under between both " +
    "и в во не что он на я с со как а то все она так его но да ты к у же вы за бы по только ее мне было вот от меня еще нет о из ему " +
    "теперь когда даже ну вдруг ли если уже или ни быть был него до вас нибудь опять уж вам ведь там потом себя ничего ей может они тут где " +
    "есть надо ней для мы тебя их чем была сам чтоб без будто чего раз тоже себе под будет ж тогда кто этот того потому этого какой совсем " +
    "ним здесь этом один почти мой тем чтобы нее сейчас были куда зачем всех никогда можно при наконец два об другой хоть после над больше " +
    "тот через эти нас про всего них какая много разве три эту моя впрочем хорошо свою этой перед иногда лучше чуть том нельзя такой им " +
    "более всегда конечно всю между это также этих которые который которая которое которых является являются данный " +
    "каждый каждая каждое каждой каждого каждом каждую весь вся всей всем всеми свой своя своё свои своих своей своим наш ваш очень " +
    "один одна одно одной одного нужно должен должна должны может могут можно также либо т.е например например"
  ).split(/\s+/),
);

const TOKEN = /[\p{L}\p{N}][\p{L}\p{N}-]*/gu;

export function tokens(s: string): string[] {
  return s.match(TOKEN) ?? [];
}

/** Crude stem: lower-case and cut endings, good enough to count repeated terms in RU/EN. */
export function stem(word: string): string {
  const w = word.toLowerCase();
  return w.length > 6 ? w.slice(0, Math.max(5, w.length - 3)) : w;
}

export function keySentences(units: Unit[], count: number): string[] {
  const tf = new Map<string, number>();
  for (const u of units) for (const t of tokens(u.text)) if (t.length > 2 && !STOP.has(t.toLowerCase())) tf.set(stem(t), (tf.get(stem(t)) ?? 0) + 1);
  const scored = units
    .map((u, i) => {
      const uniq = new Set(tokens(u.text).filter((t) => t.length > 2 && !STOP.has(t.toLowerCase())).map(stem));
      let s = 0;
      uniq.forEach((k) => (s += tf.get(k) ?? 0));
      return { i, text: u.text, score: u.words >= 8 && u.words <= 40 ? s / Math.sqrt(u.words) : -1 };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .sort((a, b) => a.i - b.i);
  return scored.map((x) => (x.text.length > 260 ? x.text.slice(0, 257).trimEnd() + "…" : x.text));
}

// ---------- fill-in-the-gap questions ----------

interface Term {
  surface: string;
  stem: string;
  acronym: boolean;
  script: "latin" | "cyrillic" | "other";
  score: number;
}

const scriptOf = (w: string): Term["script"] => (/[a-z]/i.test(w) ? "latin" : /[а-яё]/i.test(w) ? "cyrillic" : "other");

export function extractTerms(units: Unit[]): Term[] {
  const freq = new Map<string, number>();
  const firstSurface = new Map<string, string>();
  const capitalMid = new Map<string, number>();
  for (const u of units) {
    const toks = tokens(u.text);
    toks.forEach((t, i) => {
      const k = stem(t);
      freq.set(k, (freq.get(k) ?? 0) + 1);
      if (!firstSurface.has(k)) firstSurface.set(k, t);
      if (i > 0 && /^\p{Lu}/u.test(t)) capitalMid.set(k, (capitalMid.get(k) ?? 0) + 1);
    });
  }
  const terms: Term[] = [];
  const seen = new Set<string>();
  for (const u of units) {
    for (const t of tokens(u.text)) {
      const k = stem(t);
      if (seen.has(t)) continue;
      const acronym = /^[\p{Lu}\p{N}]{2,6}$/u.test(t) && /\p{Lu}/u.test(t);
      const isWord = /^\p{L}[\p{L}-]{3,}$/u.test(t) && !STOP.has(t.toLowerCase());
      if (!acronym && !isWord) continue;
      if (/^\p{N}+$/u.test(t)) continue;
      const f = freq.get(k) ?? 0;
      const cap = capitalMid.get(k) ?? 0;
      // rare short words are noise; long words are usually content terms even if they appear once
      if (!acronym && f < 2 && cap === 0 && t.length < 8) continue;
      seen.add(t);
      terms.push({ surface: t, stem: k, acronym, script: scriptOf(t), score: (acronym ? 3 : 0) + Math.min(cap, 2) + Math.min(f, 5) * 0.6 + Math.min(t.length, 12) * 0.05 });
    }
  }
  return terms;
}

function pickDistractors(answer: Term, pool: Term[], sentence: string, rand: () => number): string[] | null {
  const sentStems = new Set(tokens(sentence).map(stem));
  const candidates = pool.filter(
    (t) =>
      t.stem !== answer.stem &&
      t.acronym === answer.acronym &&
      t.script === answer.script && // "Data" next to Russian words would give the answer away
      !sentStems.has(t.stem) &&
      t.surface.toLowerCase() !== answer.surface.toLowerCase(),
  );
  const ending = answer.surface.slice(-2).toLowerCase();
  const scoreOf = (t: Term) => {
    let s = 0;
    if (!answer.acronym && t.surface.slice(-2).toLowerCase() === ending) s += 3; // same grammatical ending reads naturally
    const ratio = t.surface.length / answer.surface.length;
    if (ratio > 0.6 && ratio < 1.6) s += 2;
    if (/^\p{Lu}/u.test(t.surface) === /^\p{Lu}/u.test(answer.surface)) s += 1;
    return s + Math.min(t.score, 4) * 0.3 + rand() * 0.9;
  };
  const picked: string[] = [];
  const usedStems = new Set<string>();
  for (const t of [...candidates].sort((a, b) => scoreOf(b) - scoreOf(a))) {
    if (usedStems.has(t.stem)) continue;
    usedStems.add(t.stem);
    picked.push(t.surface);
    if (picked.length === 3) return picked;
  }
  return null;
}

const GAP = "_____";

/** Replaces the single occurrence of `term` in `sentence` with a gap; null if it occurs 0 or 2+ times. */
export function makeGap(sentence: string, term: string): string | null {
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?=$|[^\\p{L}\\p{N}])`, "gu");
  const matches = [...sentence.matchAll(re)];
  if (matches.length !== 1) return null;
  const m = matches[0];
  const at = (m.index ?? 0) + m[1].length;
  if (at === 0) return null; // don't blank the first word — too easy to guess from capitalisation
  return sentence.slice(0, at) + GAP + sentence.slice(at + term.length);
}

export interface OfflineLabels {
  /** Lesson title from the first chunk title. */
  title: (chunkTitle: string) => string;
  /** Section heading when a chunk is split into several pages. */
  part: (chunkTitle: string, i: number, n: number) => string;
  gapQuestion: (gapped: string) => string;
  gapExplain: (sentence: string) => string;
  gapTopic: string;
  openQuestion: (title: string) => string;
}

export function makeGapQuestions(units: Unit[], count: number, labels: OfflineLabels, idPrefix: string, rand: () => number): Mcq[] {
  if (count <= 0) return [];
  const terms = extractTerms(units);
  if (terms.length < 4) return [];
  const byScore = [...terms].sort((a, b) => b.score - a.score);
  const candidates = units.filter((u) => u.words >= 8 && u.words <= 40);
  // spread questions across the reading: walk candidates in evenly spaced order
  const order: Unit[] = [];
  const step = Math.max(1, Math.floor(candidates.length / Math.max(1, count)));
  for (let s = 0; s < step && order.length < candidates.length; s++) for (let i = s; i < candidates.length; i += step) order.push(candidates[i]);
  const out: Mcq[] = [];
  const usedTerms = new Set<string>();
  for (const u of order) {
    if (out.length >= count) break;
    const present = byScore.filter((t) => !usedTerms.has(t.stem) && tokens(u.text).includes(t.surface));
    for (const term of present) {
      const gapped = makeGap(u.text, term.surface);
      if (!gapped) continue;
      const distractors = pickDistractors(term, terms, u.text, rand);
      if (!distractors) continue;
      const options = [term.surface, ...distractors];
      for (let k = options.length - 1; k > 0; k--) {
        const j = Math.floor(rand() * (k + 1));
        [options[k], options[j]] = [options[j], options[k]];
      }
      usedTerms.add(term.stem);
      out.push({
        id: `${idPrefix}${out.length + 1}`,
        q: labels.gapQuestion(gapped),
        options,
        answer: options.indexOf(term.surface),
        explanation: labels.gapExplain(u.text),
        difficulty: term.acronym ? "e" : "m",
        topic: labels.gapTopic,
      });
      break;
    }
  }
  return out;
}

// ---------- the lesson ----------

export class OfflineError extends Error {
  constructor(public code: "no-sources" | "finished") {
    super(code);
  }
}

export interface OfflineInput {
  chunks: Chunk[];
  cursor: number;
  cursorWord: number;
  minutes: number;
  lastLesson?: LessonContent;
  mistakes: Mcq[];
  labels: OfflineLabels;
  /** Makes questions reproducible (tests) — any number. */
  seed: number;
}

function sectionsFrom(segments: Segment[], labels: OfflineLabels): TheorySection[] {
  const out: TheorySection[] = [];
  for (const seg of segments) {
    const groups: Unit[][] = [];
    let cur: Unit[] = [];
    let w = 0;
    seg.units.forEach((u, i) => {
      cur.push(u);
      w += u.words;
      const last = i === seg.units.length - 1;
      if (!last && ((w >= 350 && u.paraEnd) || w >= 520)) {
        groups.push(cur);
        cur = [];
        w = 0;
      }
    });
    if (cur.length) {
      // merge a tiny last page into the previous one
      if (groups.length && cur.reduce((a, u) => a + u.words, 0) < 120) groups[groups.length - 1].push(...cur);
      else groups.push(cur);
    }
    groups.forEach((g, i) => {
      let body = "";
      g.forEach((u, k) => {
        body += u.text + (u.paraEnd && k < g.length - 1 ? "\n\n" : " ");
      });
      out.push({ heading: groups.length > 1 ? labels.part(seg.chunk.title, i + 1, groups.length) : seg.chunk.title, body: body.trim() });
    });
  }
  return out;
}

export function buildOfflineLesson(input: OfflineInput): LessonContent {
  if (!input.chunks.length) throw new OfflineError("no-sources");
  const plan = planSession(input.minutes);
  const reading = selectReading(input.chunks, input.cursor, input.cursorWord, readingWords(input.minutes));
  if (!reading.segments.length) throw new OfflineError("finished");
  const rand = rng(input.seed);
  const units = reading.segments.flatMap((s) => s.units);
  const keyPoints = keySentences(units, 4);
  const first = reading.segments[0].chunk;
  const idBase = `off${first.order}-${reading.segments[0].units[0]?.start ?? 0}-`;
  const quiz = makeGapQuestions(units, plan.quizQuestions, input.labels, `${idBase}q`, rand);

  // review: recent mistakes first, then a couple of questions from the last lesson
  const reviewMax = plan.reviewQuestions + 1;
  const pool = [...input.mistakes];
  if (input.lastLesson) {
    const extra = [...input.lastLesson.quiz].sort(() => rand() - 0.5);
    for (const q of extra) if (!pool.some((p) => p.q === q.q)) pool.push(q);
  }
  const reviewQs = pool.slice(0, input.lastLesson || input.mistakes.length ? reviewMax : 0).map((q, i) => ({ ...q, id: `rv${i + 1}-${q.id}` }));
  const title = input.labels.title(first.title);
  return {
    title,
    review: { recap: input.lastLesson ? input.lastLesson.theory.keyPoints.slice(0, 4) : [], questions: reviewQs },
    theory: { sections: sectionsFrom(reading.segments, input.labels), keyPoints },
    quiz,
    open: {
      id: `${idBase}open`,
      q: input.labels.openQuestion(first.title),
      rubric: keyPoints.slice(0, 3).map((k) => (k.length > 140 ? k.slice(0, 137).trimEnd() + "…" : k)),
      modelAnswer: keyPoints.join(" "),
    },
    mode: "offline",
    readTo: reading.readTo,
  };
}
