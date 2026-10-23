import { describe, expect, it } from "vitest";
import { en } from "./en";
import { resolveLang, translate } from "./index";
import { ru } from "./ru";
import type { Entry } from "./types";

const placeholders = (e: Entry): string[] => {
  const all = typeof e === "string" ? [e] : Object.values(e);
  return [...new Set(all.flatMap((s) => (s ?? "").match(/\{\w+\}/g) ?? []))].sort();
};

describe("dictionaries", () => {
  it("Russian has exactly the English keys", () => {
    expect(Object.keys(ru).sort()).toEqual(Object.keys(en).sort());
  });
  it("placeholders match between languages", () => {
    for (const k of Object.keys(en) as (keyof typeof en)[]) {
      expect([k, placeholders(ru[k])]).toEqual([k, placeholders(en[k])]);
    }
  });
  it("plural entries are plural in both languages, with all Russian forms", () => {
    for (const k of Object.keys(en) as (keyof typeof en)[]) {
      const e = en[k] as Entry;
      const r = ru[k];
      expect([k, typeof r]).toEqual([k, typeof e]);
      if (typeof r === "object") {
        expect([k, Object.keys(r).sort()]).toEqual([k, ["few", "many", "one", "other"]]);
      }
    }
  });
  it("no empty strings", () => {
    for (const [k, v] of Object.entries(ru)) for (const s of typeof v === "string" ? [v] : Object.values(v)) expect([k, (s ?? "").trim().length > 0]).toEqual([k, true]);
  });
});

describe("translate", () => {
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
  it("resolves the language preference", () => {
    expect(resolveLang("ru")).toBe("ru");
    expect(resolveLang("en")).toBe("en");
    expect(["en", "ru"]).toContain(resolveLang("system"));
  });
});
