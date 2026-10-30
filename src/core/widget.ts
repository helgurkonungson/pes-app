/** What the Android home-screen widget shows (0.19.2). Pure: texts come from the given translator. */
import type { Key, Params } from "../i18n";

export interface WidgetData {
  /** Local day the data is for (yyyy-mm-dd); on another day the widget shows `newDayStatus`. */
  day: string;
  streak: number;
  streakLabel: string;
  status: string;
  newDayStatus: string;
  cta: string;
}

export function widgetData(o: { day: string; streak: number; minutes: number; goal: number }, t: (key: Key, params?: Params) => string): WidgetData {
  const goal = Math.max(1, Math.round(o.goal));
  const left = Math.max(0, goal - Math.round(o.minutes));
  return {
    day: o.day,
    streak: Math.max(0, o.streak),
    streakLabel: t("widget.streak", { n: Math.max(0, o.streak) }),
    status: left === 0 ? `✓ ${t("home.goalDone")}` : t("home.minLeft", { n: left }),
    newDayStatus: t("home.minLeft", { n: goal }),
    cta: t("widget.cta"),
  };
}
