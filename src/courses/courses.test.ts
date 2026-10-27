/**
 * Built-in courses (ADR-031): every file parses, every language has the same lessons and
 * questions with the right answer in the same place as the Russian original, and the texts
 * are really translated (no leftover lines from another language).
 */
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseCourse } from "../core/course";
import { courseFromText, type RawCourse } from "../core/courseText";
import { BUILTIN_COURSES, COURSE_LANGS, courseLanguageFor } from "./index";

const dir = new URL("./", import.meta.url);
const read = (slug: string, lang: string) => readFileSync(new URL(`${slug}/${lang}.md`, dir), "utf8");
const present = (slug: string) => readdirSync(new URL(`${slug}/`, dir)).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""));

const shape = (c: RawCourse) =>
  c.lessons.map((l) => ({
    id: l.id,
    sections: l.theory.sections.length,
    keys: l.theory.keyPoints.length,
    quiz: l.quiz.map((q) => [q.options.length, q.answer, q.difficulty]),
    recall: l.recall.map((q) => [q.options.length, q.answer, q.difficulty]),
    rubric: l.open.rubric.length,
    model: !!l.open.modelAnswer,
  }));

describe("built-in courses", () => {
  for (const c of BUILTIN_COURSES) {
    describe(c.slug, () => {
      const original = () => courseFromText(read(c.slug, "ru"));

      it("exists in every interface language", () => {
        expect(present(c.slug).sort()).toEqual([...COURSE_LANGS].sort());
      });

      it("is a well-formed course: 8 lessons, 3–4 quiz and 2 recall questions each, an open question with a model answer", () => {
        const ru = original();
        const parsed = parseCourse(ru, "2026-10-26T00:00:00Z");
        expect(parsed.lessons).toHaveLength(8);
        for (const l of ru.lessons) {
          expect([l.id, l.quiz.length >= 3 && l.quiz.length <= 4]).toEqual([l.id, true]);
          expect([l.id, l.recall.length]).toEqual([l.id, 2]);
          expect([l.id, l.theory.keyPoints.length]).toEqual([l.id, 4]);
          expect([l.id, l.open.rubric.length >= 2, l.open.modelAnswer.length > 40]).toEqual([l.id, true, true]);
          for (const q of [...l.quiz, ...l.recall]) {
            expect([q.q, q.options.length]).toEqual([q.q, 4]);
            expect([q.q, new Set(q.options).size]).toEqual([q.q, 4]);
            expect([q.q, q.explanation.length > 10]).toEqual([q.q, true]);
          }
        }
        // right answers are spread over the positions, not always the same one
        const positions = new Set(ru.lessons.flatMap((l) => [...l.quiz, ...l.recall].map((q) => q.answer)));
        expect(positions.size).toBeGreaterThanOrEqual(3);
      });

      for (const lang of COURSE_LANGS) {
        it(`${lang}: same structure and answers as the original`, () => {
          const ru = original();
          const tr = courseFromText(read(c.slug, lang));
          expect(tr.id).toBe(`cb-${c.slug}-${lang}`);
          expect(tr.language).toBe(courseLanguageFor(lang));
          expect(tr.hue).toBe(ru.hue);
          expect(shape(tr)).toEqual(shape(ru));
          expect(() => parseCourse(tr, "2026-10-26T00:00:00Z")).not.toThrow();
        });
      }

      it("translations contain no Cyrillic where the language doesn't use it, and Latin-script languages no CJK/Devanagari", () => {
        for (const lang of COURSE_LANGS) {
          const text = read(c.slug, lang).replace(/^---[\s\S]*?---/, "");
          const cyr = (text.match(/[А-Яа-яЁё]/g) ?? []).length;
          if (["en", "es", "de", "fr", "zh", "hi"].includes(lang)) expect([lang, cyr]).toEqual([lang, 0]);
          if (lang === "zh") expect((text.match(/[一-鿿]/g) ?? []).length).toBeGreaterThan(1000);
          if (lang === "hi") expect((text.match(/[ऀ-ॿ]/g) ?? []).length).toBeGreaterThan(1000);
          if (lang === "uk") expect(/[іїєґ]/i.test(text)).toBe(true);
          if (lang === "be") expect(/[іў]/i.test(text)).toBe(true);
        }
      });
    });
  }
});
