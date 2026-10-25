/** Lesson languages and how they relate to interface languages. Pure — unit tested. */
import type { LessonLanguage, UiLanguage } from "./types";

type UiLang = Exclude<UiLanguage, "system">;

/** Lesson language for each interface language (a new skillset's default). */
export const LESSON_LANG_OF: Record<UiLang, Exclude<LessonLanguage, "Source">> = {
  en: "English",
  ru: "Russian",
  uk: "Ukrainian",
  be: "Belarusian",
  es: "Spanish",
  de: "German",
  fr: "French",
  zh: "Chinese",
  hi: "Hindi",
};

export const LESSON_LANGUAGES: LessonLanguage[] = ["Source", ...Object.values(LESSON_LANG_OF)];

export function isLessonLanguage(v: unknown): v is LessonLanguage {
  return typeof v === "string" && (LESSON_LANGUAGES as string[]).includes(v);
}

/** Interface language id of a lesson language ("Source" has none). */
export function uiLangOfLesson(l: LessonLanguage): UiLang | null {
  const hit = (Object.entries(LESSON_LANG_OF) as [UiLang, LessonLanguage][]).find(([, v]) => v === l);
  return hit ? hit[0] : null;
}

/** How the AI is told which language to write in. */
export function languageForPrompt(l: Exclude<LessonLanguage, "Source">): string {
  return l === "Chinese" ? "Simplified Chinese" : l;
}
