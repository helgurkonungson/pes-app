/**
 * When the app checks GitHub for a new version on its own: once a day, on the
 * first launch (or return to the app) of that local day. Pure — unit tested.
 */
import { compareVersions } from "./semver";
import type { UpdateCheck, UpdateInfo } from "./types";

/** True when today's automatic check has not happened yet (a failed check is not recorded, so it is retried). */
export function isUpdateCheckDue(last: UpdateCheck | undefined, today: string): boolean {
  return last?.day !== today;
}

/** The update found by an earlier check, if it is still newer than the running app (after installing it, it isn't). */
export function pendingUpdate(last: UpdateCheck | undefined, appVersion: string): UpdateInfo | null {
  const a = last?.available;
  return a && compareVersions(a.version, appVersion) > 0 ? a : null;
}

/** Release notes for the pop-up: without the leading version heading, cut to a readable length. */
/**
 * Release notes may hold one section per language (written by tools/release-notes.mjs):
 * `<!--lang:ru-->…<!--lang:en-->…`. Returns the section for `lang`, else English, else
 * the first one; notes without markers are returned as they are.
 */
export function notesForLang(notes: string, lang: string): string {
  const parts = notes.replace(/\r/g, "").split(/<!--\s*lang:([a-z-]+)\s*-->/i);
  if (parts.length < 3) return notes;
  const map = new Map<string, string>();
  for (let i = 1; i < parts.length; i += 2) map.set(parts[i].toLowerCase(), parts[i + 1].replace(/\n-{3,}\s*$/, "").trim());
  return map.get(lang) || map.get("en") || [...map.values()][0] || "";
}

export function notesPreview(notes: string, max = 1200): string {
  const text = notes.replace(/\r/g, "").replace(/^#+ .*\n+/, "").trim();
  if (text.length <= max) return text;
  const cut = text.lastIndexOf("\n", max);
  return `${text.slice(0, cut > max / 2 ? cut : max).trimEnd()}\n…`;
}
