/**
 * Prepares sessions. Three kinds of lessons:
 * - course lessons (imported course, no AI);
 * - AI lessons (placement test + lessons written by Claude);
 * - offline lessons built on the device from the learner's sources, used when
 *   AI is off, has no key, ran out of credits, or the learner asks for it.
 */
import { AiError } from "../ai/client";
import { reportAiError, reportAiOk } from "../ai/status";
import { generateLesson, generatePlacement, type Progress } from "../ai/tutor";
import { getApiKey } from "../ai/key";
import { activeProvider, modelOf, PROVIDERS } from "../ai/providers";
import { aiState, isBlocking } from "../core/aiStatus";
import { buildCourseLesson, nextCourseLesson } from "../core/course";
import { nowIso, uid } from "../core/ids";
import { buildOfflineLesson, type OfflineLabels } from "../core/offline";
import { clampMinutes, pickChunks, placementSize, planSession, sampleChunks } from "../core/planner";
import type { LessonContent, Session, Skillset } from "../core/types";
import { t } from "../i18n";
import { db, getProfile } from "./db";
import { doneCourseLessonIds, findReadySession, lastDoneLesson, nextSessionNumber, recentMistakes, saveSession, skillsetChunks } from "./repo";

export class CourseFinishedError extends Error {
  constructor() {
    super("course-finished");
  }
}

async function sourceTitles(skillsetId: string): Promise<Map<string, string>> {
  const sources = await db.sources.where("skillsetId").equals(skillsetId).toArray();
  return new Map(sources.map((s) => [s.id, s.title]));
}

export function offlineLabels(): OfflineLabels {
  return {
    title: (c) => t("offline.title", { title: c }),
    part: (c, i, n) => t("offline.part", { title: c, i, n }),
    gapQuestion: (g) => t("offline.gapQ", { text: g }),
    gapExplain: (s) => t("offline.gapExplain", { text: s }),
    gapTopic: t("offline.gapTopic"),
    openQuestion: (c) => t("offline.openQ", { title: c }),
  };
}

export interface PrepareOptions {
  onProgress?: Progress;
  signal?: AbortSignal;
  /** Build an offline lesson even if AI is available. */
  offline?: boolean;
}

const inflight = new Map<string, Promise<Session>>();

/**
 * Returns a ready (or already started) session for the skillset, preparing one if needed.
 * The first session of a skillset is the placement test when AI is available.
 */
export function prepareSession(skillsetId: string, minutesIn: number, opts: PrepareOptions = {}): Promise<Session> {
  const key = `${skillsetId}:${minutesIn}:${opts.offline ? "off" : "auto"}`;
  const running = inflight.get(key);
  if (running) return running;
  const p = doPrepare(skillsetId, minutesIn, opts).finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

function baseSession(skillsetId: string, kind: Session["kind"], number: number, minutes: number): Session {
  return {
    id: uid("se_"),
    skillsetId,
    kind,
    number,
    minutes,
    status: "ready",
    createdAt: nowIso(),
    chunkIds: [],
    progress: { page: 0, mcq: {}, seconds: 0 },
  };
}

async function prepareCourseSession(skillset: Skillset): Promise<Session> {
  const course = await db.courses.get(skillset.courseId!);
  if (!course) throw new Error("Course not found");
  const doneIds = await doneCourseLessonIds(skillset.id);
  const next = nextCourseLesson(course, doneIds);
  // a started lesson always wins; a ready one only if it is still the next lesson
  const open = await db.sessions.where("[skillsetId+status]").anyOf([skillset.id, "ready"], [skillset.id, "active"]).toArray();
  const active = open.find((s) => s.status === "active" && s.lesson);
  if (active) return active;
  const ready = open.find((s) => s.lesson?.courseLessonId === next?.id);
  if (ready) return ready;
  for (const s of open) await db.sessions.delete(s.id);
  if (!next) throw new CourseFinishedError();
  const mistakes = await recentMistakes(skillset.id, 2);
  const lesson = buildCourseLesson(course, next, { doneIds, mistakes });
  const s = baseSession(skillset.id, "lesson", await nextSessionNumber(skillset.id), course.minutes);
  s.lesson = lesson;
  await saveSession(s);
  return s;
}

async function buildOffline(skillset: Skillset, minutes: number, fallback: LessonContent["fallback"]): Promise<{ lesson: LessonContent; chunkIds: string[] }> {
  const chunks = await skillsetChunks(skillset.id);
  const last = await lastDoneLesson(skillset.id);
  const mistakes = await recentMistakes(skillset.id);
  const lesson = buildOfflineLesson({
    chunks,
    cursor: skillset.cursor,
    cursorWord: skillset.cursorWord ?? 0,
    minutes,
    lastLesson: last?.lesson,
    mistakes,
    labels: offlineLabels(),
    seed: skillset.cursor * 100_003 + (skillset.cursorWord ?? 0) + skillset.lessonsDone * 7,
  });
  lesson.fallback = fallback;
  const ids = new Set<string>();
  const readTo = lesson.readTo!;
  for (const c of chunks) if (c.order >= skillset.cursor && (c.order < readTo.cursor || (c.order === readTo.cursor && readTo.word > 0))) ids.add(c.id);
  return { lesson, chunkIds: [...ids] };
}

async function doPrepare(skillsetId: string, minutesIn: number, opts: PrepareOptions): Promise<Session> {
  let skillset = await db.skillsets.get(skillsetId);
  if (!skillset) throw new Error("Skillset not found");
  if (skillset.courseId) return prepareCourseSession(skillset);

  const minutes = clampMinutes(minutesIn);
  const profile = await getProfile();
  const state = aiState(profile, !!(await getApiKey()));
  const useAi = !opts.offline && state === "ok";

  let kind: Session["kind"] = skillset.placement || skillset.placementSkipped ? "lesson" : "placement";
  if (kind === "placement") {
    // an already written placement test needs no AI to take
    const readyTest = await findReadySession(skillsetId, minutes, "placement");
    if (readyTest) return readyTest;
  }
  if (kind === "placement" && !useAi) {
    // a placement test needs AI — start with lessons instead
    await db.skillsets.update(skillsetId, { placementSkipped: true });
    skillset = { ...skillset, placementSkipped: true };
    kind = "lesson";
  }

  const existing = await findReadySession(skillsetId, minutes, kind);
  if (existing) {
    const staleOffline = existing.status === "ready" && existing.lesson?.mode === "offline" && useAi;
    if (!staleOffline) return existing;
    await db.sessions.delete(existing.id);
  }

  const number = await nextSessionNumber(skillsetId);
  const base = baseSession(skillsetId, kind, number, minutes);
  let fallback: LessonContent["fallback"] = opts.offline ? "offline-mode" : state === "ok" ? undefined : state === "off" ? "offline-mode" : state;

  if (useAi) {
    try {
      const chunks = await skillsetChunks(skillsetId);
      const titles = await sourceTitles(skillsetId);
      if (kind === "placement") {
        opts.onProgress?.("writing");
        const samples = sampleChunks(chunks, 6);
        base.placement = await generatePlacement({ model: modelOf(profile), skillset, samples, sourceTitles: titles, count: placementSize(minutes), signal: opts.signal });
        base.chunkIds = samples.map((c) => c.id);
      } else {
        const plan = planSession(minutes);
        const picked = pickChunks(chunks, skillset.cursor, plan.sourceWords);
        const last = await lastDoneLesson(skillsetId);
        const mistakes = await recentMistakes(skillsetId);
        const done = await db.sessions.where("[skillsetId+status]").equals([skillsetId, "done"]).toArray();
        const previousTitles = done
          .filter((s) => s.lesson)
          .sort((a, b) => (a.finishedAt ?? "").localeCompare(b.finishedAt ?? ""))
          .map((s) => s.lesson!.title);
        const { lesson } = await generateLesson({
          model: modelOf(profile),
          webSearch: PROVIDERS[activeProvider(profile)].webSearch,
          skillset,
          plan,
          number,
          chunks: picked,
          sourceTitles: titles,
          lastLesson: last?.lesson,
          mistakes,
          previousTitles,
          onProgress: opts.onProgress,
          signal: opts.signal,
        });
        lesson.mode = "ai";
        base.lesson = lesson;
        base.chunkIds = picked.map((c) => c.id);
      }
      await reportAiOk();
    } catch (e) {
      // no credits / rejected key: remember it and continue offline; anything else goes to the screen
      if (!(e instanceof AiError) || !isBlocking(e.kind)) throw e;
      await reportAiError(e);
      fallback = e.kind;
      if (kind === "placement") {
        await db.skillsets.update(skillsetId, { placementSkipped: true });
        skillset = { ...skillset, placementSkipped: true };
        base.kind = "lesson";
      }
      base.placement = undefined;
    }
  }

  if (!base.lesson && !base.placement) {
    const { lesson, chunkIds } = await buildOffline(skillset, minutes, fallback);
    base.lesson = lesson;
    base.chunkIds = chunkIds;
  }

  // the skillset may have changed while we were generating (e.g. deleted)
  if (!(await db.skillsets.get(skillsetId))) throw new Error("Skillset was deleted");
  await saveSession(base);
  return base;
}

/** After finishing a session, quietly prepare the next AI lesson so it is ready (and works offline). */
export async function prefetchNext(skillsetId: string, minutes: number): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  const sk = await db.skillsets.get(skillsetId);
  if (!sk || sk.courseId) return;
  const profile = await getProfile();
  if (aiState(profile, !!(await getApiKey())) !== "ok") return;
  prepareSession(skillsetId, minutes).catch(() => {
    /* best effort — the learner can still generate on demand */
  });
}

/** Restart reading a skillset's sources from the beginning (after everything was read offline). */
export async function restartReading(skillsetId: string): Promise<void> {
  await db.skillsets.update(skillsetId, { cursor: 0, cursorWord: 0 });
  await db.sessions.where("[skillsetId+status]").equals([skillsetId, "ready"]).delete();
}
