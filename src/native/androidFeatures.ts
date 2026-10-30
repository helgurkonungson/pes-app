/**
 * Android-only system features (0.19.2), each a no-op elsewhere and best effort (errors ignored):
 * the home-screen widget (HomeWidget), per-app language (AppLocale), the Google Play rating
 * card (StoreReview) and predictive back (the App plugin's back handler is switched off where
 * the app has nothing to go back to, so Android can show its "back to home" animation).
 */
import { App as CapApp } from "@capacitor/app";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { SELF_UPDATE_BUILD } from "../build";
import type { WidgetData } from "../core/widget";

interface HomeWidgetPlugin {
  update(data: WidgetData): Promise<void>;
}
interface AppLocalePlugin {
  get(): Promise<{ supported: boolean; tag: string }>;
  set(o: { tag: string }): Promise<void>;
}
interface StoreReviewPlugin {
  request(): Promise<{ launched: boolean }>;
}

const HomeWidget = registerPlugin<HomeWidgetPlugin>("HomeWidget");
const AppLocale = registerPlugin<AppLocalePlugin>("AppLocale");
const StoreReview = registerPlugin<StoreReviewPlugin>("StoreReview");

export const isAndroid = (): boolean => Capacitor.getPlatform() === "android";

/** Android version from the WebView's user agent (0 when unknown). */
export function androidVersion(ua: string = typeof navigator !== "undefined" ? navigator.userAgent : ""): number {
  return Number(ua.match(/Android (\d+)/)?.[1] ?? 0);
}

export async function updateHomeWidget(data: WidgetData): Promise<void> {
  if (!isAndroid()) return;
  await HomeWidget.update(data).catch(() => undefined);
}

/** Android's per-app language tag ("" = system default); null where Android has no such setting. */
export async function getAppLocale(): Promise<string | null> {
  if (!isAndroid()) return null;
  try {
    const r = await AppLocale.get();
    return r.supported ? r.tag : null;
  } catch {
    return null;
  }
}

export async function setAppLocale(tag: string): Promise<void> {
  if (!isAndroid()) return;
  await AppLocale.set({ tag }).catch(() => undefined);
}

/** The Google Play rating card — only in the Play build (sideloaded builds aren't installed by Play). */
export async function requestStoreReview(): Promise<void> {
  if (!isAndroid() || SELF_UPDATE_BUILD) return;
  await StoreReview.request().catch(() => undefined);
}

/** Predictive back needs Android 13+; older versions keep the app's own handling everywhere. */
export function predictiveBackDevice(): boolean {
  return isAndroid() && androidVersion() >= 13;
}

let backOn: boolean | null = null;
export function setBackHandled(on: boolean): void {
  if (!predictiveBackDevice() || backOn === on) return;
  backOn = on;
  void CapApp.toggleBackButtonHandler({ enabled: on }).catch(() => undefined);
}
