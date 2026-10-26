/**
 * Daily study reminders as local notifications (no server, nothing leaves the phone).
 * Rescheduled on start, on return to the app and after every session.
 */
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { localDay } from "../core/dates";
import { DEFAULT_REMINDER_TIME, planReminders } from "../core/reminders";
import { liveStreak } from "../core/streak";
import { db, getProfile, updateProfile } from "../data/db";
import { t } from "../i18n";

const IDS = [...Array.from({ length: 14 }, (_, i) => 1000 + i), 1100];

export async function notificationsAllowed(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    return (await LocalNotifications.checkPermissions()).display === "granted";
  } catch {
    return false;
  }
}

/** Asks Android for permission (13+) and turns reminders on/off. Returns whether they are on. */
export async function setReminder(on: boolean, time?: string): Promise<boolean> {
  const p = await getProfile();
  const next = { on, time: time ?? p.reminder?.time ?? DEFAULT_REMINDER_TIME };
  if (on && Capacitor.isNativePlatform()) {
    try {
      const r = await LocalNotifications.requestPermissions();
      if (r.display !== "granted") next.on = false;
    } catch {
      next.on = false;
    }
  }
  await updateProfile({ reminder: next });
  await scheduleReminders();
  return next.on;
}

export async function scheduleReminders(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: IDS.map((id) => ({ id })) });
    const p = await getProfile();
    if (!p.reminder?.on || !(await notificationsAllowed())) return;
    const today = localDay();
    const act = await db.activity.get(today);
    const cards = await db.cards.toArray();
    const plan = planReminders({
      today,
      now: new Date(),
      time: p.reminder.time,
      studiedToday: (act?.sessions ?? 0) > 0,
      streak: liveStreak(p.streak, today),
      dueOn: (day) => cards.filter((c) => c.due <= day).length,
      restDays: p.restDays,
      ageGroup: p.ageGroup,
    });
    if (!plan.length) return;
    await LocalNotifications.schedule({
      notifications: plan.map((r) => ({
        id: r.id,
        title: r.kind === "streak" ? t("notif.streakTitle", { n: liveStreak(p.streak, today) }) : t("notif.title"),
        body: r.kind === "streak" ? t("notif.streakBody") : r.due > 0 ? t("notif.bodyDue", { n: r.due }) : t("notif.body"),
        schedule: { at: r.at, allowWhileIdle: false },
        smallIcon: "ic_stat_notify",
      })),
    });
  } catch {
    /* reminders are best effort */
  }
}
