import { beforeAll, describe, expect, it } from "vitest";
import { be } from "./be";
import { de } from "./de";
import { type Dict, en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { hi } from "./hi";
import { type Lang, LANG_IDS, loadLang, locale, resolveLang, systemLang, translate } from "./index";
import { ru } from "./ru";
import { uk } from "./uk";
import { zh } from "./zh";
import type { Entry } from "./types";

const placeholders = (e: Entry): string[] => {
  const all = typeof e === "string" ? [e] : Object.values(e);
  return [...new Set(all.flatMap((s) => (s ?? "").match(/\{\w+\}/g) ?? []))].sort();
};

const OTHERS: Record<Exclude<Lang, "en">, Dict> = { ru, uk, be, es, de, fr, zh, hi };

describe("dictionaries", () => {
  for (const [lang, dict] of Object.entries(OTHERS) as [Exclude<Lang, "en">, Dict][]) {
    describe(lang, () => {
      it("has exactly the English keys", () => {
        expect(Object.keys(dict).sort()).toEqual(Object.keys(en).sort());
      });
      it("placeholders match English", () => {
        for (const k of Object.keys(en) as (keyof typeof en)[]) {
          expect([k, placeholders(dict[k])]).toEqual([k, placeholders(en[k])]);
        }
      });
      it("plural entries are plural, with every form the language needs", () => {
        const needed = new Intl.PluralRules(locale(lang)).resolvedOptions().pluralCategories.filter((c) => c !== "zero" && c !== "two");
        for (const k of Object.keys(en) as (keyof typeof en)[]) {
          const e = en[k] as Entry;
          const r = dict[k];
          expect([k, typeof r]).toEqual([k, typeof e]);
          if (typeof r === "object") for (const c of needed) expect([k, c, typeof (r as Record<string, string>)[c]]).toEqual([k, c, "string"]);
        }
      });
      it("no empty strings and nothing left untranslated by mistake", () => {
        let same = 0;
        for (const [k, v] of Object.entries(dict)) {
          for (const s of typeof v === "string" ? [v] : Object.values(v)) expect([k, (s ?? "").trim().length > 0]).toEqual([k, true]);
          if (JSON.stringify(v) === JSON.stringify((en as Record<string, Entry>)[k])) same++;
        }
        // brand names, formats and the like may stay as in English — but not whole screens
        expect(same).toBeLessThan(40);
      });
    });
  }
  it("every interface language has a dictionary", () => {
    expect(LANG_IDS.filter((l) => l !== "en").sort()).toEqual(Object.keys(OTHERS).sort());
  });
});

describe("translate", () => {
  beforeAll(async () => {
    for (const l of LANG_IDS) await loadLang(l);
  });
  it("interpolates params and keeps unknown ones", () => {
    expect(translate("en", "home.hello", { name: "Oleg" })).toBe("Hi, Oleg!");
    expect(translate("ru", "home.hello", { name: "Олег" })).toBe("Привет, Олег!");
    expect(translate("en", "home.hello")).toBe("Hi, {name}!");
  });
  it("picks Russian plural forms", () => {
    const f = (n: number) => translate("ru", "stat.lessonsN", { n });
    expect([f(1), f(2), f(5), f(11), f(21), f(22), f(0)]).toEqual(["1 урок", "2 урока", "5 уроков", "11 уроков", "21 урок", "22 урока", "0 уроков"]);
  });
  it("picks English plural forms and formats numbers", () => {
    expect(translate("en", "stat.lessonsN", { n: 1 })).toBe("1 lesson");
    expect(translate("en", "stat.lessonsN", { n: 3 })).toBe("3 lessons");
    expect(translate("en", "sources.words", { n: 309484 })).toBe("309,484 words");
    expect(translate("ru", "sources.words", { n: 309484 }).replace(/\s/g, " ")).toBe("309 484 слова");
  });
  it("picks Ukrainian and Belarusian plural forms", () => {
    const u = (n: number) => translate("uk", "stat.lessonsN", { n });
    expect([u(1), u(3), u(5), u(21)]).toEqual(["1 урок", "3 уроки", "5 уроків", "21 урок"]);
    const b = (n: number) => translate("be", "stat.lessonsN", { n });
    expect([b(1), b(3), b(5)]).toEqual(["1 урок", "3 урокі", "5 урокаў"]);
  });
  it("formats numbers per language", () => {
    expect(translate("de", "sources.words", { n: 309484 })).toBe("309.484 Wörter");
    expect(translate("zh", "stat.lessonsN", { n: 2 })).toBe("2 节课");
  });
  it("resolves the language preference", () => {
    expect(resolveLang("ru")).toBe("ru");
    expect(resolveLang("en")).toBe("en");
    expect(resolveLang("hi")).toBe("hi");
    expect(LANG_IDS).toContain(resolveLang("system"));
  });
  it("follows the phone: first supported language in its list, CIS phones → Russian, else English", () => {
    expect(systemLang(["uk-UA", "ru-RU"])).toBe("uk");
    expect(systemLang(["be-BY"])).toBe("be");
    expect(systemLang(["kk-KZ"])).toBe("ru");
    expect(systemLang(["zh-Hans-CN"])).toBe("zh");
    expect(systemLang(["zh-TW"])).toBe("zh");
    expect(systemLang(["ja-JP", "fr-CA"])).toBe("fr");
    expect(systemLang(["ja-JP"])).toBe("en");
    expect(systemLang([])).toBe("en");
  });
});
