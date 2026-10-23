/**
 * Tiny i18n: typed keys, {param} interpolation and plural forms via
 * Intl.PluralRules. English is the reference dictionary; every other language
 * must define the same keys (enforced by the type and a unit test).
 */
import { useCallback } from "react";
import { create } from "zustand";
import type { UiLanguage } from "../core/types";
import { en, type Dict, type Key } from "./en";
import { ru } from "./ru";
import type { Entry, Plural } from "./types";

export type Lang = "en" | "ru";
export type { Key };
export type { Entry, Plural };

export const DICTS: Record<Lang, Dict> = { en, ru };
export const LANGS: { id: Lang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "ru", label: "Русский" },
];

const CACHE_KEY = "pes.lang";

export function systemLang(): Lang {
  const list = typeof navigator !== "undefined" ? [...(navigator.languages ?? []), navigator.language] : [];
  return list.some((l) => /^(ru|be|uk|kk)\b/i.test(l ?? "")) ? "ru" : "en";
}

export function resolveLang(pref: UiLanguage | undefined): Lang {
  return pref === "en" || pref === "ru" ? pref : systemLang();
}

function cached(): Lang | null {
  try {
    const v = localStorage.getItem(CACHE_KEY);
    return v === "en" || v === "ru" ? v : null;
  } catch {
    return null;
  }
}

export const useLang = create<{ lang: Lang; set: (l: Lang) => void }>((set) => ({
  lang: cached() ?? systemLang(),
  set: (lang) => {
    try {
      localStorage.setItem(CACHE_KEY, lang);
    } catch {
      /* private mode etc. */
    }
    if (typeof document !== "undefined") document.documentElement.lang = lang;
    set({ lang });
  },
}));

if (typeof document !== "undefined") document.documentElement.lang = useLang.getState().lang;

export type Params = Record<string, string | number>;

function interpolate(s: string, params?: Params): string {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (params[k] !== undefined ? String(params[k]) : m));
}

const pluralRules = new Map<Lang, Intl.PluralRules>();

export function translate(lang: Lang, key: Key, params?: Params): string {
  const entry: Entry | undefined = (DICTS[lang] as Record<string, Entry>)[key] ?? (en as Record<string, Entry>)[key];
  if (entry === undefined) return key;
  if (typeof entry === "string") return interpolate(entry, params);
  const n = Number(params?.n ?? 0);
  let rules = pluralRules.get(lang);
  if (!rules) {
    rules = new Intl.PluralRules(lang);
    pluralRules.set(lang, rules);
  }
  const form = rules.select(n) as keyof Plural;
  return interpolate(entry[form] ?? entry.other, { ...params, n: n.toLocaleString(lang === "ru" ? "ru-RU" : "en-US") });
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
  return lang === "ru" ? "ru-RU" : "en-GB";
}
