/**
 * What the learner missed in open answers comes back in later AI lessons until it is closed
 * (0.19.2). Pure: the session service feeds it the finished lessons of a skillset.
 *
 * A gap opens when a graded open answer (AI or self-check) lists it under "To improve".
 * The next AI lessons are asked to revisit the newest open gaps (`LessonContent.revisit`).
 * A revisiting lesson whose open answer scores CLOSE_AT or more closes the gaps it revisited;
 * otherwise each of them counts one more try and is dropped after MAX_TRIES (so an odd gap
 * never sticks forever).
 */
import type { OpenGrade } from "./types";

export const CLOSE_AT = 7;
export const MAX_TRIES = 3;
/** Gaps passed to one lesson. */
export const PER_LESSON = 3;
/** Open gaps remembered per skillset (the oldest go first). */
const KEEP = 8;
const MAX_LEN = 220;

export interface GapLesson {
  finishedAt: string;
  grade?: OpenGrade;
  /** Gaps this lesson was asked to revisit. */
  revisit?: string[];
}

export interface Gap {
  text: string;
  tries: number;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

function clean(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim().replace(/\s+/g, " ");
  if (t.length < 3) return null;
  return t.length > MAX_LEN ? `${t.slice(0, MAX_LEN - 1).trimEnd()}…` : t;
}

/** Gaps still open after these lessons, oldest first. */
export function openGaps(lessons: GapLesson[]): Gap[] {
  let open: Gap[] = [];
  const sorted = [...lessons].sort((a, b) => a.finishedAt.localeCompare(b.finishedAt));
  for (const l of sorted) {
    const revisited = new Set((l.revisit ?? []).map(norm));
    if (revisited.size) {
      const closed = !!l.grade && l.grade.score >= CLOSE_AT;
      open = open
        .map((g) => (revisited.has(norm(g.text)) ? { ...g, tries: g.tries + 1, closed } : { ...g, closed: false }))
        .filter((g) => !g.closed && g.tries < MAX_TRIES)
        .map(({ text, tries }) => ({ text, tries }));
    }
    if (l.grade && l.grade.score < 10) {
      for (const raw of l.grade.gaps ?? []) {
        const text = clean(raw);
        if (!text || open.some((g) => norm(g.text) === norm(text))) continue;
        open.push({ text, tries: 0 });
      }
    }
    if (open.length > KEEP) open = open.slice(open.length - KEEP);
  }
  return open;
}

/** The gaps the next lesson should revisit: the newest open ones. */
export function gapsForNextLesson(lessons: GapLesson[], max = PER_LESSON): string[] {
  return openGaps(lessons)
    .slice(-max)
    .reverse()
    .map((g) => g.text);
}
