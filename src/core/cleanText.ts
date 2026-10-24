/**
 * Book text hygiene for lessons: removes control characters and PDF/EPUB debris,
 * and recognises front matter (title page, copyright, contents, preface,
 * introduction…) and back matter (index, bibliography, notes) so lessons start
 * with the actual content. Pure functions, no regex lookbehind (old Safari).
 */
import type { Chunk } from "./types";

const letters = (s: string) => (s.match(/\p{L}/gu) ?? []).length;
const wordsOf = (s: string) => (s.match(/\S+/g) ?? []).length;

/** A line that carries no reading value: page numbers, dot leaders, symbol rows, lone headers/footers. */
function junkLine(line: string): boolean {
  const l = line.trim();
  if (!l) return false;
  if (/^[-–—]?\s*\d{1,4}\s*[-–—]?$/.test(l)) return true; // page number
  if (/^[ivxlcdm]{1,7}$/i.test(l) && l.length <= 7 && !/^(i|mix|mid|dim|lid|civil)$/i.test(l)) return true; // roman page number
  if (/^(page|стр\.?|с\.)\s*\d+(\s*(of|из)\s*\d+)?$/i.test(l)) return true;
  const L = letters(l);
  if (L === 0) return true; // only digits/symbols/punctuation
  // mostly symbols (e.g. "• • • ■ ◆ 12 ▲"), short lines only — long lines are real text
  if (l.length >= 6 && L / l.length < 0.3 && wordsOf(l) <= 8) return true;
  return false;
}

/**
 * Cleans one piece of source text. Idempotent: cleaning cleaned text changes nothing,
 * so word offsets saved for the reading cursor stay valid.
 */
export function cleanSourceText(text: string): string {
  let s = text.normalize("NFKC"); // ligatures (ﬁ → fi), full-width forms
  s = s
    .replace(/\r\n?/g, "\n")
    .replace(/­/g, "") // soft hyphen
    .replace(/[​-‍⁠﻿]/g, "") // zero-width characters, BOM
    // control characters (keep \t and \n), replacement char, private-use glyphs from PDF fonts
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F�-]/g, " ")
    .replace(/\t/g, " ")
    .replace(/(?:\s?\.){4,}\s?\d*/g, " ") // dot leaders "Введение ........ 7"
    .replace(/[_=~*#]{4,}/g, " ") // rules of underscores, equals, stars
    .replace(/(\p{Ll})-\n(\p{Ll})/gu, "$1$2"); // word hyphenated across lines
  const lines = s.split("\n").map((l) => l.replace(/ {2,}/g, " ").trim());
  const kept: string[] = [];
  for (const l of lines) {
    if (junkLine(l)) continue;
    kept.push(l);
  }
  return kept
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ---------- front and back matter ----------

const FRONT_HEADINGS = [
  // contents
  "содержание", "оглавление", "contents", "table of contents",
  // prefaces & introductions
  "предисловие", "предисловие автора", "предисловие к русскому изданию", "предисловие редактора", "от автора", "от издательства", "от редакции", "от переводчика",
  "вступление", "вступительное слово", "введение", "о книге", "об этой книге", "как читать эту книгу", "для кого эта книга",
  "preface", "foreword", "introduction", "prologue", "about this book", "how to use this book", "who this book is for",
  // dedications, thanks, authors
  "благодарности", "посвящение", "об авторе", "об авторах", "acknowledgements", "acknowledgments", "dedication", "about the author", "about the authors",
  "praise for", "отзывы о книге",
];
const BACK_HEADINGS = [
  "список литературы", "литература", "библиография", "источники", "примечания", "предметный указатель", "алфавитный указатель", "указатель", "глоссарий", "приложения", "об авторе", "об авторах",
  "bibliography", "references", "notes", "endnotes", "index", "glossary", "about the author", "about the authors", "further reading",
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/^#+\s*/, "")
    .replace(/[«»"“”.:!?…\d]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function headingMatches(title: string, firstLine: string, list: string[]): boolean {
  for (const raw of [title, firstLine]) {
    const h = norm(raw);
    if (!h || h.length > 60) continue;
    if (list.some((x) => h === x || h.startsWith(`${x} `))) return true;
  }
  return false;
}

/** Copyright page, ISBN, library codes, publisher imprint. */
function looksLikeImprint(text: string): boolean {
  const hits = [
    /isbn[\s:-]*[\dx-]{10,}/i,
    /©|\(c\)\s*\d{4}|copyright/i,
    /все права защищены|all rights reserved/i,
    /\bУДК\b|\bББК\b/,
    /library of congress|cataloging-in-publication/i,
    /подписано в печать|тираж\s+\d|формат\s+\d+\s*[x×]\s*\d+/i,
    /издательство|publishing|publisher|printed in/i,
    /перевод с английского|translated from/i,
  ].filter((re) => re.test(text)).length;
  return hits >= 2 || (hits >= 1 && wordsOf(text) < 250);
}

/** Table of contents: many short lines ending in page numbers or chapter numbering. */
function looksLikeContents(text: string): boolean {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 6) return false;
  const tocLike = lines.filter((l) => /\s\d{1,4}$/.test(l) || /^(глава|часть|раздел|chapter|part|section)\s+[\dIVXLC]+/i.test(l) || /^\d+(\.\d+)*\.?\s+\S/.test(l)).length;
  const short = lines.filter((l) => wordsOf(l) <= 12).length;
  return tocLike / lines.length >= 0.5 && short / lines.length >= 0.7;
}

const CHAPTER_ONE = /^#*\s*(глава|chapter|часть|part|урок|lesson)\s+(1|i|один|первая|первый|one)\b/i;

/** A line followed by real prose (not by more table-of-contents lines). */
function proseFollows(lines: string[], from: number): boolean {
  for (let j = from + 1; j < Math.min(lines.length, from + 4); j++) if (wordsOf(lines[j]) >= 12) return true;
  return false;
}

export interface ChunkAnalysis {
  /** Chunks to leave out of lessons. */
  skip: Set<string>;
  /** Chunk id → index of the (cleaned) line where the book's content begins. */
  startLine: Map<string, number>;
}

/**
 * Finds what lessons should skip: front matter near the start of each source
 * (everything before "Chapter 1" / "Глава 1" in the first half; contents, copyright, preface,
 * introduction…), back matter near its end (index, bibliography, notes) and
 * chunks with almost no readable text. Never removes a whole source.
 */
export function analyzeChunks(chunks: Chunk[]): ChunkAnalysis {
  const bySource = new Map<string, Chunk[]>();
  for (const c of chunks) bySource.set(c.sourceId, [...(bySource.get(c.sourceId) ?? []), c]);
  const skip = new Set<string>();
  const startLine = new Map<string, number>();
  for (const list of bySource.values()) {
    const ordered = [...list].sort((a, b) => a.order - b.order);
    const n = ordered.length;
    const texts = ordered.map((c) => cleanSourceText(c.text));
    const mine = new Set<string>();
    // the first "Chapter 1" heading (within the first half) that is followed by prose
    let start: { i: number; line: number } | null = null;
    for (let i = 0; i < n && i <= Math.max(4, n / 2) && !start; i++) {
      if (looksLikeContents(texts[i])) continue; // the contents page lists "Chapter 1" too
      const lines = [ordered[i].title, ...texts[i].split("\n")];
      const tail = texts[i + 1]?.split("\n") ?? [];
      for (let k = 0; k < lines.length; k++) {
        const l = lines[k].trim();
        if (l.length <= 80 && CHAPTER_ONE.test(l) && proseFollows([...lines, ...tail], k)) {
          start = { i, line: Math.max(0, k - 1) }; // k counts the title line
          break;
        }
      }
    }
    ordered.forEach((c, i) => {
      const text = texts[i];
      const firstLine = text.split("\n")[0] ?? "";
      const nearStart = i < Math.max(5, n * 0.25);
      const nearEnd = n > 3 && i > n - 1 - Math.max(2, n * 0.25);
      if (letters(text) < 80) mine.add(c.id); // blank pages, images-only pages
      else if (start && i < start.i) mine.add(c.id);
      else if (!start && nearStart && (headingMatches(c.title, firstLine, FRONT_HEADINGS) || looksLikeImprint(text) || looksLikeContents(text))) mine.add(c.id);
      else if (nearEnd && (headingMatches(c.title, firstLine, BACK_HEADINGS) || looksLikeContents(text))) mine.add(c.id);
    });
    if (mine.size < n) {
      mine.forEach((id) => skip.add(id));
      if (start && start.line > 0 && !mine.has(ordered[start.i].id)) startLine.set(ordered[start.i].id, start.line);
    }
  }
  return { skip, startLine };
}

/** Chunks as lessons should see them: front/back matter (and material the learner already knows) skipped, text cleaned. */
export function lessonChunks(chunks: Chunk[], known?: readonly string[]): Chunk[] {
  const { skip, startLine } = analyzeChunks(chunks);
  // parts the placement test showed the learner already knows — unless that would leave nothing
  const knownSet = new Set(known ?? []);
  const left = chunks.filter((c) => !skip.has(c.id) && !knownSet.has(c.id));
  const keep = left.length ? left : chunks.filter((c) => !skip.has(c.id));
  return keep
    .map((c) => {
      let text = cleanSourceText(c.text);
      const from = startLine.get(c.id);
      if (from) text = text.split("\n").slice(from).join("\n");
      return { ...c, text };
    });
}
