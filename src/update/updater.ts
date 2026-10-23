/**
 * Self-update for builds installed outside the stores: checks the latest GitHub
 * Release of the app repo and offers the APK. Store builds will update through
 * the stores instead.
 */
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { localDay } from "../core/dates";
import { compareVersions } from "../core/semver";
import type { UpdateInfo } from "../core/types";
import { isUpdateCheckDue, pendingUpdate } from "../core/updateCheck";
import { db } from "../data/db";
import { saveExternalBackup, writeSnapshot } from "../data/safety";
import { toast } from "../components/ui";
import { t } from "../i18n";

export type { UpdateInfo };

export const APP_VERSION: string = __APP_VERSION__;
export const APP_REPO: string = __APP_REPO__;

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  const res = await fetch(`https://api.github.com/repos/${APP_REPO}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" },
    cache: "no-store",
  });
  if (res.status === 404) return null; // no releases yet
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
  const r = (await res.json()) as {
    tag_name: string;
    body?: string;
    html_url: string;
    published_at: string;
    assets?: { name: string; browser_download_url: string }[];
  };
  if (compareVersions(r.tag_name, APP_VERSION) <= 0) return null;
  const apk = r.assets?.find((a) => a.name.toLowerCase().endsWith(".apk"));
  return { version: r.tag_name.replace(/^v/i, ""), notes: (r.body ?? "").trim(), apkUrl: apk?.browser_download_url, pageUrl: r.html_url, publishedAt: r.published_at };
}

/** Opens the APK download in the system browser; Android then offers to install it. */
export async function installUpdate(u: UpdateInfo): Promise<void> {
  const url = u.apkUrl ?? u.pageUrl;
  if (Capacitor.isNativePlatform()) await Browser.open({ url });
  else window.open(url, "_blank", "noopener");
}

export const canSelfUpdate = () => Capacitor.getPlatform() === "android";

/** Test/dev switch: localStorage "pes.autoUpdateCheck" = "1" turns the daily check on in a browser. */
const AUTO_CHECK_FLAG = "pes.autoUpdateCheck";

/** The daily check runs where the app updates itself from GitHub (the Android APK). */
export function autoUpdateCheckEnabled(): boolean {
  if (canSelfUpdate()) return true;
  try {
    return localStorage.getItem(AUTO_CHECK_FLAG) === "1";
  } catch {
    return false;
  }
}

let inFlight: Promise<{ info: UpdateInfo | null; fresh: boolean }> | null = null;

/**
 * Once a day (first launch or first return to the app that day) asks GitHub for
 * the latest release and remembers the answer for the rest of the day.
 * `fresh` = this call did the network check (the moment to show the pop-up).
 * Throws when GitHub can't be reached; nothing is recorded, so the next launch retries.
 */
export function dailyUpdateCheck(now: Date = new Date()): Promise<{ info: UpdateInfo | null; fresh: boolean }> {
  inFlight ??= (async () => {
    const last = (await db.profile.get("me"))?.updateCheck;
    const today = localDay(now);
    if (!isUpdateCheckDue(last, today)) return { info: pendingUpdate(last, APP_VERSION), fresh: false };
    const info = await checkForUpdate();
    await db.profile.update("me", { updateCheck: info ? { day: today, available: info } : { day: today } });
    return { info, fresh: true };
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/**
 * Saves the learner's progress first (private snapshot + a backup file in
 * Documents/PES that survives even an uninstall), then opens the APK download.
 * Installing over the app keeps its data; the backup is the safety net.
 */
export async function installUpdateSafely(u: UpdateInfo): Promise<void> {
  await writeSnapshot();
  const where = await saveExternalBackup();
  if (where) toast(t("update.backupSaved", { path: where }));
  await installUpdate(u);
}
