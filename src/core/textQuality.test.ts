import { describe, expect, it } from "vitest";
import { dominantScript, scriptOfLanguage, textQuality } from "./textQuality";

// from a real broken lesson (0.20 internal test, a weak free model)
const salad = `Противопоказания: дерматит,Contact дерматит без обострения), беременность, лактацию, склонность к кровотечениям.
**Инфицированный контроль.** Перед процедурой обязательна ФТОЛОГИЧЕСКА ФАЙЛИНГАМДИЯ — предварительный осмотр, а затем ЭЛЕКТРИЧЕСКИЙ ФАЙЛИНГ азотом на глубину до 1 мм для ликвидации патогенных микроорганизмов.Proto кожным препаратам проводят рефлекторную пробу.
**Действия при нестандартных реакциях кожи.** Потовые闭塞, гиперемия >3 см, локальная сыпь. АВТОМАТИЧЕСКОЕ ОТВОЛЕНЕЕ КОЖИ (empetric erythema) — наиболее частая реакция.`;

const goodRu = `**Лазерная эпиляция** работает за счет фототермолиза: свет поглощается меланином волоса и нагревает фолликул. Перед процедурой специалист проверяет противопоказания — беременность, активный дерматит, прием ретиноидов. IPL-терапия и диодный лазер (808 нм) различаются длиной волны. Например, при II фототипе по Фицпатрику обычно нужно 6–8 сеансов с интервалом 4–6 недель. Термины вроде ВОЗ, ДНК или API пишутся заглавными, и это нормально; слово «你好» в кавычках тоже не беда.`;

const goodEn = "Spaced repetition schedules reviews at growing intervals. For example, review after 1 day, then 3, then 7. Ebbinghaus measured how memory fades (the forgetting curve).";
const goodZh = "间隔重复是一种学习方法：使用Anki等工具，在第1天、第3天和第7天复习。这样可以减缓遗忘曲线。";

describe("lesson text sanity check (0.21)", () => {
  it("flags word salad from a weak model", () => {
    const q = textQuality(salad, "Cyrillic");
    expect(q.garbled).toBe(true);
    expect(q.issues.join(" ")).toMatch(/glued scripts/);
    expect(q.issues.join(" ")).toMatch(/capitalised words/);
    expect(q.issues.join(" ")).toMatch(/other scripts: 闭塞/);
  });
  it("accepts normal lessons, with terms, abbreviations and a quoted foreign word", () => {
    expect(textQuality(goodRu, "Cyrillic")).toMatchObject({ garbled: false });
    expect(textQuality(goodEn, "Latin")).toMatchObject({ garbled: false, score: 0 });
    expect(textQuality(goodZh, "Han")).toMatchObject({ garbled: false, score: 0 }); // Latin glued into Chinese is normal
  });
  it("flags a lesson in the wrong language", () => {
    const q = textQuality(goodEn + " " + goodEn, "Cyrillic");
    expect(q.garbled).toBe(true);
    expect(q.issues[0]).toMatch(/wrong script/);
  });
  it("flags loops and broken characters", () => {
    expect(textQuality("Это важно важно важно важно для понимания темы.", "Cyrillic").garbled).toBe(true);
    expect(textQuality("Ответ ��� неясен.", "Cyrillic").garbled).toBe(true);
  });
  it("knows each lesson language's script and finds the material's script", () => {
    expect(scriptOfLanguage("Russian")).toBe("Cyrillic");
    expect(scriptOfLanguage("German")).toBe("Latin");
    expect(scriptOfLanguage("Chinese")).toBe("Han");
    expect(scriptOfLanguage("Hindi")).toBe("Devanagari");
    expect(scriptOfLanguage("Source")).toBeNull();
    expect(dominantScript(goodRu)).toBe("Cyrillic");
    expect(dominantScript("123 —")).toBeNull();
  });
});
