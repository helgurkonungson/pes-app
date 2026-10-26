/**
 * The OpenRouter one-tap sign-in as app state: the sheet starts it, the deep link (or, on the
 * web, the callback page's message) finishes it — even when the sheet was closed or Android
 * restarted the app meanwhile. See openrouterOAuth.ts.
 */
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { create } from "zustand";
import { toast } from "../components/ui";
import { t } from "../i18n";
import { http } from "./compat";
import { adoptFreeKey } from "./freeKey";
import { beginOpenRouterSignIn, type ExchangeFailure, finishOpenRouterSignIn, loadPending, OAuthError, parseCallback } from "./openrouterOAuth";

export type OrStatus = { stage: "idle" } | { stage: "waiting" } | { stage: "connecting" } | { stage: "done" } | { stage: "error"; kind: ExchangeFailure | "key" };

interface OrState {
  status: OrStatus;
  start: () => Promise<void>;
  reset: () => void;
}

export const useOpenRouter = create<OrState>((set) => ({
  status: { stage: "idle" },
  start: async () => {
    const url = await beginOpenRouterSignIn();
    set({ status: { stage: "waiting" } });
    if (Capacitor.isNativePlatform()) await Browser.open({ url, presentationStyle: "fullscreen" });
    else window.open(url, "_blank");
  },
  reset: () => set({ status: { stage: "idle" } }),
}));

let busy = false;

/** Handles a deep link / callback URL. Returns true when it was OpenRouter's. */
export async function handleOpenRouterCallback(url: string): Promise<boolean> {
  const cb = parseCallback(url);
  if (!cb) return false;
  if (busy) return true;
  busy = true;
  const set = (status: OrStatus) => useOpenRouter.setState({ status });
  set({ stage: "connecting" });
  if (Capacitor.isNativePlatform()) void Browser.close().catch(() => undefined);
  try {
    const post = async (u: string, body: unknown) => http(u, { method: "POST", headers: { "content-type": "application/json" }, body, timeoutMs: 30_000 });
    const key = await finishOpenRouterSignIn(cb, post);
    try {
      await adoptFreeKey("openrouter", key);
    } catch {
      set({ stage: "error", kind: "key" });
      return true;
    }
    set({ stage: "done" });
    toast(t("free.connected", { name: "OpenRouter" }));
  } catch (e) {
    set({ stage: "error", kind: e instanceof OAuthError ? e.kind : "unknown" });
  } finally {
    busy = false;
  }
  return true;
}

/** A sign-in was started less than 10 minutes ago (the sheet shows "waiting" after a restart). */
export const openRouterPending = () => loadPending() !== null;

/** Web only: the callback page on chompbook.online posts the URL back to the app window. */
export const CALLBACK_ORIGIN = "https://chompbook.online";
