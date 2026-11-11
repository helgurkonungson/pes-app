/**
 * Built-in courses (ADR-031): five short starter courses in every interface language, free,
 * no AI needed. Sources are text files (`<slug>/<lang>.md`, format in core/courseText.ts);
 * each one is a lazy chunk, so only the course the learner opens is loaded.
 */
import type { Lang } from "../i18n";
import type { LessonLanguage } from "../core/types";

export interface BuiltinCourse {
  slug: string;
  /** Lucide icon name (see components/BuiltinCourseIcon). */
  icon: "brain" | "sparkles" | "table" | "wallet" | "lightbulb";
  hue: number;
}

export const BUILTIN_COURSES: BuiltinCourse[] = [
  { slug: "learning", icon: "brain", hue: 45 },
  { slug: "ai", icon: "sparkles", hue: 265 },
  { slug: "data", icon: "table", hue: 174 },
  { slug: "money", icon: "wallet", hue: 140 },
  { slug: "thinking", icon: "lightbulb", hue: 20 },
];

export const COURSE_LANGS: Lang[] = ["ru", "en", "uk", "be", "es", "de", "fr", "zh", "hi"];

/** Interface languages without their own course texts read the course of a close language (Kazakh → Russian, Turkish → English). */
const COURSE_FALLBACK: Partial<Record<Lang, Lang>> = { kk: "ru", tr: "en" };

/** The language whose course texts a learner in this interface language gets. */
export function courseLang(lang: Lang): Lang {
  return COURSE_FALLBACK[lang] ?? lang;
}

const LANGUAGE: Partial<Record<Lang, LessonLanguage>> = {
  ru: "Russian",
  en: "English",
  uk: "Ukrainian",
  be: "Belarusian",
  es: "Spanish",
  de: "German",
  fr: "French",
  zh: "Chinese",
  hi: "Hindi",
};

export function courseLanguageFor(lang: Lang): LessonLanguage {
  return LANGUAGE[courseLang(lang)] ?? "English";
}

/** Course id of a built-in course in a language ("cb-learning-ru"). */
export function builtinCourseId(slug: string, lang: Lang): string {
  return `cb-${slug}-${courseLang(lang)}`;
}

const FILES = import.meta.glob("./*/*.md", { query: "?raw", import: "default" }) as Record<string, () => Promise<string>>;

/** Source text of a built-in course; falls back to English for a language without it. */
export async function loadBuiltinCourse(slug: string, lang: Lang): Promise<string> {
  const load = FILES[`./${slug}/${courseLang(lang)}.md`] ?? FILES[`./${slug}/en.md`];
  if (!load) throw new Error(`no built-in course ${slug}`);
  return load();
}
