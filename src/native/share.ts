/**
 * Handing text and files to other apps (ADR-036): the native share sheet on Android/iOS,
 * the Web Share API or a download/clipboard in the browser. Screens call these instead of
 * the Capacitor plugins, so platform differences stay in one place.
 */
import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

/** What happened, so the caller can say "copied" when there was no share sheet. */
export type ShareResult = "shared" | "copied" | "cancelled";

const cancelled = (e: unknown) => /cancel|abort/i.test(String((e as Error)?.message ?? e));

/** Shares plain text: native sheet → Web Share → clipboard. A closed sheet is not an error. */
export async function shareText(title: string, text: string): Promise<ShareResult> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title, text, dialogTitle: title });
      return "shared";
    }
    if (navigator.share) {
      await navigator.share({ title, text });
      return "shared";
    }
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "cancelled";
  }
}

/**
 * Shares a text file (e.g. a backup): written to the cache and offered through the share sheet on
 * phones, downloaded in the browser. Throws when it really failed (not when the sheet was closed).
 */
export async function shareTextFile(name: string, text: string, title: string, type = "application/json"): Promise<ShareResult> {
  try {
    if (Capacitor.isNativePlatform()) {
      const res = await Filesystem.writeFile({ path: name, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
      await Share.share({ title, files: [res.uri] });
      return "shared";
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
    return "shared";
  } catch (e) {
    if (cancelled(e)) return "cancelled";
    throw e;
  }
}
