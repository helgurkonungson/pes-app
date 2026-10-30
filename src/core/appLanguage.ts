/**
 * Android 13+ per-app language (Settings → Apps → Chompbook → Language) and the language chosen
 * inside the app stay in step (0.19.2). Pure: the native side only reads and writes the tag.
 *
 * `pushed` is the tag the app last wrote to Android (null = never). When Android's value differs
 * from the app's and the app's value is still what we pushed, the learner changed it in Android
 * Settings → the app adopts it. Otherwise the app's choice is newer → it is pushed to Android.
 */
import type { UiLanguage } from "./types";

const LANGS = ["en", "ru", "uk", "be", "es", "de", "fr", "zh", "hi"] as const;
type Lang = (typeof LANGS)[number];

/** Android language tag for an app language ("" = follow the system). */
export function tagOf(lang: UiLanguage): string {
  return lang === "system" ? "" : lang === "zh" ? "zh-CN" : lang;
}

/** App language for an Android tag; unknown or empty → "system". */
export function langOfTag(tag: string): UiLanguage {
  const l = tag.trim().toLowerCase().split(/[-_]/)[0];
  return (LANGS as readonly string[]).includes(l) ? (l as Lang) : "system";
}

export type LanguageSync = { kind: "none" } | { kind: "adopt"; lang: UiLanguage } | { kind: "push"; tag: string };

export function syncAppLanguage(app: UiLanguage, systemTag: string, pushed: string | null): LanguageSync {
  const system = langOfTag(systemTag);
  if (system === app) return { kind: "none" };
  if (pushed !== null && pushed === tagOf(app)) return { kind: "adopt", lang: system };
  return { kind: "push", tag: tagOf(app) };
}
