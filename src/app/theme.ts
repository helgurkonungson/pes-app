/**
 * Light / dark theme (ADR-022). The choice ("system" by default) lives in the profile and is
 * mirrored in localStorage so the first paint already has the right colours.
 */
import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core";

export type ThemePref = "system" | "light" | "dark";
const KEY = "chompbook-theme";
const BG = { dark: "#141517", light: "#f5f4f0" } as const;

export function resolveTheme(pref: ThemePref | undefined, systemDark: boolean): "light" | "dark" {
  if (pref === "light" || pref === "dark") return pref;
  return systemDark ? "dark" : "light";
}

function systemDark(): boolean {
  return typeof matchMedia === "undefined" || matchMedia("(prefers-color-scheme: dark)").matches;
}

let current: ThemePref = "system";
let listening = false;

function paint(): void {
  const theme = resolveTheme(current, systemDark());
  const root = document.documentElement;
  if (theme === "light") root.dataset.theme = "light";
  else delete root.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", BG[theme]);
  document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", theme);
  if (Capacitor.isNativePlatform()) void SystemBars.setStyle({ style: theme === "dark" ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(() => undefined);
}

export function applyTheme(pref: ThemePref | undefined): void {
  current = pref ?? "system";
  try {
    localStorage.setItem(KEY, current);
  } catch {
    /* private mode: the profile still has it */
  }
  if (!listening && typeof matchMedia !== "undefined") {
    listening = true;
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => current === "system" && paint());
  }
  paint();
}

/** Before React renders: the last choice from localStorage. */
export function applySavedTheme(): void {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch {
    saved = null;
  }
  applyTheme(saved === "light" || saved === "dark" ? saved : "system");
}
