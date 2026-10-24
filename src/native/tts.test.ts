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
  it("splits long text at sentence ends", () => {
    const text = Array.from({ length: 50 }, (_, i) => `Предложение номер ${i} довольно длинное.`).join(" ");
    const p = pieces(text, 300);
    expect(p.length).toBeGreaterThan(5);
    expect(p.every((x) => x.length <= 300 && x.trim().endsWith("."))).toBe(true);
    expect(p.join(" ")).toBe(text);
  });
});
