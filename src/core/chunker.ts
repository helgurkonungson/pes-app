/**
 * Splits imported text into teachable chunks (~1,500 words) that follow the
 * source's own structure (pages, chapters, headings) where possible.
 */

export interface TextSection {
  /** Short location label, e.g. "p. 12" or a chapter title. */
  label?: string;
  /** Heading text, if the section starts with one. */
  heading?: string;
  text: string;
}

export interface ChunkDraft {
  title: string;
  text: string;
  words: number;
}

export const TARGET_WORDS = 1500;
export const MAX_WORDS = 2200;

export function countWords(text: string): number {
  const m = text.trim().match(/\S+/g);
  return m ? m.length : 0;
}

export function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/-\n(?=[a-zа-яё])/g, "") // join words hyphenated across lines
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const HEADING_RE = /^(#{1,4}\s+.+|(chapter|part|section|глава|часть|раздел)\s+[\dIVXLC]+.*|\d+(\.\d+){0,3}\.?\s+[A-ZА-ЯЁ].{2,80})$/i;

export function looksLikeHeading(line: string): boolean {
  const l = line.trim();
  if (l.length < 3 || l.length > 90) return false;
  if (HEADING_RE.test(l)) return true;
  // SHORT ALL-CAPS LINES
  const letters = l.replace(/[^A-Za-zА-Яа-яЁё]/g, "");
  return letters.length >= 4 && letters === letters.toUpperCase() && l.split(/\s+/).length <= 8;
}

/** Plain text → sections split at headings (used for TXT/MD/pasted text). */
export function sectionsFromPlainText(text: string): TextSection[] {
  const lines = normalizeText(text).split("\n");
  const sections: TextSection[] = [];
  let current: TextSection = { text: "" };
  for (const line of lines) {
    if (looksLikeHeading(line) && countWords(current.text) > 40) {
      sections.push(current);
      current = { heading: line.replace(/^#+\s*/, "").trim(), text: "" };
    } else if (looksLikeHeading(line) && !current.heading && countWords(current.text) === 0) {
      current.heading = line.replace(/^#+\s*/, "").trim();
    } else {
      current.text += (current.text ? "\n" : "") + line;
    }
  }
  if (countWords(current.text) > 0 || current.heading) sections.push(current);
  return sections;
}

function splitLongText(text: string, maxWords: number): string[] {
  const paragraphs = text.split(/\n{2,}|\n(?=\s*[-•*]\s)/);
  const parts: string[] = [];
  let buf: string[] = [];
  let words = 0;
  const flush = () => {
    if (buf.length) parts.push(buf.join("\n\n"));
    buf = [];
    words = 0;
  };
  for (const p of paragraphs) {
    const w = countWords(p);
    if (w > maxWords) {
      // very long paragraph: split by sentences
      flush();
      const sentences = p.split(/(?<=[.!?…])\s+/);
      for (const s of sentences) {
        const sw = countWords(s);
        if (words + sw > maxWords && buf.length) flush();
        buf.push(s);
        words += sw;
      }
      flush();
      continue;
    }
    if (words + w > maxWords && buf.length) flush();
    buf.push(p);
    words += w;
  }
  flush();
  return parts;
}

function rangeTitle(first: TextSection, last: TextSection, fallback: string): string {
  if (first.heading) return first.heading;
  if (first.label && last.label && first.label !== last.label) {
    const a = first.label.replace(/^pp?\.\s*/, "");
    const b = last.label.replace(/^pp?\.\s*/, "");
    return /^p/.test(first.label) ? `pp. ${a}–${b}` : `${first.label} – ${last.label}`;
  }
  return first.label ?? fallback;
}

/** Groups sections into chunks of about `target` words, never above `max`. */
export function buildChunks(sections: TextSection[], sourceTitle: string, target = TARGET_WORDS, max = MAX_WORDS): ChunkDraft[] {
  const drafts: ChunkDraft[] = [];
  let group: TextSection[] = [];
  let words = 0;

  const emit = () => {
    if (!group.length) return;
    const text = group
      .map((s) => (s.heading ? `## ${s.heading}\n${s.text}` : s.text))
      .join("\n\n")
      .trim();
    const w = countWords(text);
    if (w > 0) {
      drafts.push({ title: rangeTitle(group[0], group[group.length - 1], `${sourceTitle} · part ${drafts.length + 1}`), text, words: w });
    }
    group = [];
    words = 0;
  };

  for (const raw of sections) {
    const s = { ...raw, text: normalizeText(raw.text) };
    const w = countWords(s.text) + (s.heading ? countWords(s.heading) : 0);
    if (w === 0) continue;
    if (w > max) {
      emit();
      const parts = splitLongText(s.text, target);
      parts.forEach((p, i) => {
        group = [{ label: s.label, heading: s.heading ? (i === 0 ? s.heading : `${s.heading} (cont. ${i + 1})`) : undefined, text: p }];
        words = countWords(p);
        emit();
      });
      continue;
    }
    // a new heading starts a new chunk once the current one is reasonably full
    if (s.heading && words >= target * 0.5) emit();
    if (words + w > max) emit();
    group.push(s);
    words += w;
    if (words >= target) emit();
  }
  emit();

  // Untitled chunks get "Source · part n"
  return drafts.map((d, i) => ({ ...d, title: d.title || `${sourceTitle} · part ${i + 1}` }));
}
