/** App navigation: four tabs plus a stack of pushed screens. */
import { create } from "zustand";

export type Tab = "home" | "skillsets" | "stats" | "rewards";

export type Route =
  | { name: "skillset"; id: string }
  | { name: "skillsetEdit"; id?: string }
  | { name: "sources"; id: string }
  | { name: "session"; skillsetId: string; minutes: number }
  | { name: "history"; id: string }
  | { name: "lesson"; sessionId: string }
  | { name: "settings" };

interface NavState {
  tab: Tab;
  stack: Route[];
  sheet: null | "quickstart";
  setTab: (t: Tab) => void;
  push: (r: Route) => void;
  replace: (r: Route) => void;
  pop: () => void;
  reset: () => void;
  openSheet: (s: "quickstart") => void;
  closeSheet: () => void;
  /** Handles the Android back button. Returns false when the app should exit. */
  back: () => boolean;
}

export const useNav = create<NavState>((set, get) => ({
  tab: "home",
  stack: [],
  sheet: null,
  setTab: (tab) => set({ tab, stack: [] }),
  push: (r) => set((s) => ({ stack: [...s.stack, r], sheet: null })),
  replace: (r) => set((s) => ({ stack: [...s.stack.slice(0, -1), r] })),
  pop: () => set((s) => ({ stack: s.stack.slice(0, -1) })),
  reset: () => set({ stack: [], tab: "home", sheet: null }),
  openSheet: (sheet) => set({ sheet }),
  closeSheet: () => set({ sheet: null }),
  back: () => {
    const s = get();
    if (s.sheet) {
      set({ sheet: null });
      return true;
    }
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
