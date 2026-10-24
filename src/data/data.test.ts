/**
 * Integration tests of the data layer on an in-memory IndexedDB:
 * offline lessons, AI fallback, courses (incl. re-import), backups, automatic
 * snapshots and schema migration. AI and secure storage are mocked.
 */
import "fake-indexeddb/auto";
import { readFileSync } from "node:fs";
import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const keyState = vi.hoisted(() => ({ key: null as string | null }));
vi.mock("../ai/key", () => ({
  getApiKey: async () => keyState.key,
  setApiKey: async (v: string) => {
    keyState.key = v;
  },
  clearApiKey: async () => {
    keyState.key = null;
  },
  maskKey: (k: string | null) => (k ? "sk-…" : "Not set"),
  providerReady: async () => !!keyState.key,
}));

const tutor = vi.hoisted(() => ({ generateLesson: vi.fn(), generatePlacement: vi.fn(), gradeAnswer: vi.fn() }));
vi.mock("../ai/tutor", () => tutor);

import { AiError } from "../ai/client";
import { buildCourseLesson } from "../core/course";
import { localDay } from "../core/dates";
import { OfflineError } from "../core/offline";
import type { LessonContent, LessonDraft, Session } from "../core/types";
import { importCourse } from "./courses";
import { db, DB_VERSION, getProfile, PesDb, updateProfile } from "./db";
import { addSource, completeSession, createSkillset, deleteSkillset, doneCourseLessonIds, exportBackup, importBackup, wipeAll } from "./repo";
import { clearSnapshots, readSnapshot, restoreIfEmpty, setSnapshotStore, SNAPSHOT, SNAPSHOT_PREV, type SnapshotStore, writeSnapshot } from "./safety";
import { CourseFinishedError, prepareSession, restartReading, usableDraft } from "./sessionService";

const fixture = (name: string) => readFileSync(new URL(`../../tests/fixtures/${name}`, import.meta.url), "utf8");

const files = new Map<string, string>();
const memStore: SnapshotStore = {
  read: async (n) => files.get(n) ?? null,
  write: async (n, t) => void files.set(n, t),
  remove: async (n) => void files.delete(n),
};
setSnapshotStore(memStore);

const TEXT = Array.from(
  { length: 60 },
  (_, i) =>
    `Data governance defines decision rights for data asset number ${i}. The data steward monitors quality rules and metadata for the catalog. Lineage explains where report figures come from in warehouse ${i}.`,
).join("\n\n");

async function onboard() {
  await updateProfile({ name: "Test", onboarded: true });
}

async function newSkillset(withSource = true) {
  const s = await createSkillset({ name: "Data", goal: "Learn", minutes: 15, useInternet: false, language: "English", hue: 174 });
  if (withSource) {
    const words = TEXT.split(/\s+/).length;
    await addSource(s.id, "text", "Notes", "pasted", [
      { title: "Part A", text: TEXT, words },
      { title: "Part B", text: TEXT.replace(/asset/g, "item"), words },
    ]);
  }
  return s;
}

/** Answers every question correctly and self-checks the open question. */
async function passSession(s: Session, wrongFirst = false): Promise<void> {
  const l = s.lesson!;
  const mcq: Record<string, number> = {};
  [...l.review.questions, ...l.quiz].forEach((q, i) => (mcq[q.id] = wrongFirst && i === 0 ? (q.answer + 1) % q.options.length : q.answer));
  await db.sessions.update(s.id, {
    status: "active",
    progress: { page: 0, mcq, seconds: 600, openAnswer: "x", grade: { score: 8, verdict: "", strengths: [], gaps: [], modelAnswer: "", self: true } },
  });
  await completeSession(s.id);
}

const aiLesson = (): LessonContent => ({
  title: "AI lesson",
  review: { recap: [], questions: [] },
  theory: { sections: [{ heading: "H", body: "B" }], keyPoints: ["k"] },
  quiz: [{ id: "q1", q: "Q?", options: ["a", "b", "c", "d"], answer: 2, explanation: "", difficulty: "m" }],
  open: { id: "open", q: "Why?", rubric: [] },
});

beforeEach(async () => {
  keyState.key = null;
  files.clear();
  vi.clearAllMocks();
  db.close();
  await db.delete();
  await db.open();
  await getProfile();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("offline lessons (no key)", () => {
  it("skips the placement test and builds an offline lesson from the sources", async () => {
    const s = await newSkillset();
    const session = await prepareSession(s.id, 15);
    expect(session.kind).toBe("lesson");
    expect(session.lesson?.mode).toBe("offline");
    expect(session.lesson?.fallback).toBe("no-key");
    expect(session.chunkIds.length).toBeGreaterThan(0);
    expect((await db.skillsets.get(s.id))?.placementSkipped).toBe(true);
    expect(tutor.generateLesson).not.toHaveBeenCalled();
    expect(tutor.generatePlacement).not.toHaveBeenCalled();
  });

  it("returns the same ready session when asked twice (and in parallel)", async () => {
    const s = await newSkillset();
    const [a, b] = await Promise.all([prepareSession(s.id, 15), prepareSession(s.id, 15)]);
    expect(a.id).toBe(b.id);
    expect((await prepareSession(s.id, 15)).id).toBe(a.id);
  });

  it("completing a lesson advances reading, XP, streak, activity and badges", async () => {
    const s = await newSkillset();
    const first = await prepareSession(s.id, 15);
    await passSession(first);
    const sk = (await db.skillsets.get(s.id))!;
    expect(sk.lessonsDone).toBe(1);
    expect(sk.cursor * 1_000_000 + (sk.cursorWord ?? 0)).toBeGreaterThan(0);
    expect(sk.cursor).toBe(first.lesson!.readTo!.cursor);
    expect(sk.cursorWord ?? 0).toBe(first.lesson!.readTo!.word);
    const p = await getProfile();
    expect(p.xp).toBeGreaterThan(0);
    expect(p.streak.current).toBe(1);
    expect(p.badges["first-step"]).toBeTruthy();
    expect(p.badges["deep"]).toBeUndefined(); // self-checks don't earn "Deep Thinker"
    expect((await db.activity.get(localDay()))?.sessions).toBe(1);
  });

  it("the next lesson continues where the last one stopped and reviews mistakes", async () => {
    const s = await newSkillset();
    const first = await prepareSession(s.id, 15);
    await passSession(first, true);
    const second = await prepareSession(s.id, 15);
    expect(second.id).not.toBe(first.id);
    expect(second.lesson!.theory.sections[0].body).not.toBe(first.lesson!.theory.sections[0].body);
    expect(second.lesson!.review.recap).toEqual(first.lesson!.theory.keyPoints.slice(0, 4));
    expect(second.lesson!.review.questions.length).toBeGreaterThan(0);
  });

  it("reads every source to the end, then asks to start over", async () => {
    const s = await newSkillset();
    let guard = 0;
    for (;;) {
      let session: Session;
      try {
        session = await prepareSession(s.id, 60);
      } catch (e) {
        expect(e).toBeInstanceOf(OfflineError);
        expect((e as OfflineError).code).toBe("finished");
        break;
      }
      await passSession(session);
      if (++guard > 30) throw new Error("never finished");
    }
    const sk = (await db.skillsets.get(s.id))!;
    expect(sk.cursor).toBe(2);
    expect(await db.chunks.where("skillsetId").equals(s.id).filter((c) => !c.coveredAt).count()).toBe(0);
    await restartReading(s.id);
    expect((await prepareSession(s.id, 15)).lesson?.mode).toBe("offline");
  });

  it("explains when there are no sources", async () => {
    const s = await newSkillset(false);
    await expect(prepareSession(s.id, 15)).rejects.toMatchObject({ code: "no-sources" });
  });

  it("offline mode in settings never calls AI even with a key", async () => {
    keyState.key = "sk-ant-test-key-123456789";
    await updateProfile({ aiMode: "offline" });
    const s = await newSkillset();
    const session = await prepareSession(s.id, 15);
    expect(session.lesson?.mode).toBe("offline");
    expect(session.lesson?.fallback).toBe("offline-mode");
    expect(tutor.generateLesson).not.toHaveBeenCalled();
  });

  it("the learner can ask for an offline lesson while AI works", async () => {
    keyState.key = "sk-ant-test-key-123456789";
    const s = await newSkillset();
    await db.skillsets.update(s.id, { placementSkipped: true });
    const session = await prepareSession(s.id, 15, { offline: true });
    expect(session.lesson?.mode).toBe("offline");
    expect(tutor.generateLesson).not.toHaveBeenCalled();
  });
});

describe("AI lessons and fallback", () => {
  beforeEach(() => {
    keyState.key = "sk-ant-test-key-123456789";
  });

  it("uses AI when it works and clears an old block", async () => {
    await updateProfile({ aiBlock: { kind: "credits", at: "2000-01-01T00:00:00.000Z" } }); // expired block
    tutor.generateLesson.mockResolvedValue({ lesson: aiLesson() });
    const s = await newSkillset();
    await db.skillsets.update(s.id, { placementSkipped: true });
    const session = await prepareSession(s.id, 15);
    expect(session.lesson?.mode).toBe("ai");
    expect(tutor.generateLesson).toHaveBeenCalledOnce();
    expect((await getProfile()).aiBlock).toBeUndefined();
  });

  it("runs the placement test first when AI is available", async () => {
    tutor.generatePlacement.mockResolvedValue({ intro: "Hi", questions: aiLesson().quiz });
    const s = await newSkillset();
    const session = await prepareSession(s.id, 15);
    expect(session.kind).toBe("placement");
  });

  it("out of credits → remembers it and continues offline without asking AI again", async () => {
    tutor.generateLesson.mockRejectedValue(new AiError("credit balance is too low", "credits", 400));
    const s = await newSkillset();
    await db.skillsets.update(s.id, { placementSkipped: true });
    const session = await prepareSession(s.id, 15);
    expect(session.lesson?.mode).toBe("offline");
    expect(session.lesson?.fallback).toBe("credits");
    expect((await getProfile()).aiBlock?.kind).toBe("credits");
    await passSession(session);
    tutor.generateLesson.mockClear();
    const next = await prepareSession(s.id, 15);
    expect(next.lesson?.mode).toBe("offline");
    expect(tutor.generateLesson).not.toHaveBeenCalled();
  });

  it("placement test also falls back when credits ran out", async () => {
    tutor.generatePlacement.mockRejectedValue(new AiError("no credits", "credits", 402));
    const s = await newSkillset();
    const session = await prepareSession(s.id, 15);
    expect(session.kind).toBe("lesson");
    expect(session.lesson?.mode).toBe("offline");
    expect((await db.skillsets.get(s.id))?.placementSkipped).toBe(true);
  });

  it("network errors are shown to the learner (they can retry or go offline)", async () => {
    tutor.generateLesson.mockRejectedValue(new AiError("offline", "network"));
    const s = await newSkillset();
    await db.skillsets.update(s.id, { placementSkipped: true });
    await expect(prepareSession(s.id, 15)).rejects.toMatchObject({ kind: "network" });
    expect((await getProfile()).aiBlock).toBeUndefined();
    expect((await prepareSession(s.id, 15, { offline: true })).lesson?.mode).toBe("offline");
  });

  it("an interrupted AI lesson continues from its saved steps, then the draft is removed", async () => {
    const s = await newSkillset();
    await db.skillsets.update(s.id, { placementSkipped: true });
    let saved: LessonDraft | undefined;
    tutor.generateLesson.mockImplementationOnce(async (o: { draft?: LessonDraft; saveDraft: (d: LessonDraft) => Promise<void>; chunks: { id: string }[]; number: number }) => {
      expect(o.draft).toBeUndefined();
      saved = { id: s.id, skillsetId: s.id, minutes: 15, number: o.number, chunkIds: o.chunks.map((c) => c.id), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), sections: ["Part one, already written.", null] };
      await o.saveDraft(saved);
      throw new AiError("socket closed while the phone slept", "network");
    });
    await expect(prepareSession(s.id, 15)).rejects.toMatchObject({ kind: "network" });
    expect((await db.drafts.get(s.id))?.sections[0]).toBe("Part one, already written.");
    tutor.generateLesson.mockImplementationOnce(async (o: { draft?: LessonDraft }) => {
      expect(o.draft?.sections[0]).toBe("Part one, already written.");
      return { lesson: aiLesson() };
    });
    const session = await prepareSession(s.id, 15);
    expect(session.lesson?.mode).toBe("ai");
    expect(session.number).toBe(saved!.number);
    expect(await db.drafts.get(s.id)).toBeUndefined();
  });

  it("the lesson can start once part 1 exists; later parts land in the saved session, then 'building' goes away", async () => {
    const s = await newSkillset();
    await db.skillsets.update(s.id, { placementSkipped: true });
    let finish!: () => void;
    const gate = new Promise<void>((r) => (finish = r));
    tutor.generateLesson.mockImplementationOnce(async (o: { onPartial: (l: LessonContent) => Promise<void> }) => {
      const partial = { ...aiLesson(), quiz: [], building: { done: 3, total: 5, sections: 2 } };
      await o.onPartial(partial);
      await gate;
      return { lesson: aiLesson() };
    });
    const session = await prepareSession(s.id, 15);
    expect(session.lesson?.building?.done).toBe(3);
    expect((await db.sessions.get(session.id))?.lesson?.building).toBeDefined();
    // the learner's progress is not overwritten by the writer
    await db.sessions.update(session.id, { progress: { page: 2, mcq: {}, seconds: 40 }, status: "active" });
    finish();
    await vi.waitFor(async () => expect((await db.sessions.get(session.id))?.lesson?.building).toBeUndefined());
    const saved = await db.sessions.get(session.id);
    expect(saved?.progress.page).toBe(2);
    expect(saved?.status).toBe("active");
    expect(saved?.lesson?.quiz.length).toBeGreaterThan(0);
  });

  it("background writing that fails marks the lesson so it can be continued", async () => {
    const s = await newSkillset();
    await db.skillsets.update(s.id, { placementSkipped: true });
    tutor.generateLesson.mockImplementationOnce(async (o: { onPartial: (l: LessonContent) => Promise<void> }) => {
      await o.onPartial({ ...aiLesson(), quiz: [], building: { done: 3, total: 5, sections: 2 } });
      throw new AiError("socket closed", "network");
    });
    const session = await prepareSession(s.id, 15);
    await vi.waitFor(async () => expect((await db.sessions.get(session.id))?.lesson?.building?.error).toBe("network"));
  });

  it("a draft is reused only for the same portion and material, and not when stale", () => {
    const d: LessonDraft = { id: "sk", skillsetId: "sk", minutes: 15, number: 3, chunkIds: ["a", "b"], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), sections: [] };
    expect(usableDraft(d, 15, ["a", "b"])).toBe(d);
    expect(usableDraft(d, 30, ["a", "b"])).toBeUndefined();
    expect(usableDraft(d, 15, ["a", "c"])).toBeUndefined();
    expect(usableDraft({ ...d, updatedAt: "2026-01-01T00:00:00.000Z" }, 15, ["a", "b"])).toBeUndefined();
    expect(usableDraft(undefined, 15, ["a"])).toBeUndefined();
  });

  it("deleting a skillset also deletes its half-written lesson", async () => {
    const s = await newSkillset();
    await db.drafts.put({ id: s.id, skillsetId: s.id, minutes: 15, number: 1, chunkIds: [], createdAt: "x", updatedAt: "x", sections: [] });
    await deleteSkillset(s.id);
    expect(await db.drafts.count()).toBe(0);
  });

  it("a ready offline lesson is replaced by an AI lesson once AI works again", async () => {
    const s = await newSkillset();
    await db.skillsets.update(s.id, { placementSkipped: true });
    keyState.key = null;
    const offline = await prepareSession(s.id, 15);
    expect(offline.lesson?.mode).toBe("offline");
    keyState.key = "sk-ant-test-key-123456789";
    tutor.generateLesson.mockResolvedValue({ lesson: aiLesson() });
    const ai = await prepareSession(s.id, 15);
    expect(ai.lesson?.mode).toBe("ai");
    expect(await db.sessions.get(offline.id)).toBeUndefined();
  });
});

describe("courses", () => {
  it("import creates a skillset that needs no AI and no placement", async () => {
    const r = await importCourse(fixture("sample-course.pes.json"));
    expect(r.updated).toBe(false);
    expect(r.newLessons).toBe(3);
    expect(r.skillset.courseId).toBe("demo-course");
    expect(r.skillset.placementSkipped).toBe(true);
    keyState.key = "sk-ant-test-key-123456789"; // even with AI available, courses don't call it
    const s1 = await prepareSession(r.skillset.id, 15);
    expect(s1.lesson?.courseLessonId).toBe("demo-01");
    expect(s1.minutes).toBe(10);
    expect(tutor.generateLesson).not.toHaveBeenCalled();
  });

  it("goes through lessons in order with review of the previous one", async () => {
    const { skillset } = await importCourse(fixture("sample-course.pes.json"));
    const s1 = await prepareSession(skillset.id, 15);
    await passSession(s1, true);
    const s2 = await prepareSession(skillset.id, 15);
    expect(s2.lesson?.courseLessonId).toBe("demo-02");
    expect(s2.lesson?.review.recap).toEqual(["Basics key point 1", "Basics key point 2", "Basics key point 3"]);
    expect(s2.lesson?.review.questions.some((q) => q.q.startsWith("Recall Basics"))).toBe(true);
    expect(s2.lesson?.review.questions.some((q) => q.q.startsWith("Basics — quiz"))).toBe(true); // the mistake
    await passSession(s2);
    await passSession(await prepareSession(skillset.id, 15));
    await expect(prepareSession(skillset.id, 15)).rejects.toBeInstanceOf(CourseFinishedError);
    expect((await db.skillsets.get(skillset.id))?.cursor).toBe(3);
    expect((await getProfile()).badges["bookworm"]).toBeTruthy();
  });

  it("re-importing a newer version keeps progress and history", async () => {
    const { skillset } = await importCourse(fixture("sample-course.pes.json"));
    const s1 = await prepareSession(skillset.id, 15);
    await passSession(s1);
    const s2 = await prepareSession(skillset.id, 15); // ready, not started — will be rebuilt
    expect(s2.lesson?.courseLessonId).toBe("demo-02");
    const xp = (await getProfile()).xp;

    const r = await importCourse(fixture("sample-course-v2.pes.json"));
    expect(r.updated).toBe(true);
    expect(r.newLessons).toBe(1);
    expect(r.skillset.id).toBe(skillset.id);
    expect(await db.skillsets.count()).toBe(1);
    expect((await db.courses.get("demo-course"))?.version).toBe(2);
    expect(await db.sessions.get(s2.id)).toBeUndefined();
    // done lesson stays done; the inserted lesson is next
    expect([...(await doneCourseLessonIds(skillset.id))]).toEqual(["demo-01"]);
    expect((await prepareSession(skillset.id, 15)).lesson?.courseLessonId).toBe("demo-09");
    // the finished session keeps the text it was taught with
    expect((await db.sessions.get(s1.id))?.lesson?.title).toBe("Basics");
    expect((await getProfile()).xp).toBe(xp);
  });

  it("a started lesson is kept across a re-import", async () => {
    const { skillset } = await importCourse(fixture("sample-course.pes.json"));
    const s1 = await prepareSession(skillset.id, 15);
    await db.sessions.update(s1.id, { status: "active" });
    await importCourse(fixture("sample-course-v2.pes.json"));
    expect((await prepareSession(skillset.id, 15)).id).toBe(s1.id);
  });

  it("deleting the skillset deletes its course", async () => {
    const { skillset } = await importCourse(fixture("sample-course.pes.json"));
    await deleteSkillset(skillset.id);
    expect(await db.courses.count()).toBe(0);
    expect(await db.sessions.count()).toBe(0);
  });

  it("buildCourseLesson ids never clash with quiz ids", async () => {
    const { course } = await importCourse(fixture("sample-course.pes.json"));
    const l = buildCourseLesson(course, course.lessons[1], { doneIds: new Set(["demo-01"]), mistakes: course.lessons[1].quiz });
    const ids = [...l.review.questions, ...l.quiz].map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("backups", () => {
  it("export → wipe → import restores everything, including courses", async () => {
    await onboard();
    const s = await newSkillset();
    await passSession(await prepareSession(s.id, 15));
    await importCourse(fixture("sample-course.pes.json"));
    const before = await exportBackup();
    expect(before.version).toBe(2);
    await wipeAll();
    expect(await db.skillsets.count()).toBe(0);
    await importBackup(JSON.parse(JSON.stringify(before)));
    const after = await exportBackup();
    expect(after.data).toEqual(before.data);
  });

  it("restores an old v1 backup (no courses table) and clears current courses", async () => {
    await importCourse(fixture("sample-course.pes.json"));
    const v1 = { app: "pes", version: 1, exportedAt: "2026-10-22T00:00:00Z", data: { profile: [{ ...(await getProfile()), name: "Old" }], skillsets: [], sources: [], chunks: [], sessions: [], activity: [] } };
    await importBackup(v1);
    expect(await db.courses.count()).toBe(0);
    expect((await getProfile()).name).toBe("Old");
  });

  it("rejects files that aren't backups and backups from the future", async () => {
    await expect(importBackup({ hello: 1 })).rejects.toThrow("not-backup");
    await expect(importBackup({ app: "pes", version: 99, data: {} })).rejects.toThrow("newer-backup");
  });
});

describe("automatic snapshots (updates never reset progress)", () => {
  it("does not snapshot before onboarding", async () => {
    await writeSnapshot();
    expect(files.size).toBe(0);
  });

  it("restores the database from the snapshot if it comes up empty", async () => {
    await onboard();
    const s = await newSkillset();
    await passSession(await prepareSession(s.id, 15));
    await writeSnapshot();
    const xp = (await getProfile()).xp;
    // simulate an update that lost the database
    db.close();
    await db.delete();
    await db.open();
    expect(await restoreIfEmpty()).toBe(true);
    expect((await getProfile()).xp).toBe(xp);
    expect(await db.skillsets.count()).toBe(1);
    // and it does nothing when data is there
    expect(await restoreIfEmpty()).toBe(false);
  });

  it("keeps the previous snapshot and falls back to it if the latest is corrupted", async () => {
    await onboard();
    await writeSnapshot();
    await newSkillset();
    await writeSnapshot();
    expect(files.has(SNAPSHOT_PREV)).toBe(true);
    files.set(SNAPSHOT, "{corrupted");
    const snap = await readSnapshot();
    expect(snap?.data.skillsets).toHaveLength(0);
  });

  it("'Delete all data' also removes snapshots, so nothing comes back", async () => {
    await onboard();
    await newSkillset();
    await writeSnapshot();
    await clearSnapshots();
    await wipeAll();
    expect(await restoreIfEmpty()).toBe(false);
  });
});

describe("schema migration", () => {
  it("v1 databases open at the current version with every row intact", async () => {
    const name = "pes-migration-test";
    await Dexie.delete(name);
    const old = new Dexie(name);
    old.version(1).stores({
      skillsets: "id, createdAt",
      sources: "id, skillsetId, addedAt",
      chunks: "id, skillsetId, sourceId, [skillsetId+order]",
      sessions: "id, skillsetId, status, createdAt, finishedAt, [skillsetId+status]",
      profile: "id",
      activity: "day",
    });
    await old.open();
    await old.table("profile").put({ id: "me", name: "Oleg", xp: 730, streak: { current: 3, best: 3 }, badges: { baseline: "x" }, dailyGoal: 15, model: "m", onboarded: true, createdAt: "x" });
    await old.table("skillsets").put({ id: "sk1", name: "CDO", createdAt: "2026-10-19", cursor: 5, lessonsDone: 4 });
    await old.table("sessions").put({ id: "se1", skillsetId: "sk1", status: "done", createdAt: "x", lesson: { title: "Old lesson" } });
    old.close();

    const upgraded = new PesDb(name);
    await upgraded.open();
    expect(upgraded.verno).toBe(DB_VERSION);
    expect((await upgraded.profile.get("me"))?.xp).toBe(730);
    expect((await upgraded.skillsets.get("sk1"))?.cursor).toBe(5);
    expect((await upgraded.sessions.get("se1"))?.lesson?.title).toBe("Old lesson");
    expect(await upgraded.courses.count()).toBe(0);
    expect(await upgraded.drafts.count()).toBe(0);
    upgraded.close();
  });
});
