/**
 * Keeps the screen on while something long runs in the foreground (writing an AI lesson).
 * Android: the app's own ScreenAwake plugin (FLAG_KEEP_SCREEN_ON); browser: the Screen Wake Lock API.
 * Best effort — failures are ignored, the lesson resumes from its saved steps anyway.
 */
import { Capacitor, registerPlugin } from "@capacitor/core";

interface ScreenAwakePlugin {
  keepOn(): Promise<void>;
  allowSleep(): Promise<void>;
}

const ScreenAwake = registerPlugin<ScreenAwakePlugin>("ScreenAwake");

type Sentinel = { release(): Promise<void> };
let sentinel: Sentinel | null = null;
let holders = 0;

async function webLock(): Promise<void> {
  const wl = (navigator as Navigator & { wakeLock?: { request(type: "screen"): Promise<Sentinel> } }).wakeLock;
  if (!wl || document.visibilityState !== "visible") return;
  try {
    sentinel = await wl.request("screen");
  } catch {
    sentinel = null;
  }
}

function onVisible(): void {
  // the browser drops the lock when the page is hidden; take it again on return
  if (holders > 0 && !sentinel && document.visibilityState === "visible") void webLock();
}

/** Returns a release function. Nested holds are counted. */
export function keepScreenOn(): () => void {
  holders++;
  if (holders === 1) {
    if (Capacitor.isNativePlatform()) ScreenAwake.keepOn().catch(() => undefined);
    else {
      void webLock();
      document.addEventListener("visibilitychange", onVisible);
    }
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    holders--;
    if (holders > 0) return;
    if (Capacitor.isNativePlatform()) ScreenAwake.allowSleep().catch(() => undefined);
    else {
      document.removeEventListener("visibilitychange", onVisible);
      const s = sentinel;
      sentinel = null;
      s?.release().catch(() => undefined);
    }
  };
}
