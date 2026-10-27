/**
 * Built-in courses are written in a compact text format (one file per course and language,
 * `src/courses/<slug>/<lang>.md`) and turned into a `pes-course` object here (ADR-031).
 *
 *   ---                      header: key: value lines (id, title, description, goal, language, minutes, hue)
 *   # <lesson-id> | <module> | <title>
 *   ## <section heading>     theory section; the following lines are its markdown body
 *   !key <text>              key point (recap of the lesson)
 *   ?q:e|m|h <question>      quiz question;  ?r:e|m|h <question>  recall question (next lesson's review)
 *   + <right option>         options in display order, exactly one "+"
 *   - <wrong option>
 *   = <explanation>
 *   !open <question>         open question; !rubric <criterion> (repeatable); !model <model answer>
 *
 * Lines starting with "//" are comments. Options are shuffled deterministically by lesson id and
 * question number, so every translation shows them in the same order and the right answer is not
 * always in the place where the author happened to write it. Pure; throws CourseTextError.
 */

/** FNV-1a hash of a string — the seed of the option shuffle. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Same seed → same permutation (Fisher–Yates with a small LCG). */
export function shuffledOrder(n: number, seed: string): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  let x = hash(seed) || 1;
  for (let i = n - 1; i > 0; i--) {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    const j = x % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export class CourseTextError extends Error {
  constructor(
    message: string,
    public line: number,
  ) {
    super(`line ${line}: ${message}`);
  }
}

interface RawMcq {
  q: string;
  options: string[];
  answer: number;
  explanation: string;
  difficulty: "e" | "m" | "h";
  topic: string;
}

interface RawLesson {
  id: string;
  module: string;
  title: string;
  theory: { sections: { heading: string; body: string }[]; keyPoints: string[] };
  quiz: RawMcq[];
  recall: RawMcq[];
  open: { q: string; rubric: string[]; modelAnswer: string };
}

export interface RawCourse {
  format: "pes-course";
  formatVersion: 1;
  id: string;
  version: number;
  title: string;
  description: string;
  goal: string;
  language: string;
  minutes: number;
  hue: number;
  lessons: RawLesson[];
}

export function courseFromText(text: string): RawCourse {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  const head: Record<string, string> = {};
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;
  if (lines[i]?.trim() !== "---") throw new CourseTextError("the file must start with a --- header", i + 1);
  for (i++; i < lines.length && lines[i].trim() !== "---"; i++) {
    const m = lines[i].match(/^(\w+):\s*(.*)$/);
    if (m) head[m[1]] = m[2].trim();
    else if (lines[i].trim()) throw new CourseTextError("header lines are key: value", i + 1);
  }
  if (i >= lines.length) throw new CourseTextError("the header is not closed with ---", i);
  i++;

  const lessons: RawLesson[] = [];
  let lesson: RawLesson | null = null;
  let section: { heading: string; body: string[] } | null = null;
  let q: (RawMcq & { kind: "q" | "r"; line: number }) | null = null;

  const closeSection = () => {
    if (section && lesson) lesson.theory.sections.push({ heading: section.heading, body: section.body.join("\n").trim() });
    section = null;
  };
  const closeQuestion = () => {
    if (!q || !lesson) return;
    const right = q.answer;
    if (right < 0) throw new CourseTextError("a question needs exactly one + option", q.line);
    if (q.options.length < 2) throw new CourseTextError("a question needs at least two options", q.line);
    const { kind, line: _line, ...mcq } = q;
    const list = kind === "q" ? lesson.quiz : lesson.recall;
    const order = shuffledOrder(mcq.options.length, `${lesson.id}/${kind}${list.length + 1}`);
    list.push({ ...mcq, options: order.map((k) => mcq.options[k]), answer: order.indexOf(right) });
    q = null;
  };
  const closeLesson = () => {
    closeSection();
    closeQuestion();
    if (!lesson) return;
    if (!lesson.theory.sections.length || !lesson.quiz.length || !lesson.open.q) throw new CourseTextError(`lesson ${lesson.id} needs sections, quiz questions and an open question`, 0);
    lessons.push(lesson);
    lesson = null;
  };

  for (; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    const n = i + 1;
    if (line.startsWith("//")) continue;
    let m: RegExpMatchArray | null;
    if ((m = raw.match(/^# (\S+)\s*\|\s*(.*?)\s*\|\s*(.+)$/))) {
      closeLesson();
      lesson = { id: m[1], module: m[2], title: m[3].trim(), theory: { sections: [], keyPoints: [] }, quiz: [], recall: [], open: { q: "", rubric: [], modelAnswer: "" } };
      continue;
    }
    if (!lesson) {
      if (line) throw new CourseTextError("text before the first lesson", n);
      continue;
    }
    if ((m = raw.match(/^## (.+)$/))) {
      closeQuestion();
      closeSection();
      section = { heading: m[1].trim(), body: [] };
      continue;
    }
    if ((m = line.match(/^\?([qr]):([emh]) (.+)$/))) {
      closeSection();
      closeQuestion();
      q = { kind: m[1] as "q" | "r", difficulty: m[2] as "e" | "m" | "h", q: m[3].trim(), options: [], answer: -1, explanation: "", topic: lesson.title, line: n };
      continue;
    }
    if (q && (m = line.match(/^([+-]) (.+)$/))) {
      if (m[1] === "+") {
        if (q.answer >= 0) throw new CourseTextError("two + options", n);
        q.answer = q.options.length;
      }
      q.options.push(m[2].trim());
      continue;
    }
    if (q && (m = line.match(/^= (.+)$/))) {
      q.explanation = m[1].trim();
      continue;
    }
    if ((m = line.match(/^!(key|open|rubric|model) (.+)$/))) {
      closeSection();
      closeQuestion();
      const v = m[2].trim();
      if (m[1] === "key") lesson.theory.keyPoints.push(v);
      else if (m[1] === "open") lesson.open.q = v;
      else if (m[1] === "rubric") lesson.open.rubric.push(v);
      else lesson.open.modelAnswer = v;
      continue;
    }
    if (section) {
      section.body.push(raw);
      continue;
    }
    if (line) throw new CourseTextError(`unexpected line: ${line.slice(0, 40)}`, n);
  }
  closeLesson();

  const num = (v: string | undefined, d: number) => (v && Number.isFinite(Number(v)) ? Number(v) : d);
  for (const k of ["id", "title", "language"]) if (!head[k]) throw new CourseTextError(`header needs ${k}`, 1);
  return {
    format: "pes-course",
    formatVersion: 1,
    id: head.id,
    version: num(head.version, 1),
    title: head.title,
    description: head.description ?? "",
    goal: head.goal ?? "",
    language: head.language,
    minutes: num(head.minutes, 10),
    hue: num(head.hue, 174),
    lessons,
  };
}
