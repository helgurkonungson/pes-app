import { describe, expect, it } from "vitest";
import type { Page } from "./flow";
import { buildReport, DEFAULT_REPORT_EMAIL, EXCERPT_MAX, MAILTO_BODY_MAX, pageText, pageWhere, reportMailto, reportsToText } from "./report";
import type { LessonContent } from "./types";

const lesson = { title: "Права решений", mode: "ai" } as LessonContent;
const theory: Page = { kind: "theory", step: "theory", section: { heading: "Кто решает", body: "Тело" }, index: 1, of: 3, keyPoints: ["Пункт"] };
const mcq: Page = { kind: "mcq", step: "quiz", mcq: { id: "q", q: "Вопрос?", options: ["Да", "Нет"], answer: 0, explanation: "Потому что" }, index: 0, of: 2 };

describe("lesson reports", () => {
  it("takes the text of the page on screen", () => {
    expect(pageText(theory)).toBe("Кто решает\nТело\nПункт");
    expect(pageText(mcq)).toBe("Вопрос?\nA) Да\nB) Нет\nПотому что");
    expect(pageText({ kind: "pending", step: "quiz" })).toBe("");
  });
  it("says where the learner was", () => {
    expect(pageWhere({ kind: "lesson" }, theory)).toBe("lesson · theory 2/3");
    expect(pageWhere({ kind: "placement" }, { kind: "intro", step: "placement", text: "x", count: 3 })).toBe("placement · placement");
  });
  it("builds a report with provider only for AI content and cuts long text", () => {
    const r = buildReport({ session: { id: "s", skillsetId: "k", kind: "lesson", lesson }, page: { ...theory, section: { heading: "H", body: "x".repeat(5000) } }, reason: "wrong", comment: "  неверно  ", provider: "gemini", model: "flash", version: "0.13.0", at: "2026-10-25T10:00:00Z" });
    expect(r.excerpt.length).toBe(EXCERPT_MAX);
    expect(r.comment).toBe("неверно");
    expect(r.provider).toBe("gemini");
    expect(r.mode).toBe("ai");
    const offline = buildReport({ session: { id: "s", skillsetId: "k", kind: "lesson", lesson: { ...lesson, mode: "offline" } }, page: mcq, reason: "other", provider: "gemini", model: "flash", version: "0.13.0", at: "x" });
    expect(offline.provider).toBeUndefined();
    expect(offline.comment).toBeUndefined();
  });
  it("reads as plain text", () => {
    const r = buildReport({ session: { id: "s", skillsetId: "k", kind: "lesson", lesson }, text: "Текст урока", reason: "harmful", version: "0.13.0", at: "T" });
    const txt = reportsToText([r]);
    expect(txt).toContain("Reason: harmful");
    expect(txt).toContain("lesson · history");
    expect(txt).toContain("Текст урока");
  });
  it("goes to the support address as a ready e-mail, cut to what mail apps accept", () => {
    expect(DEFAULT_REPORT_EMAIL).toBe("support@chompbook.online");
    const url = reportMailto(DEFAULT_REPORT_EMAIL, "Chompbook: жалоба", "Причина: wrong\nТекст & ещё");
    expect(url.startsWith("mailto:support@chompbook.online?subject=")).toBe(true);
    expect(decodeURIComponent(url.split("&body=")[1])).toBe("Причина: wrong\nТекст & ещё");
    const long = reportMailto("a@b.c", "s", "x".repeat(MAILTO_BODY_MAX * 2));
    expect(decodeURIComponent(long.split("&body=")[1]).length).toBe(MAILTO_BODY_MAX);
  });
});
