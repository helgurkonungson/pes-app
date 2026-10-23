/**
 * Keeps the learner's progress safe across app updates and storage problems:
 * - asks the browser engine for persistent storage (no eviction);
 * - writes an automatic snapshot of the whole database into the app's private
 *   files (survives updates; restored automatically if the database comes up empty);
 * - before installing an update, saves a backup file to Documents/PES, which
 *   survives even an uninstall and can be restored from Settings or onboarding.
 */
import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { localDay } from "../core/dates";
import { db } from "./db";
import { type Backup, exportBackup, importBackup, isBackup } from "./repo";

export const SNAPSHOT = "backups/auto-latest.json";
export const SNAPSHOT_PREV = "backups/auto-previous.json";

/** Storage for snapshots — Capacitor files on the phone; swapped for memory in tests. */
export interface SnapshotStore {
  read(name: string): Promise<string | null>;
  write(name: string, text: string): Promise<void>;
  remove(name: string): Promise<void>;
}

export const fileStore: SnapshotStore = {
  async read(name) {
    try {
      const r = await Filesystem.readFile({ path: name, directory: Directory.Data, encoding: Encoding.UTF8 });
      return typeof r.data === "string" ? r.data : await (r.data as Blob).text();
    } catch {
      return null;
    }
  },
  async write(name, text) {
    await Filesystem.writeFile({ path: name, data: text, directory: Directory.Data, encoding: Encoding.UTF8, recursive: true });
  },
  async remove(name) {
    try {
      await Filesystem.deleteFile({ path: name, directory: Directory.Data });
    } catch {
      /* not there */
    }
  },
};

let store: SnapshotStore = fileStore;
export function setSnapshotStore(s: SnapshotStore): void {
  store = s;
}

export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

function hasProgress(b: Backup): boolean {
  const profile = (b.data.profile?.[0] ?? null) as { onboarded?: boolean } | null;
  return !!profile?.onboarded;
}

let writing: Promise<void> | null = null;

/** Writes the automatic snapshot (keeps the previous one). Safe to call often. */
export function writeSnapshot(): Promise<void> {
  if (writing) return writing;
  writing = (async () => {
    try {
      const b = await exportBackup();
      if (!hasProgress(b)) return; // nothing worth keeping yet
      const prev = await store.read(SNAPSHOT);
      if (prev) await store.write(SNAPSHOT_PREV, prev);
      await store.write(SNAPSHOT, JSON.stringify(b));
    } catch {
      /* best effort */
    } finally {
      writing = null;
    }
  })();
  return writing;
}

export async function readSnapshot(): Promise<Backup | null> {
  for (const name of [SNAPSHOT, SNAPSHOT_PREV]) {
    const text = await store.read(name);
    if (!text) continue;
    try {
      const b = JSON.parse(text);
      if (isBackup(b) && hasProgress(b)) return b;
    } catch {
      /* corrupted — try the previous one */
    }
  }
  return null;
}

/**
 * If the database is empty (no onboarded profile) but a snapshot exists,
 * restores it. Returns true when something was restored.
 */
export async function restoreIfEmpty(): Promise<boolean> {
  const profile = await db.profile.get("me");
  if (profile?.onboarded) return false;
  if ((await db.skillsets.count()) > 0) return false;
  const snap = await readSnapshot();
  if (!snap) return false;
  await importBackup(snap);
  return true;
}

/** Called by "Delete all data": the snapshot must not bring the data back. */
export async function clearSnapshots(): Promise<void> {
  await store.remove(SNAPSHOT);
  await store.remove(SNAPSHOT_PREV);
}

/**
 * Saves a backup file into the phone's public Documents/PES folder (Android).
 * Returns the human-readable location, or null if it couldn't be written.
 */
export async function saveExternalBackup(): Promise<string | null> {
  if (Capacitor.getPlatform() !== "android") return null;
  try {
    const name = `PES/pes-backup-${localDay()}.json`;
    await Filesystem.writeFile({ path: name, data: JSON.stringify(await exportBackup()), directory: Directory.Documents, encoding: Encoding.UTF8, recursive: true });
    return `Documents/${name}`;
  } catch {
    return null;
  }
}
