import { describe, expect, it } from "vitest";
import { buildOfflineLesson, extractTerms, keySentences, makeGap, makeGapQuestions, OfflineError, type OfflineLabels, readingWords, selectReading, splitSentences, toUnits } from "./offline";
import type { Chunk, LessonContent, Mcq } from "./types";

const labels: OfflineLabels = {
  title: (c) => `Reading: ${c}`,
  part: (c, i, n) => `${c} ${i}/${n}`,
  gapQuestion: (g) => `Fill: ${g}`,
  gapExplain: (s) => `From: ${s}`,
  gapTopic: "Gap",
  openQuestion: (c) => `Explain ${c}`,
};

const RU = [
  "Руководство данными (Data Governance) находится в центре колеса DAMA. Оно определяет права принятия решений и ответственность за данные.",
  "Качество данных измеряется по нескольким измерениям: полнота, точность, своевременность и согласованность. Владелец данных утверждает требования к качеству, а стюард данных следит за выполнением требований.",
  "Метаданные описывают смысл, происхождение и использование данных. Каталог данных помогает находить наборы данных. Линейность данных показывает путь данных от источника до отчёта.",
  "Основные данные описывают ключевые сущности: клиентов, товары, сотрудников. Управление основными данными создаёт золотую запись. Справочные данные — это коды и классификаторы, например коды стран.",
].join("\n\n");

const EN = [
  "Data governance is the exercise of authority and control over data assets. Governance defines decision rights and accountability for data.",
  "Data quality is measured along dimensions such as completeness, accuracy, timeliness and consistency. The data owner approves quality requirements while the data steward monitors them.",
  "Metadata describes the meaning, origin and usage of data. A data catalog helps people find datasets. Lineage shows how data flows from a source system to a report.",
].join("\n\n");

/** Builds a chunk of `n` sentences of ~10 words each, grouped in paragraphs of 4. */
function bigChunk(order: number, n: number): Chunk {
  const sents = Array.from({ length: n }, (_, i) => `Sentence number ${i + 1} explains governance, quality and metadata for chunk ${order} clearly.`);
  const paras: string[] = [];
  for (let i = 0; i < sents.length; i += 4) paras.push(sents.slice(i, i + 4).join(" "));
  const text = paras.join("\n\n");
  return { id: `c${order}`, skillsetId: "s", sourceId: "src", order, title: `Chunk ${order}`, text, words: text.split(/\s+/).length };
}

describe("splitSentences", () => {
  it("splits on sentence ends followed by a capital", () => {
    expect(splitSentences("One two. Three four! Five six? Seven.")).toEqual(["One two.", "Three four!", "Five six?", "Seven."]);
  });
  it("keeps abbreviations and initials together", () => {
    expect(splitSentences("См. гл. 3 и рис. 2 — это важно. Дальше идём.")).toEqual(["См. гл. 3 и рис. 2 — это важно.", "Дальше идём."]);
    expect(splitSentences("Use e.g. DAMA. Then J. Smith wrote it.")).toEqual(["Use e.g. DAMA.", "Then J. Smith wrote it."]);
  });
  it("does not split when the next sentence starts in lower case", () => {
    expect(splitSentences("Version 2. и дальше")).toEqual(["Version 2. и дальше"]);
  });
  it("handles closing quotes and Russian text", () => {
    expect(splitSentences("Он сказал «да». Потом ушёл.")).toEqual(["Он сказал «да».", "Потом ушёл."]);
  });
});

describe("toUnits", () => {
  it("tracks word offsets and paragraph ends", () => {
    const u = toUnits("A b c. D e.\n\nF g h i.");
    expect(u.map((x) => [x.start, x.words, x.paraEnd])).toEqual([
      [0, 3, false],
      [3, 2, true],
      [5, 4, true],
    ]);
  });
});

describe("selectReading", () => {
  it("reads about the budget and stops inside a long chunk at a paragraph end", () => {
    const c = bigChunk(0, 200); // ~2000 words
    const r = selectReading([c], 0, 0, 600);
    expect(r.words).toBeGreaterThanOrEqual(600);
    expect(r.words).toBeLessThan(600 * 1.3 + 50);
    expect(r.readTo.cursor).toBe(0);
    expect(r.readTo.word).toBe(r.words);
    expect(r.segments[0].units[r.segments[0].units.length - 1].paraEnd).toBe(true);
  });
  it("continues from the word offset", () => {
    const c = bigChunk(0, 200);
    const first = selectReading([c], 0, 0, 600);
    const second = selectReading([c], first.readTo.cursor, first.readTo.word, 600);
    expect(second.segments[0].units[0].start).toBe(first.readTo.word);
  });
  it("finishes a chunk when only a short tail would remain", () => {
    const c = bigChunk(0, 55); // ~660 words
    const r = selectReading([c], 0, 0, 600);
    expect(r.readTo).toEqual({ cursor: 1, word: 0 });
  });
  it("moves on to the next chunk when budget remains", () => {
    const r = selectReading([bigChunk(0, 20), bigChunk(1, 20), bigChunk(2, 20)], 0, 0, 700);
    expect(r.segments.map((s) => s.chunk.order)).toEqual([0, 1, 2]);
    expect(r.readTo.cursor).toBeGreaterThanOrEqual(2);
  });
  it("skips chunks before the cursor and returns nothing at the end", () => {
    const chunks = [bigChunk(0, 10), bigChunk(1, 10)];
    expect(selectReading(chunks, 1, 0, 300).segments[0].chunk.order).toBe(1);
    expect(selectReading(chunks, 2, 0, 300).segments).toHaveLength(0);
  });
  it("consecutive readings cover the whole source exactly once", () => {
    const chunks = [bigChunk(0, 120), bigChunk(1, 37), bigChunk(2, 3), bigChunk(3, 90)];
    const seen: string[] = [];
    let cur = { cursor: 0, word: 0 };
    for (let guard = 0; guard < 100; guard++) {
      const r = selectReading(chunks, cur.cursor, cur.word, 450);
      if (!r.segments.length) break;
      for (const s of r.segments) for (const u of s.units) seen.push(`${s.chunk.order}:${u.start}`);
      cur = r.readTo;
    }
    const all = chunks.flatMap((c) => toUnits(c.text).map((u) => `${c.order}:${u.start}`));
    expect(seen).toEqual(all);
  });
  it("budget scales with minutes", () => {
    expect(readingWords(5)).toBeLessThan(readingWords(15));
    expect(readingWords(15)).toBeGreaterThanOrEqual(1500);
  });
});

describe("key sentences", () => {
  it("returns sentences in original order, up to the count", () => {
    const k = keySentences(toUnits(EN), 3);
    expect(k.length).toBe(3);
    const pos = k.map((s) => EN.indexOf(s.replace(/…$/, "")));
    expect([...pos].sort((a, b) => a - b)).toEqual(pos);
  });
});

describe("gap questions", () => {
  it("makeGap blanks exactly one occurrence and never the first word", () => {
    expect(makeGap("The data owner approves data rules.", "owner")).toBe("The data _____ approves data rules.");
    expect(makeGap("The data owner approves data rules.", "data")).toBeNull(); // twice
    expect(makeGap("Data owner approves.", "Data")).toBeNull(); // first word
    expect(makeGap("Uses C++ (really) here.", "C++")).toBe("Uses _____ (really) here.");
    expect(makeGap("Метаданные описывают смысл данных.", "смысл")).toBe("Метаданные описывают _____ данных.");
  });
  it("terms include acronyms and repeated words", () => {
    const terms = extractTerms(toUnits(RU)).map((t) => t.surface);
    expect(terms).toContain("DAMA");
    expect(terms.some((t) => /^данн/.test(t))).toBe(true);
  });
  for (const [name, text] of [
    ["Russian", RU],
    ["English", EN],
  ] as const) {
    it(`builds valid questions from ${name} text`, () => {
      let s = 7;
      const rand = () => ((s = (s * 16807) % 2147483647) % 1000) / 1000;
      const qs = makeGapQuestions(toUnits(text), 4, labels, "q", rand);
      expect(qs.length).toBeGreaterThan(0);
      const ids = new Set<string>();
      for (const q of qs) {
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options.map((o) => o.toLowerCase())).size).toBe(4);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.q).toContain("_____");
        // the right answer restores the original sentence
        const sentence = q.explanation.replace(/^From: /, "");
        expect(q.q.replace(/^Fill: /, "").replace("_____", q.options[q.answer])).toBe(sentence);
        // all options are in the same script as the answer
        const latin = /[a-z]/i.test(q.options[q.answer]);
        for (const o of q.options) expect(/[a-z]/i.test(o)).toBe(latin);
        ids.add(q.id);
      }
      expect(ids.size).toBe(qs.length);
    });
  }
  it("returns nothing for tiny texts", () => {
    expect(makeGapQuestions(toUnits("Hi there. Bye."), 3, labels, "q", Math.random)).toEqual([]);
  });
});

describe("buildOfflineLesson", () => {
  const chunk: Chunk = { id: "c0", skillsetId: "s", sourceId: "src", order: 0, title: "Basics", text: (RU + "\n\n").repeat(5), words: 600 };
  const mistake: Mcq = { id: "q9", q: "Old question?", options: ["a", "b", "c", "d"], answer: 1, explanation: "" };

  it("throws on empty or finished sources", () => {
    expect(() => buildOfflineLesson({ chunks: [], cursor: 0, cursorWord: 0, minutes: 15, mistakes: [], labels, seed: 1 })).toThrow(OfflineError);
    try {
      buildOfflineLesson({ chunks: [chunk], cursor: 1, cursorWord: 0, minutes: 15, mistakes: [], labels, seed: 1 });
    } catch (e) {
      expect((e as OfflineError).code).toBe("finished");
    }
  });

  it("produces an offline lesson with reading, gaps and a self-check question", () => {
    const l = buildOfflineLesson({ chunks: [chunk], cursor: 0, cursorWord: 0, minutes: 15, mistakes: [], labels, seed: 42 });
    expect(l.mode).toBe("offline");
    expect(l.title).toBe("Reading: Basics");
    expect(l.theory.sections.length).toBeGreaterThan(0);
    expect(l.theory.sections.every((s) => s.body.length > 0)).toBe(true);
    expect(l.quiz.length).toBeGreaterThan(0);
    expect(l.open.q).toBe("Explain Basics");
    expect(l.open.rubric.length).toBeGreaterThan(0);
    expect(l.open.modelAnswer).toBeTruthy();
    expect(l.review.questions).toHaveLength(0); // first lesson: nothing to review
    expect(l.readTo).toBeDefined();
  });

  it("is deterministic for the same seed", () => {
    const a = buildOfflineLesson({ chunks: [chunk], cursor: 0, cursorWord: 0, minutes: 15, mistakes: [], labels, seed: 3 });
    const b = buildOfflineLesson({ chunks: [chunk], cursor: 0, cursorWord: 0, minutes: 15, mistakes: [], labels, seed: 3 });
    expect(a).toEqual(b);
  });

  it("reviews recent mistakes and the last lesson, with ids that don't clash", () => {
    const last: LessonContent = buildOfflineLesson({ chunks: [chunk], cursor: 0, cursorWord: 0, minutes: 5, mistakes: [], labels, seed: 1 });
    const l = buildOfflineLesson({ chunks: [chunk], cursor: 0, cursorWord: 0, minutes: 15, lastLesson: last, mistakes: [mistake], labels, seed: 2 });
    expect(l.review.recap).toEqual(last.theory.keyPoints.slice(0, 4));
    expect(l.review.questions[0].q).toBe("Old question?");
    const ids = [...l.review.questions, ...l.quiz].map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
