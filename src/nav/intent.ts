/** One-off requests from elsewhere for a screen to open at a certain place (e.g. the tutorial → Settings → AI provider). */
import { create } from "zustand";

export const useSettingsIntent = create<{ provider: boolean; openProvider: () => void; clear: () => void }>((set) => ({
  provider: false,
  openProvider: () => set({ provider: true }),
  clear: () => set({ provider: false }),
}));
