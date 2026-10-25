/** Open state of the tutorial replayed from Settings (the first run is driven by `profile.tutorial === "pending"`). */
import { create } from "zustand";

export const useTutorial = create<{ open: boolean; show: () => void; hide: () => void }>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}));
