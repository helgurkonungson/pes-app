/**
 * Local database (IndexedDB via Dexie). Schema changes need a new
 * `this.version(n)` block with an upgrade — never edit an existing version.
 */
import Dexie, { type Table } from "dexie";
import type { Chunk, Course, DayActivity, LessonDraft, Profile, Session, Skillset, Source } from "../core/types";
import { nowIso } from "../core/ids";

export const DEFAULT_MODEL = "claude-sonnet-5-5";

export class PesDb extends Dexie {
  skillsets!: Table<Skillset, string>;
  sources!: Table<Source, string>;
  chunks!: Table<Chunk, string>;
  sessions!: Table<Session, string>;
  profile!: Table<Profile, string>;
  activity!: Table<DayActivity, string>;
  courses!: Table<Course, string>;
  drafts!: Table<LessonDraft, string>;

  constructor(name = "pes") {
    super(name);
    this.version(1).stores({
      skillsets: "id, createdAt",
      sources: "id, skillsetId, addedAt",
      chunks: "id, skillsetId, sourceId, [skillsetId+order]",
      sessions: "id, skillsetId, status, createdAt, finishedAt, [skillsetId+status]",
      profile: "id",
      activity: "day",
    });
    // v0.2: imported courses. Additive only — existing tables and rows are untouched.
    this.version(2).stores({
      courses: "id",
    });
    // v0.6: AI lessons written step by step keep their finished steps here. Additive only.
    this.version(3).stores({
      drafts: "id, skillsetId",
    });
  }
}

/** Current schema version — bump together with a new `this.version(n)` above. */
export const DB_VERSION = 3;

export const db = new PesDb();

export function defaultProfile(): Profile {
  return {
    id: "me",
    name: "",
    xp: 0,
    streak: { current: 0, best: 0 },
    badges: {},
    dailyGoal: 15,
    model: DEFAULT_MODEL,
    onboarded: false,
    createdAt: nowIso(),
  };
}

export async function getProfile(): Promise<Profile> {
  const p = await db.profile.get("me");
  if (p) return p;
  const fresh = defaultProfile();
  await db.profile.put(fresh);
  return fresh;
}

export async function updateProfile(patch: Partial<Profile>): Promise<void> {
  const p = await getProfile();
  await db.profile.put({ ...p, ...patch, id: "me" });
}
