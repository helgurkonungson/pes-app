/**
 * Keeps Android's own surfaces in step with the app (0.19.2): the home-screen widget, the
 * per-app language in Android Settings, and the Google Play rating card at a good moment.
 * The rules are pure (core/widget, core/appLanguage, core/reviewAsk); this file does the IO.
 */
import { syncAppLanguage } from "../core/appLanguage";
import { localDay } from "../core/dates";
import { recordReviewAsk, shouldAskForReview } from "../core/reviewAsk";
import { liveStreak } from "../core/streak";
import type { Session, SessionResult } from "../core/types";
import { widgetData } from "../core/widget";
import { t } from "../i18n";
import { getAppLocale, isAndroid, requestStoreReview, setAppLocale, updateHomeWidget } from "../native/androidFeatures";
import { db, getProfile, updateProfile } from "./db";

/** Writes today's streak and goal into the widget (called when the app starts and goes to the background). */
export async function refreshHomeWidget(): Promise<void> {
  if (!isAndroid()) return;
  const profile = await getProfile();
  const day = localDay();
  const today = await db.activity.get(day);
  await updateHomeWidget(widgetData({ day, streak: liveStreak(profile.streak, day), minutes: today?.minutes ?? 0, goal: profile.dailyGoal || 15 }, t));
}

const PUSHED = "pes.appLocale.pushed";
function readPushed(): string | null {
  try {
    return localStorage.getItem(PUSHED);
  } catch {
    return null;
  }
}
function writePushed(tag: string): void {
  try {
    localStorage.setItem(PUSHED, tag);
  } catch {
    /* private mode: the next sync pushes again, which is harmless */
  }
}

/** Android 13+: the language in Android Settings → Apps and the one chosen in the app follow each other. */
export async function syncLanguageWithAndroid(): Promise<void> {
  const systemTag = await getAppLocale();
  if (systemTag === null) return;
  const profile = await getProfile();
  const app = profile.uiLanguage ?? "system";
  const action = syncAppLanguage(app, systemTag, readPushed());
  if (action.kind === "adopt") {
    writePushed(systemTag);
    await updateProfile({ uiLanguage: action.lang });
  } else if (action.kind === "push") {
    writePushed(action.tag);
    await setAppLocale(action.tag);
  } else {
    writePushed(systemTag);
  }
}

/** After a finished lesson: asks Google Play for the rating card when the moment is right. */
export async function maybeAskForReview(session: Session, result: SessionResult): Promise<boolean> {
  if (!isAndroid() || session.kind !== "lesson") return false;
  const profile = await getProfile();
  const lessonsDone = (await db.skillsets.toArray()).reduce((n, s) => n + (s.lessonsDone ?? 0), 0);
  if (!shouldAskForReview({ lessonsDone, openScore: result.openScore, streak: result.streak, state: profile.reviewAsk })) return false;
  await updateProfile({ reviewAsk: recordReviewAsk(profile.reviewAsk) });
  await requestStoreReview();
  return true;
}
