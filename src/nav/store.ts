/** App navigation: four tabs plus a stack of pushed screens. */
import { create } from "zustand";

export type Tab = "home" | "skillsets" | "progress" | "settings";

export type Route =
  | { name: "skillset"; id: string }
  | { name: "skillsetEdit"; id?: string }
  | { name: "sources"; id: string }
  | { name: "session"; skillsetId: string; minutes: number; offline?: boolean }
  | { name: "history"; id: string }
  | { name: "lesson"; sessionId: string }
  | { name: "logs" }
  | { name: "reports" }
  | { name: "pro" };

interface NavState {
  tab: Tab;
  stack: Route[];
  setTab: (t: Tab) => void;
  push: (r: Route) => void;
  replace: (r: Route) => void;
  pop: () => void;
  reset: () => void;
  /** Handles the Android back button. Returns false when the app should exit. */
  back: () => boolean;
}

/** Sheets and dialogs register here so the hardware back button closes them first. */
const backHandlers: (() => boolean)[] = [];
const backListeners = new Set<() => void>();
export function onBack(handler: () => boolean): () => void {
  backHandlers.push(handler);
  backListeners.forEach((l) => l());
  return () => {
    const i = backHandlers.lastIndexOf(handler);
    if (i >= 0) backHandlers.splice(i, 1);
    backListeners.forEach((l) => l());
  };
}

/** Whether Back has anything to do in the app (a sheet, a pushed screen, another tab) — for predictive back. */
export function backWouldHandle(): boolean {
  const s = useNav.getState();
  return backHandlers.length > 0 || s.stack.length > 0 || s.tab !== "home";
}

/** Calls `fn` whenever backWouldHandle() may have changed. */
export function watchBackState(fn: () => void): () => void {
  backListeners.add(fn);
  const unsub = useNav.subscribe(fn);
  return () => {
    backListeners.delete(fn);
    unsub();
  };
}

export const useNav = create<NavState>((set, get) => ({
  tab: "home",
  stack: [],
  setTab: (tab) => set({ tab, stack: [] }),
  push: (r) => set((s) => ({ stack: [...s.stack, r] })),
  replace: (r) => set((s) => ({ stack: [...s.stack.slice(0, -1), r] })),
  pop: () => set((s) => ({ stack: s.stack.slice(0, -1) })),
  reset: () => set({ stack: [], tab: "home" }),
  back: () => {
    for (let i = backHandlers.length - 1; i >= 0; i--) if (backHandlers[i]()) return true;
    const s = get();
    if (s.stack.length) {
      // the session screen handles its own back (asks before leaving)
      const top = s.stack[s.stack.length - 1];
      if (top.name === "session") {
        window.dispatchEvent(new CustomEvent("pes:session-back"));
        return true;
      }
      set({ stack: s.stack.slice(0, -1) });
      return true;
    }
    if (s.tab !== "home") {
      set({ tab: "home" });
      return true;
    }
    return false;
  },
}));
