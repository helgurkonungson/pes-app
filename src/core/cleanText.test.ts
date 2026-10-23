import { describe, expect, it } from "vitest";
import { analyzeChunks, cleanSourceText, lessonChunks } from "./cleanText";
import { buildOfflineLesson, type OfflineLabels } from "./offline";
import type { Chunk } from "./types";

const prose = (topic: string, n = 6) =>
  Array.from({ length: n }, (_, i) => `${topic} — это важная тема номер ${i + 1}, и руководитель данных объясняет её команде на понятных примерах из практики компании.`).join(" ");

let order = 0;
const chunk = (title: string, text: string, sourceId = "book"): Chunk => ({ id: `c${order}`, skillsetId: "sk", sourceId, order: order++, title, text, words: text.split(/\s+/).length });

function book(): Chunk[] {
  order = 0;
  return [
    chunk("p. 1", "ИВАН ПЕТРОВ\nУПРАВЛЕНИЕ ДАННЫМИ\nПрактическое руководство\nМосква\nИздательство «Пример»\n2024"),
    chunk("p. 2", "УДК 004.6\nББК 32.97\nISBN 978-5-00000-000-0\n© Иван Петров, 2024\nВсе права защищены. Никакая часть этой книги не может быть воспроизведена без письменного разрешения владельцев авторских прав."),
    chunk("Содержание", "Предисловие . . . . . . . . . 7\nВведение ............ 9\nГлава 1. Что такое данные ........ 13\nГлава 2. Качество данных ........ 41\nГлава 3. Метаданные ........ 77\nПредметный указатель ........ 301"),
    chunk("Предисловие", prose("Эта книга писалась долго")),
    chunk("Введение", prose("Введение в предмет")),
    chunk("p. 13", `Глава 1. Что такое данные\n${prose("Данные")}\n\n${prose("Информация")}`),
    chunk("p. 41", `Глава 2. Качество данных\n${prose("Качество")}`),
    chunk("p. 77", `Глава 3. Метаданные\n${prose("Метаданные")}`),
    chunk("p. 280", `Глава 4. Итоги\n${prose("Итоги")}`),
    chunk("Предметный указатель", "Данные, 13, 15, 40\nКачество, 41\nМетаданные, 77, 80\nСтюард, 90\nВладелец, 91\nКаталог, 120\nЛинейность, 130"),
  ];
}

describe("cleaning book text", () => {
  it("removes control characters, invisible marks, PDF glyphs, page numbers and dot leaders", () => {
    const raw = "Глава\u0000 1\u0007\n\n12\n\nДан­ные — это​ факты.�\nКачест-\nво данных ............ 41\n• • • ■ ◆\n— 7 —\nxii\nﬁnal ﬂow";
    const out = cleanSourceText(raw);
    expect(out).not.toMatch(/[\u0000-\u0008\u000B-\u001F­​�-]/);
    expect(out).toContain("Данные — это факты.");
    expect(out).toContain("Качество данных");
    expect(out).not.toMatch(/\.{4}|41/);
    expect(out).not.toMatch(/(^|\n)(12|— 7 —|xii|• • • ■ ◆)(\n|$)/);
    expect(out).toContain("final flow");
  });
  it("is idempotent (saved reading positions stay valid)", () => {
    const once = cleanSourceText("Текст\u0001 с мусором ..... 5\n\n\n\n3\nи ещё абзац.");
    expect(cleanSourceText(once)).toBe(once);
  });
  it("keeps ordinary text untouched", () => {
    const t = "Стюард данных отвечает за правила качества.\n\nВладелец утверждает определения.";
    expect(cleanSourceText(t)).toBe(t);
  });
});

describe("front and back matter", () => {
  it("lessons start at Chapter 1: title page, imprint, contents, preface and introduction are skipped; the index too", () => {
    const chunks = book();
    const kept = lessonChunks(chunks).map((c) => c.title);
    expect(kept).toEqual(["p. 13", "p. 41", "p. 77", "p. 280"]);
  });
  it("the contents page (which also lists 'Глава 1') is not mistaken for the start", () => {
    const { skip } = analyzeChunks(book());
    expect(skip.has("c2")).toBe(true);
    expect(skip.has("c5")).toBe(false);
  });
  it("front matter inside the same chunk as Chapter 1 is cut off", () => {
    order = 0;
    const chunks = [chunk("pp. 1–14", `Предисловие\n${prose("Книга о данных", 2)}\n\nГлава 1. Основы\n${prose("Основы")}`), chunk("p. 15", prose("Продолжение"))];
    const first = lessonChunks(chunks)[0];
    expect(first.text.startsWith("Глава 1. Основы")).toBe(true);
  });
  it("without chapter headings, recognisable front matter near the start is still skipped", () => {
    order = 0;
    const chunks = [chunk("Copyright", "Copyright © 2023 Jane Doe. All rights reserved. ISBN 978-1-00000-000-0. Published by Example Publishing."), chunk("Preface", prose("Why I wrote this")), chunk("Data owners", prose("Owners")), chunk("Stewards", prose("Stewards"))];
    expect(lessonChunks(chunks).map((c) => c.title)).toEqual(["Data owners", "Stewards"]);
  });
  it("never skips a whole source and leaves ordinary notes alone", () => {
    order = 0;
    const notes = [chunk("Введение", prose("Мои заметки"), "notes")];
    expect(lessonChunks(notes)).toHaveLength(1);
    const plain = [chunk("Тема 1", prose("Тема"), "a"), chunk("Тема 2", prose("Ещё тема"), "a")];
    expect(lessonChunks(plain)).toHaveLength(2);
  });
  it("an offline lesson from such a book teaches Chapter 1, not the preface", () => {
    const labels: OfflineLabels = { title: (c) => c, part: (c, i, n) => `${c} ${i}/${n}`, gapQuestion: (g) => g, gapExplain: (s) => s, gapTopic: "t", openQuestion: (c) => c };
    const lesson = buildOfflineLesson({ chunks: lessonChunks(book()), cursor: 0, cursorWord: 0, minutes: 5, mistakes: [], labels, seed: 1 });
    const body = lesson.theory.sections.map((s) => s.body).join(" ");
    expect(body).toContain("Глава 1. Что такое данные");
    expect(body).not.toMatch(/Предисловие|ISBN|писалась долго/);
  });
});
