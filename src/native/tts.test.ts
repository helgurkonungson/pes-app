import { describe, expect, it } from "vitest";
import { pieces, speakable, speechLang } from "./tts";

describe("text to speech helpers", () => {
  it("strips Markdown marks", () => {
    expect(speakable("## Заголовок\n\n**Права решений** важны.\n\n- владелец\n1. стюард\n[ссылка](https://x.y)")).toBe("Заголовок\nПрава решений важны.\nвладелец\nстюард\nссылка");
  });
  it("detects the language by script", () => {
    expect(speechLang("Данные — это актив")).toBe("ru-RU");
    expect(speechLang("Data is an asset")).toBe("en-US");
  });
  it("tells languages of the same script apart", () => {
    expect(speechLang("Дані — це актив, і ми їх захищаємо")).toBe("uk-UA");
    expect(speechLang("Дадзеныя — гэта актыў, і мы іх ахоўваем")).toBe("be-BY");
    expect(speechLang("Los datos son un activo de la empresa y la base de las decisiones")).toBe("es-ES");
    expect(speechLang("Die Daten sind ein Vermögenswert und die Basis der Entscheidungen")).toBe("de-DE");
    expect(speechLang("Les données sont un actif et la base des décisions")).toBe("fr-FR");
    expect(speechLang("数据是一种资产")).toBe("zh-CN");
    expect(speechLang("डेटा एक संपत्ति है")).toBe("hi-IN");
    expect(speechLang("Agile Scrum Kanban", "de-DE")).toBe("de-DE");
  });
  it("splits long text at sentence ends", () => {
    const text = Array.from({ length: 50 }, (_, i) => `Предложение номер ${i} довольно длинное.`).join(" ");
    const p = pieces(text, 300);
    expect(p.length).toBeGreaterThan(5);
    expect(p.every((x) => x.length <= 300 && x.trim().endsWith("."))).toBe(true);
    expect(p.join(" ")).toBe(text);
  });
});
