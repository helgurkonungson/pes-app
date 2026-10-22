/**
 * Self-update for builds installed outside the stores: checks the latest GitHub
 * Release of the app repo and offers the APK. Store builds will update through
 * the stores instead.
 */
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { compareVersions } from "../core/semver";

export const APP_VERSION: string = __APP_VERSION__;
export const APP_REPO: string = __APP_REPO__;

export interface UpdateInfo {
  version: string;
  notes: string;
  apkUrl?: string;
  pageUrl: string;
  publishedAt: string;
}

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
