/**
 * Imported courses: ready-made lessons that need no AI. A course file is JSON
 * with `format: "pes-course"`. Progress is tracked by lesson id, so a newer
 * version of the same course (same `id`) can be imported over the old one
 * without losing what the learner has already done.
 */
import type { Course, CourseLesson, Difficulty, LessonContent, LessonLanguage, Mcq, OpenQuestion, PlacementContent, TheorySection } from "./types";

export const COURSE_FORMAT = "pes-course";
export const COURSE_FORMAT_VERSION = 1;

export type CourseErrorCode = "not-json" | "not-course" | "newer-format" | "no-id" | "no-lessons" | "bad-lesson";

export class CourseError extends Error {
  constructor(
    public code: CourseErrorCode,
    public detail = "",
  ) {
    super(`${code}${detail ? `: ${detail}` : ""}`);
  }
}

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v.trim() : fallback);
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : []);
const LANGS: LessonLanguage[] = ["English", "Russian", "Source"];

function mcqFrom(raw: unknown, id: string): Mcq | null {
  const o = (raw ?? {}) as Record<string, unknown>;
  const options = strArr(o.options).slice(0, 6);
  const answer = typeof o.answer === "number" ? Math.round(o.answer) : parseInt(String(o.answer), 10);
  const q = str(o.q ?? o.question);
  if (!q || options.length < 2 || !(answer >= 0 && answer < options.length)) return null;
  const d = str(o.difficulty) as Difficulty;
  return {
    id: str(o.id) || id,
    q,
    options,
    answer,
    explanation: str(o.explanation),
    difficulty: d === "e" || d === "m" || d === "h" ? d : "m",
    topic: str(o.topic) || undefined,
  };
}

function mcqs(raw: unknown, prefix: string): Mcq[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r, i) => mcqFrom(r, `${prefix}${i + 1}`)).filter((m): m is Mcq => !!m);
}

function lessonFrom(raw: unknown, index: number): CourseLesson {
  const o = (raw ?? {}) as Record<string, any>;
  const id = str(o.id) || `lesson-${index + 1}`;
  const sections: TheorySection[] = Array.isArray(o.theory?.sections)
    ? o.theory.sections.map((s: any) => ({ heading: str(s?.heading), body: str(s?.body) })).filter((s: TheorySection) => s.body)
    : [];
  const title = str(o.title);
  const quiz = mcqs(o.quiz, `${id}-q`);
  const openQ = str(o.open?.q);
  if (!title || !sections.length || !quiz.length || !openQ) throw new CourseError("bad-lesson", id);
  const open: OpenQuestion = { id: `${id}-open`, q: openQ, rubric: strArr(o.open?.rubric).slice(0, 6), modelAnswer: str(o.open?.modelAnswer) || undefined };
  return {
    id,
    module: str(o.module) || undefined,
    title,
    sources: strArr(o.sources),
    theory: { sections, keyPoints: strArr(o.theory?.keyPoints).slice(0, 8) },
    quiz,
    recall: mcqs(o.recall, `${id}-r`),
    open,
  };
}

/** Validates and normalizes a course file. Throws CourseError. */
export function parseCourse(input: string | unknown, importedAt: string): Course {
  let raw: unknown = input;
  if (typeof input === "string") {
    try {
      raw = JSON.parse(input.replace(/^﻿/, ""));
    } catch {
      throw new CourseError("not-json");
    }
  }
  const o = (raw ?? {}) as Record<string, any>;
  if (o.format !== COURSE_FORMAT) throw new CourseError("not-course");
  const fv = typeof o.formatVersion === "number" ? o.formatVersion : 1;
  if (fv > COURSE_FORMAT_VERSION) throw new CourseError("newer-format", String(fv));
  const id = str(o.id);
  if (!/^[a-z0-9][a-z0-9._-]{1,63}$/i.test(id)) throw new CourseError("no-id");
  if (!Array.isArray(o.lessons) || o.lessons.length === 0) throw new CourseError("no-lessons");
  const lessons = o.lessons.map((l: unknown, i: number) => lessonFrom(l, i));
  const seen = new Set<string>();
  for (const l of lessons) {
    if (seen.has(l.id)) throw new CourseError("bad-lesson", `duplicate id ${l.id}`);
    seen.add(l.id);
  }
  const minutes = typeof o.minutes === "number" && o.minutes >= 3 && o.minutes <= 120 ? Math.round(o.minutes) : 15;
  const hue = typeof o.hue === "number" && o.hue >= 0 && o.hue <= 360 ? Math.round(o.hue) : 174;
  return {
    id,
    version: typeof o.version === "number" && o.version >= 1 ? Math.floor(o.version) : 1,
    title: str(o.title) || id,
    description: str(o.description),
    language: LANGS.includes(o.language) ? o.language : "Source",
    goal: str(o.goal),
    minutes,
    hue,
    lessons,
    importedAt,
  };
}

/** First lesson (in course order) not done yet, or undefined when the course is finished. */
export function nextCourseLesson(course: Course, doneIds: ReadonlySet<string>): CourseLesson | undefined {
  return course.lessons.find((l) => !doneIds.has(l.id));
}

export function courseCoverage(course: Course | undefined, doneIds: ReadonlySet<string>): number {
  if (!course || course.lessons.length === 0) return 0;
  return course.lessons.filter((l) => doneIds.has(l.id)).length / course.lessons.length;
}

/** Copies questions for the review step with ids that cannot clash with today's quiz. */
function reviewCopies(list: Mcq[], max: number): Mcq[] {
  const seen = new Set<string>();
  const out: Mcq[] = [];
  for (const m of list) {
    const key = m.q.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...m, id: `rv${out.length + 1}-${m.id}` });
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Builds the session content for a course lesson. The review step recaps the
 * previous lesson, asks its recall questions and re-asks recent mistakes.
 */
export function buildCourseLesson(course: Course, lesson: CourseLesson, opts: { doneIds: ReadonlySet<string>; mistakes: Mcq[]; maxReview?: number }): LessonContent {
  const idx = course.lessons.findIndex((l) => l.id === lesson.id);
  const prev = idx > 0 ? course.lessons[idx - 1] : undefined;
  const prevDone = prev && opts.doneIds.has(prev.id) ? prev : undefined;
  const max = opts.maxReview ?? 4;
  const questions = reviewCopies([...opts.mistakes.slice(0, 2), ...(prevDone?.recall ?? [])], max);
  return {
    title: lesson.title,
    review: { recap: prevDone ? prevDone.theory.keyPoints.slice(0, 5) : [], questions },
    theory: { sections: lesson.theory.sections, keyPoints: lesson.theory.keyPoints },
    quiz: lesson.quiz,
    open: lesson.open,
    mode: "course",
    courseLessonId: lesson.id,
  };
}

/** Lessons grouped by module, in course order (for the syllabus view). */
export function courseModules(course: Course): { module: string; lessons: CourseLesson[] }[] {
  const out: { module: string; lessons: CourseLesson[] }[] = [];
  for (const l of course.lessons) {
    const m = l.module ?? "";
    if (!out.length || out[out.length - 1].module !== m) out.push({ module: m, lessons: [] });
    out[out.length - 1].lessons.push(l);
  }
  return out;
}

/**
 * Placement test for a course: two questions from each of up to `count / 2` lessons spread
 * over the course. Each question remembers its lesson (`ref`): lessons answered right
 * are treated as known and skipped. Null when the course has too few questions.
 */
export function buildCoursePlacement(course: Course, count: number, intro: string): PlacementContent | null {
  const withQ = course.lessons.filter((l) => l.quiz.length > 0);
  // two questions per lesson: one lucky guess must not skip a whole lesson
  const parts = Math.max(1, Math.ceil(count / 2));
  const picks = withQ.length <= parts ? withQ : Array.from({ length: parts }, (_, i) => withQ[Math.floor((i + 0.5) * (withQ.length / parts))]);
  const questions: Mcq[] = [];
  for (const l of picks) {
    // the harder questions: knowing the easy one does not mean knowing the lesson
    for (const q of [...l.quiz].sort((a, b) => rank(b.difficulty) - rank(a.difficulty)).slice(0, 2)) questions.push({ ...q, id: `p${questions.length + 1}`, topic: l.title, ref: l.id });
  }
  return questions.length >= 3 ? { intro, questions } : null;
}

const rank = (d?: string) => (d === "h" ? 3 : d === "m" ? 2 : 1);

/** Lessons to treat as covered when choosing what comes next: finished ones plus those the placement test showed as known. */
export function coveredLessonIds(doneIds: ReadonlySet<string>, known?: string[]): Set<string> {
  return new Set([...doneIds, ...(known ?? [])]);
}
