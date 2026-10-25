import { describe, expect, it } from "vitest";
import { isLessonLanguage, LESSON_LANG_OF, LESSON_LANGUAGES, languageForPrompt, uiLangOfLesson } from "./languages";

describe("lesson languages", () => {
  it("every interface language has a lesson language and back", () => {
    for (const [ui, lesson] of Object.entries(LESSON_LANG_OF)) expect(uiLangOfLesson(lesson)).toBe(ui);
    expect(uiLangOfLesson("Source")).toBeNull();
    expect(LESSON_LANGUAGES).toHaveLength(10);
  });
  it("validates stored values", () => {
    expect(isLessonLanguage("Spanish")).toBe(true);
    expect(isLessonLanguage("Klingon")).toBe(false);
  });
  it("asks for simplified Chinese", () => {
    expect(languageForPrompt("Chinese")).toBe("Simplified Chinese");
    expect(languageForPrompt("German")).toBe("German");
  });
});
