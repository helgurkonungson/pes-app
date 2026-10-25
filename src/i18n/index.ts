/**
 * Tiny i18n: typed keys, {param} interpolation and plural forms via
 * Intl.PluralRules. English is the reference dictionary and the only one in the
 * main bundle; every other language is a separate chunk loaded on demand
 * (`loadLang`) before it is shown — the start screen never flashes English.
 * Every language must define the same keys (enforced by the type and a unit test).
 */
import { useCallback } from "react";
import { create } from "zustand";
import type { UiLanguage } from "../core/types";
import { en, type Dict, type Key } from "./en";
import type { Entry, Plural } from "./types";

export type Lang = Exclude<UiLanguage, "system">;
export type { Key, Dict };
export type { Entry, Plural };

/** Interface languages: id, the name in the language itself, BCP-47 locale for dates and numbers. */
export const LANGS: { id: Lang; label: string; locale: string }[] = [
  { id: "en", label: "English", locale: "en-GB" },
  { id: "ru", label: "Русский", locale: "ru-RU" },
  { id: "uk", label: "Українська", locale: "uk-UA" },
  { id: "be", label: "Беларуская", locale: "be-BY" },
  { id: "es", label: "Español", locale: "es-ES" },
  { id: "de", label: "Deutsch", locale: "de-DE" },
  { id: "fr", label: "Français", locale: "fr-FR" },
  { id: "zh", label: "中文（简体）", locale: "zh-CN" },
  { id: "hi", label: "हिन्दी", locale: "hi-IN" },
];
export const LANG_IDS = LANGS.map((l) => l.id);

export function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (LANG_IDS as string[]).includes(v);
}

/** Dictionaries in memory; English is always there (the fallback for a missing key). */
const DICTS: Partial<Record<Lang, Dict>> = { en };

// one chunk per language — only the one in use is loaded
const LOADERS: Record<Exclude<Lang, "en">, () => Promise<Dict>> = {
  ru: () => import("./ru").then((m) => m.ru),
  uk: () => import("./uk").then((m) => m.uk),
  be: () => import("./be").then((m) => m.be),
  es: () => import("./es").then((m) => m.es),
  de: () => import("./de").then((m) => m.de),
  fr: () => import("./fr").then((m) => m.fr),
  zh: () => import("./zh").then((m) => m.zh),
  hi: () => import("./hi").then((m) => m.hi),
};

/** Loads a language's dictionary (once). Never throws: on failure the UI stays in English for that language. */
export async function loadLang(lang: Lang): Promise<void> {
  if (DICTS[lang]) return;
  try {
    DICTS[lang] = await LOADERS[lang as Exclude<Lang, "en">]();
  } catch {
    /* chunk missing — translate() falls back to English */
  }
}

const CACHE_KEY = "pes.lang";

/** The phone's language if we have it (first match in the phone's preference list), else English. */
export function systemLang(list: readonly (string | undefined)[] = typeof navigator !== "undefined" ? [...(navigator.languages ?? []), navigator.language] : []): Lang {
  for (const tag of list) {
    const base = (tag ?? "").toLowerCase().split(/[-_]/)[0];
    if (isLang(base)) return base;
    if (base === "kk" || base === "ky" || base === "tg") return "ru"; // CIS phones without their own UI language
  }
  return "en";
}

export function resolveLang(pref: UiLanguage | undefined): Lang {
  return isLang(pref) ? pref : systemLang();
}

function cached(): Lang | null {
  try {
    const v = localStorage.getItem(CACHE_KEY);
    return isLang(v) ? v : null;
  } catch {
    return null;
  }
}

function apply(lang: Lang): void {
  try {
    localStorage.setItem(CACHE_KEY, lang);
  } catch {
    /* private mode etc. */
  }
  if (typeof document !== "undefined") document.documentElement.lang = lang;
}

let pending = 0;

export const useLang = create<{ lang: Lang; set: (l: Lang) => void }>((set) => ({
  lang: cached() ?? systemLang(),
  set: (lang) => {
    const my = ++pending;
    const commit = () => {
      if (my !== pending) return; // a later choice wins
      apply(lang);
      set({ lang });
    };
    if (DICTS[lang]) commit();
    else void loadLang(lang).then(commit);
  },
}));

if (typeof document !== "undefined") document.documentElement.lang = useLang.getState().lang;

/** Loads the dictionary of the language chosen at start; call before the first render. */
export function initLang(): Promise<void> {
  return loadLang(useLang.getState().lang);
}

export type Params = Record<string, string | number>;

function interpolate(s: string, params?: Params): string {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (params[k] !== undefined ? String(params[k]) : m));
}

const pluralRules = new Map<Lang, Intl.PluralRules>();

export function translate(lang: Lang, key: Key, params?: Params): string {
  const dict = DICTS[lang] ?? en;
  const own = (dict as Record<string, Entry>)[key];
  const entry: Entry | undefined = own ?? (en as Record<string, Entry>)[key];
  if (entry === undefined) return key;
  const l = own === undefined ? "en" : lang;
  if (typeof entry === "string") return interpolate(entry, params);
  const n = Number(params?.n ?? 0);
  let rules = pluralRules.get(l);
  if (!rules) {
    rules = new Intl.PluralRules(locale(l));
    pluralRules.set(l, rules);
  }
  const form = rules.select(n) as keyof Plural;
  return interpolate(entry[form] ?? entry.other, { ...params, n: n.toLocaleString(locale(l)) });
}

/** Translate outside React (services, toasts). */
export function t(key: Key, params?: Params): string {
  return translate(useLang.getState().lang, key, params);
}

export type T = (key: Key, params?: Params) => string;

/** Translate inside React; re-renders when the language changes. */
export function useT(): T {
  const lang = useLang((s) => s.lang);
  return useCallback((key: Key, params?: Params) => translate(lang, key, params), [lang]);
}

export function locale(lang: Lang = useLang.getState().lang): string {
  return LANGS.find((l) => l.id === lang)?.locale ?? "en-GB";
}
