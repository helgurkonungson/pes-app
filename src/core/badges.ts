/** Badge catalogue and the rules that award them. */

export interface BadgeContext {
  sessionsDone: number;
  placementsDone: number;
  streak: number;
  skillsets: number;
  /** Results of the session just finished, if any. */
  last?: {
    kind: "placement" | "lesson" | "final";
    minutes: number;
    correct: number;
    total: number;
    openScore?: number;
    coverage: number;
  };
  level: number;
}

export interface BadgeDef {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide icon name, see components/BadgeIcon
  earned: (c: BadgeContext) => boolean;
}

export const BADGES: BadgeDef[] = [
  { id: "baseline", title: "Starting Point", description: "Finish your first placement test", icon: "target", earned: (c) => c.placementsDone >= 1 },
  { id: "first-step", title: "First Step", description: "Complete your first lesson", icon: "footprints", earned: (c) => c.sessionsDone >= 1 },
  { id: "streak-3", title: "Warming Up", description: "3-day streak", icon: "flame", earned: (c) => c.streak >= 3 },
  { id: "streak-7", title: "On Fire", description: "7-day streak", icon: "flame", earned: (c) => c.streak >= 7 },
  { id: "streak-30", title: "Unstoppable", description: "30-day streak", icon: "flame", earned: (c) => c.streak >= 30 },
  { id: "sharp", title: "Sharp Mind", description: "Answer every question right in a lesson", icon: "zap", earned: (c) => !!c.last && c.last.kind === "lesson" && c.last.total >= 3 && c.last.correct === c.last.total },
  { id: "deep", title: "Deep Thinker", description: "Score 9+ on an open question", icon: "brain", earned: (c) => (c.last?.openScore ?? 0) >= 9 },
  { id: "marathon", title: "Marathon", description: "Finish a 60-minute session", icon: "timer", earned: (c) => !!c.last && c.last.kind === "lesson" && c.last.minutes >= 60 },
  { id: "polymath", title: "Polymath", description: "Learn 3 skillsets at once", icon: "layers", earned: (c) => c.skillsets >= 3 },
  { id: "ten-lessons", title: "Habit Formed", description: "Complete 10 lessons", icon: "repeat", earned: (c) => c.sessionsDone >= 10 },
  { id: "bookworm", title: "Bookworm", description: "Cover all sources of a skillset", icon: "book-open-check", earned: (c) => (c.last?.coverage ?? 0) >= 1 },
  { id: "level-5", title: "Level 5", description: "Reach level 5", icon: "medal", earned: (c) => c.level >= 5 },
];

/** Ids of badges earned now that were not earned before. */
export function newBadges(ctx: BadgeContext, already: Record<string, string>): string[] {
  return BADGES.filter((b) => !already[b.id] && b.earned(ctx)).map((b) => b.id);
}

export function badgeById(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}
