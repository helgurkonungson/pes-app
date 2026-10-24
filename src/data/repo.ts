/** Data operations used by the screens. All writes go through here. */
import { badgeById, newBadges } from "../core/badges";
import type { ChunkDraft } from "../core/chunker";
import { localDay } from "../core/dates";
import { mistakesOf, tallyLesson } from "../core/flow";
import { nowIso, uid } from "../core/ids";
import { advanceCursor, clampMinutes, coverage } from "../core/planner";
import { levelFromXp, scorePlacement, skippedPlacement, XP } from "../core/scoring";
import { registerDay } from "../core/streak";
import { cardId, review } from "../core/srs";
import type { Card, Chunk, DayActivity, LessonLanguage, Mcq, Session, SessionResult, Skillset, Source, SourceKind } from "../core/types";
import { db, getProfile } from "./db";

// ---------- skillsets ----------

export interface SkillsetInput {
  name: string;
  goal: string;
  minutes: number;
  useInternet: boolean;
  language: LessonLanguage;
  hue: number;
}

export async function createSkillset(input: SkillsetInput): Promise<Skillset> {
  const s: Skillset = {
    id: uid("sk_"),
    name: input.name.trim(),
    goal: input.goal.trim(),
    hue: input.hue,
    minutes: clampMinutes(input.minutes),
    useInternet: input.useInternet,
    language: input.language,
    createdAt: nowIso(),
    cursor: 0,
    lessonsDone: 0,
    xp: 0,
    correct: 0,
    total: 0,
    minutesSpent: 0,
  };
  await db.skillsets.put(s);
  return s;
}

export async function updateSkillset(id: string, patch: Partial<Skillset>): Promise<void> {
  await db.skillsets.update(id, patch);
  // a different portion size or language makes a pre-generated lesson stale
  if (patch.minutes !== undefined || patch.language !== undefined || patch.useInternet !== undefined) {
    await dropReadySessions(id);
  }
}

export async function deleteSkillset(id: string): Promise<void> {
  await db.transaction("rw", [db.skillsets, db.sources, db.chunks, db.sessions, db.courses, db.drafts, db.cards], async () => {
    const sk = await db.skillsets.get(id);
    await db.chunks.where("skillsetId").equals(id).delete();
    await db.sources.where("skillsetId").equals(id).delete();
    await db.sessions.where("skillsetId").equals(id).delete();
    await db.drafts.where("skillsetId").equals(id).delete();
    await db.cards.where("skillsetId").equals(id).delete();
    await db.skillsets.delete(id);
    if (sk?.courseId) {
      const others = (await db.skillsets.toArray()).some((x) => x.courseId === sk.courseId);
      if (!others) await db.courses.delete(sk.courseId);
    }
  });
}

/** Ids of course lessons already completed in a skillset. */
/**
 * Skips the placement test: the learner starts from zero (beginner, nothing known),
 * and an unfinished test session is removed.
 */
export async function skipPlacement(skillsetId: string): Promise<void> {
  await db.transaction("rw", [db.skillsets, db.sessions], async () => {
    await db.skillsets.update(skillsetId, { placement: skippedPlacement(nowIso()), placementSkipped: true });
    const open = await db.sessions.where("skillsetId").equals(skillsetId).toArray();
    for (const s of open) if (s.kind === "placement" && s.status !== "done") await db.sessions.delete(s.id);
  });
}

export async function doneCourseLessonIds(skillsetId: string): Promise<Set<string>> {
  const done = await db.sessions.where("[skillsetId+status]").equals([skillsetId, "done"]).toArray();
  return new Set(done.map((s) => s.lesson?.courseLessonId).filter((x): x is string => !!x));
}

// ---------- sources ----------

export async function addSource(skillsetId: string, kind: SourceKind, title: string, origin: string, drafts: ChunkDraft[]): Promise<Source> {
  const source: Source = {
    id: uid("src_"),
    skillsetId,
    kind,
    title: title.trim() || "Untitled",
    origin,
    addedAt: nowIso(),
    words: drafts.reduce((a, d) => a + d.words, 0),
    chunks: drafts.length,
  };
  await db.transaction("rw", [db.sources, db.chunks, db.sessions], async () => {
    const last = await db.chunks.where("[skillsetId+order]").between([skillsetId, -Infinity], [skillsetId, Infinity]).last();
    const start = last ? last.order + 1 : 0;
    const chunks: Chunk[] = drafts.map((d, i) => ({
      id: uid("ch_"),
      skillsetId,
      sourceId: source.id,
      order: start + i,
      title: d.title,
      text: d.text,
      words: d.words,
    }));
    await db.sources.put(source);
    await db.chunks.bulkPut(chunks);
  });
  return source;
}

export async function deleteSource(source: Source): Promise<void> {
  await db.transaction("rw", [db.sources, db.chunks, db.skillsets, db.sessions], async () => {
    await db.chunks.where("sourceId").equals(source.id).delete();
    await db.sources.delete(source.id);
    // re-number remaining chunks so the order stays dense; keep the cursor on already taught ones
    const sk = await db.skillsets.get(source.skillsetId);
    const rest = await db.chunks.where("skillsetId").equals(source.skillsetId).sortBy("order");
    let taught = 0;
    rest.forEach((c, i) => {
      if (sk && c.order < sk.cursor) taught = i + 1;
      c.order = i;
    });
    await db.chunks.bulkPut(rest);
    if (sk) await db.skillsets.update(sk.id, { cursor: taught });
  });
  await dropReadySessions(source.skillsetId);
}

export async function skillsetChunks(skillsetId: string): Promise<Chunk[]> {
  return db.chunks.where("skillsetId").equals(skillsetId).sortBy("order");
}

// ---------- sessions ----------

export async function dropReadySessions(skillsetId: string): Promise<void> {
  await db.sessions.where("[skillsetId+status]").equals([skillsetId, "ready"]).delete();
}

export async function findReadySession(skillsetId: string, minutes: number, kind: Session["kind"]): Promise<Session | undefined> {
  const list = await db.sessions.where("[skillsetId+status]").anyOf([skillsetId, "ready"], [skillsetId, "active"]).toArray();
  return list.find((s) => s.kind === kind && (s.status === "active" || s.minutes === minutes));
}

export async function nextSessionNumber(skillsetId: string): Promise<number> {
  return (await db.sessions.where("skillsetId").equals(skillsetId).count()) + 1;
}

export async function saveSession(s: Session): Promise<void> {
  await db.sessions.put(s);
}

export async function lastDoneLesson(skillsetId: string): Promise<Session | undefined> {
  const done = await db.sessions.where("[skillsetId+status]").equals([skillsetId, "done"]).toArray();
  return done.filter((s) => s.kind === "lesson").sort((a, b) => (a.finishedAt ?? "").localeCompare(b.finishedAt ?? "")).pop();
}

/** Wrong answers from the last two lessons, newest first. */
export async function recentMistakes(skillsetId: string, max = 4): Promise<Mcq[]> {
  const done = await db.sessions.where("[skillsetId+status]").equals([skillsetId, "done"]).toArray();
  const lessons = done.filter((s) => s.kind === "lesson" && s.lesson).sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? "")).slice(0, 2);
  return lessons.flatMap((s) => mistakesOf(s.lesson!, s.progress)).slice(0, max);
}

async function bumpActivity(day: string, patch: Omit<DayActivity, "day">): Promise<void> {
  const cur = (await db.activity.get(day)) ?? { day, minutes: 0, xp: 0, sessions: 0, correct: 0, total: 0 };
  await db.activity.put({
    day,
    minutes: cur.minutes + patch.minutes,
    xp: cur.xp + patch.xp,
    sessions: cur.sessions + patch.sessions,
    correct: cur.correct + patch.correct,
    total: cur.total + patch.total,
  });
}

/** Closes a session: XP, streak, cursor, activity and badges. Returns the result shown to the learner. */
/** Applies answers to spaced-repetition cards (creating cards for new questions). Unanswered questions are left alone. */
async function updateCards(skillsetId: string, questions: Mcq[], answers: Record<string, number>, day: string): Promise<void> {
  const now = nowIso();
  for (const q of questions) {
    if (answers[q.id] === undefined) continue;
    const id = q.cardId ?? cardId(skillsetId, q);
    const card = await db.cards.get(id);
    await db.cards.put(review(card, q, skillsetId, answers[q.id] === q.answer, day, now));
  }
}

/** Cards of a skillset (all, or only those due on `day`). */
export async function skillsetCards(skillsetId: string): Promise<Card[]> {
  return db.cards.where("skillsetId").equals(skillsetId).toArray();
}

export async function completeSession(sessionId: string): Promise<SessionResult> {
  return db.transaction("rw", [db.sessions, db.skillsets, db.profile, db.activity, db.chunks, db.courses, db.cards], async () => {
    const session = await db.sessions.get(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status === "done" && session.result) return session.result;
    const skillset = await db.skillsets.get(session.skillsetId);
    if (!skillset) throw new Error("Skillset not found");
    const profile = await getProfile();
    const today = localDay();
    const streakState = registerDay(profile.streak, today);
    const minutesSpent = Math.max(1, Math.min(session.minutes * 2, Math.round(session.progress.seconds / 60)));

    let xp = 0;
    let correct = 0;
    let total = 0;
    let openScore: number | undefined;
    const skillsetPatch: Partial<Skillset> = {};

    let checkpoint: SessionResult["checkpoint"];
    if (session.kind === "placement" && session.placement) {
      const r = scorePlacement(session.placement.questions, session.progress.mcq, nowIso());
      correct = r.score;
      total = r.total;
      xp = XP.placement + r.score * 5;
      skillsetPatch.placement = r;
    } else if (session.kind === "final" && session.placement) {
      // final test: every answer also updates its card (wrong ones go back to the start)
      const qs = session.placement.questions;
      const weak = new Set<string>();
      for (const q of qs) {
        const right = session.progress.mcq[q.id] === q.answer;
        if (right) correct++;
        else if (q.topic) weak.add(q.topic);
      }
      total = qs.length;
      xp = XP.placement + correct * 5;
      await updateCards(skillset.id, qs, session.progress.mcq, today);
      skillsetPatch.final = { score: correct, total, at: nowIso(), weak: [...weak] };
    } else if (session.lesson) {
      const lesson = session.lesson;
      const t = tallyLesson(lesson, session.progress, session.minutes, streakState.current);
      xp = t.xp;
      correct = t.correct;
      total = t.total;
      // badges like "Deep Thinker" need an AI grade; self-checks still earn XP
      openScore = session.progress.grade && !session.progress.grade.self ? session.progress.grade.score : undefined;
      const chunks = (await db.chunks.bulkGet(session.chunkIds)).filter((c): c is Chunk => !!c);
      const at = nowIso();
      if (lesson.mode === "course") {
        // progress lives in the done sessions (by lesson id); the cursor just mirrors the count
        skillsetPatch.cursor = (await doneCourseLessonIds(skillset.id)).add(lesson.courseLessonId ?? "").size;
      } else if (lesson.mode === "offline" && lesson.readTo) {
        const read = chunks.filter((c) => c.order < lesson.readTo!.cursor);
        await db.chunks.bulkPut(read.map((c) => ({ ...c, coveredAt: c.coveredAt ?? at })));
        // never move backwards (e.g. an older offline session finished late)
        const ahead = lesson.readTo.cursor > skillset.cursor || (lesson.readTo.cursor === skillset.cursor && lesson.readTo.word > (skillset.cursorWord ?? 0));
        if (ahead) {
          skillsetPatch.cursor = lesson.readTo.cursor;
          skillsetPatch.cursorWord = lesson.readTo.word;
        }
      } else {
        await db.chunks.bulkPut(chunks.map((c) => ({ ...c, coveredAt: c.coveredAt ?? at })));
        skillsetPatch.cursor = advanceCursor(skillset.cursor, chunks);
        if (skillsetPatch.cursor !== skillset.cursor) skillsetPatch.cursorWord = 0;
      }
      skillsetPatch.lessonsDone = skillset.lessonsDone + 1;
      // spaced repetition: review answers move their cards, today's questions become cards
      await updateCards(skillset.id, [...lesson.review.questions, ...lesson.quiz], session.progress.mcq, today);
      if (lesson.checkpoint && lesson.review.questions.length) {
        const qs = lesson.review.questions;
        checkpoint = { correct: qs.filter((q) => session.progress.mcq[q.id] === q.answer).length, total: qs.length };
      }
    }

    const newXp = profile.xp + xp;
    const levelBefore = levelFromXp(profile.xp);
    const levelAfter = levelFromXp(newXp);

    const course = skillset.courseId ? await db.courses.get(skillset.courseId) : undefined;
    const totalChunks = course ? course.lessons.length : await db.chunks.where("skillsetId").equals(skillset.id).count();
    const allDone = await db.sessions.where("status").equals("done").toArray();
    const sessionsDone = allDone.filter((s) => s.kind === "lesson").length + (session.kind === "lesson" ? 1 : 0);
    const placementsDone = allDone.filter((s) => s.kind === "placement").length + (session.kind === "placement" ? 1 : 0);
    const earned = newBadges(
      {
        sessionsDone,
        placementsDone,
        streak: streakState.current,
        skillsets: await db.skillsets.count(),
        level: levelAfter,
        last: {
          kind: session.kind,
          minutes: session.minutes,
          correct,
          total,
          openScore,
          coverage: session.kind === "lesson" ? coverage(totalChunks, skillsetPatch.cursor ?? skillset.cursor) : 0,
        },
      },
      profile.badges,
    );
    const badgeMap = { ...profile.badges };
    for (const id of earned) if (badgeById(id)) badgeMap[id] = nowIso();

    const result: SessionResult = {
      xp,
      correct,
      total,
      ...(checkpoint ? { checkpoint } : {}),
      openScore,
      minutesSpent,
      badges: earned,
      levelUp: levelAfter > levelBefore ? levelAfter : undefined,
      streak: streakState.current,
    };

    await db.sessions.put({ ...session, status: "done", finishedAt: nowIso(), result });
    await db.skillsets.put({
      ...skillset,
      ...skillsetPatch,
      xp: skillset.xp + xp,
      correct: skillset.correct + correct,
      total: skillset.total + total,
      minutesSpent: skillset.minutesSpent + minutesSpent,
    });
    await db.profile.put({ ...profile, xp: newXp, streak: streakState, badges: badgeMap });
    await bumpActivity(today, { minutes: minutesSpent, xp, sessions: 1, correct, total });
    return result;
  });
}

// ---------- backup ----------

export interface Backup {
  app: "pes";
  version: number;
  exportedAt: string;
  data: Record<string, unknown[]>;
}

/** Backup file format version (v1 = app 0.1, v2 adds `courses`). Older files still restore. */
export const BACKUP_VERSION = 2;

export class BackupError extends Error {}

export async function exportBackup(): Promise<Backup> {
  const data: Record<string, unknown[]> = {};
  await db.transaction("r", db.tables, async () => {
    for (const t of db.tables) data[t.name] = await t.toArray();
  });
  return { app: "pes", version: BACKUP_VERSION, exportedAt: nowIso(), data };
}

export function isBackup(b: unknown): b is Backup {
  const o = b as Backup | null;
  return !!o && o.app === "pes" && typeof o.data === "object" && o.data !== null && typeof o.version === "number";
}

/** Replaces everything in the app with the backup. Tables missing from older backups end up empty. */
export async function importBackup(b: unknown): Promise<void> {
  if (!isBackup(b)) throw new BackupError("not-backup");
  if (b.version > BACKUP_VERSION) throw new BackupError("newer-backup");
  await db.transaction("rw", db.tables, async () => {
    for (const t of db.tables) {
      await t.clear();
      const rows = b.data[t.name];
      if (Array.isArray(rows) && rows.length) await t.bulkPut(rows as never[]);
    }
  });
}

export async function wipeAll(): Promise<void> {
  await db.transaction("rw", db.tables, async () => {
    for (const t of db.tables) await t.clear();
  });
}
