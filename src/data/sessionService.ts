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
import { providerReady } from "../ai/key";
import { activeProvider, modelOf, PROVIDERS } from "../ai/providers";
import { aiState, isBlocking } from "../core/aiStatus";
import { lessonChunks } from "../core/cleanText";
import { buildCourseLesson, buildCoursePlacement, coveredLessonIds, nextCourseLesson } from "../core/course";
import { nowIso, uid } from "../core/ids";
import { buildOfflineLesson, buildOfflinePlacement, type OfflineLabels } from "../core/offline";
import { clampMinutes, pickChunks, placementSize, planSession, sampleChunks } from "../core/planner";
import { needsPlacement } from "../core/scoring";
import type { Chunk, LessonContent, LessonDraft, Mcq, Session, Skillset } from "../core/types";
import { t } from "../i18n";
import { db, getProfile } from "./db";
import { doneCourseLessonIds, findReadySession, lastDoneLesson, nextSessionNumber, recentMistakes, saveSession, skillsetChunks, skipPlacement } from "./repo";

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
  // first a short placement test (one question per lesson spread over the course)
  if (needsPlacement(skillset)) {
    const ready = await findReadySession(skillset.id, course.minutes, "placement");
    if (ready) return ready;
    const placement = buildCoursePlacement(course, placementSize(course.minutes), t("placement.courseIntro"));
    if (placement) {
      const s = baseSession(skillset.id, "placement", await nextSessionNumber(skillset.id), course.minutes);
      s.placement = placement;
      await saveSession(s);
      return s;
    }
    await skipPlacement(skillset.id);
  }
  // lessons the placement test showed as known are skipped
  const next = nextCourseLesson(course, coveredLessonIds(doneIds, skillset.placement?.known));
  // a started lesson always wins; a ready one only if it is still the next lesson
  const open = await db.sessions.where("[skillsetId+status]").anyOf([skillset.id, "ready"], [skillset.id, "active"]).toArray();
  const active = open.find((s) => s.status === "active" && s.lesson);
  if (active) return active;
  const ready = open.find((s) => s.lesson?.courseLessonId === next?.id);
  if (ready) return ready;
  for (const s of open) if (s.kind === "lesson") await db.sessions.delete(s.id);
  if (!next) throw new CourseFinishedError();
  const mistakes = await recentMistakes(skillset.id, 2);
  const lesson = buildCourseLesson(course, next, { doneIds, mistakes });
  const s = baseSession(skillset.id, "lesson", await nextSessionNumber(skillset.id), course.minutes);
  s.lesson = lesson;
  await saveSession(s);
  return s;
}

/** Offline placement test from the learner's sources; null when the material is too thin. */
async function offlinePlacement(skillset: Skillset, minutes: number): Promise<Session | null> {
  const chunks = lessonChunks(await skillsetChunks(skillset.id));
  const placement = buildOfflinePlacement(chunks, placementSize(minutes), { ...offlineLabels(), placementIntro: t("placement.offlineIntro") }, chunks.length * 7 + minutes);
  if (!placement) return null;
  const s = baseSession(skillset.id, "placement", await nextSessionNumber(skillset.id), minutes);
  s.placement = placement;
  return s;
}

async function buildOffline(skillset: Skillset, minutes: number, fallback: LessonContent["fallback"]): Promise<{ lesson: LessonContent; chunkIds: string[] }> {
  // no title pages, contents, prefaces or index; no PDF debris
  const chunks = lessonChunks(await skillsetChunks(skillset.id), skillset.placement?.known);
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

/** Drafts older than this are dropped: the sources or the learner have moved on. */
const DRAFT_TTL_MS = 3 * 24 * 3600_000;

export function usableDraft(d: LessonDraft | undefined, minutes: number, chunkIds: string[]): LessonDraft | undefined {
  if (!d || d.minutes !== minutes) return undefined;
  if (Date.now() - Date.parse(d.updatedAt) > DRAFT_TTL_MS) return undefined;
  if (d.chunkIds.length !== chunkIds.length || d.chunkIds.some((id, i) => id !== chunkIds[i])) return undefined;
  return d;
}

interface WriterInputs {
  skillset: Skillset;
  minutes: number;
  picked: Chunk[];
  titles: Map<string, string>;
  last?: LessonContent;
  mistakes: Mcq[];
  previousTitles: string[];
  draft?: LessonDraft;
}

/** Background writers of lessons the learner has already started, by session id. */
const writers = new Map<string, Promise<void>>();

export function isWriting(sessionId: string): boolean {
  return writers.has(sessionId);
}

/**
 * Writes an AI lesson step by step. As soon as the review and part 1 exist the session is
 * saved and returned ("saved") so the learner can begin; the remaining parts are written in
 * the background and stored into the session as they finish. A lesson that finishes before
 * that point is returned whole ("done") for the caller to save.
 */
async function writeAiLesson(
  base: Session,
  inp: WriterInputs,
  opts: PrepareOptions,
  /** The session is already saved (continuing): only its lesson is updated. */
  existing = false,
): Promise<{ status: "saved"; session: Session } | { status: "done"; lesson: LessonContent }> {
  const profile = await getProfile();
  // the screen's cancel button stops writing only until the lesson can start
  const inner = new AbortController();
  let started = existing;
  opts.signal?.addEventListener("abort", () => {
    if (!started) inner.abort();
  });
  return new Promise((resolve, reject) => {
    if (existing) resolve({ status: "saved", session: base });
    const run = generateLesson({
      model: modelOf(profile),
      webSearch: PROVIDERS[activeProvider(profile)].webSearch,
      skillset: inp.skillset,
      plan: planSession(inp.minutes),
      number: base.number,
      chunks: inp.picked,
      sourceTitles: inp.titles,
      lastLesson: inp.last,
      mistakes: inp.mistakes,
      previousTitles: inp.previousTitles,
      onProgress: (stage, detail, steps) => {
        if (!started) opts.onProgress?.(stage, detail, steps);
      },
      signal: inner.signal,
      draft: inp.draft,
      saveDraft: async (d) => {
        await db.drafts.put(d);
      },
      onPartial: async (partial) => {
        partial.mode = "ai";
        if (started) {
          await db.sessions.update(base.id, { lesson: partial });
          return;
        }
        if (!(await db.skillsets.get(base.skillsetId))) throw new Error("Skillset was deleted");
        started = true;
        const session: Session = { ...base, lesson: partial };
        await saveSession(session);
        resolve({ status: "saved", session });
      },
    });
    const done = run.then(async ({ lesson }) => {
      lesson.mode = "ai";
      await db.drafts.delete(base.skillsetId);
      if (!started) return resolve({ status: "done", lesson });
      await db.sessions.update(base.id, { lesson });
    });
    const tracked = done.catch(async (e) => {
      if (!started) return reject(e);
      await markWritingFailed(base.id, e);
    });
    writers.set(base.id, tracked.then(() => undefined));
    void tracked.finally(() => writers.delete(base.id));
  });
}

async function markWritingFailed(sessionId: string, e: unknown): Promise<void> {
  const kind = e instanceof AiError ? e.kind : "api";
  if (e instanceof AiError && isBlocking(e.kind)) await reportAiError(e);
  const s = await db.sessions.get(sessionId);
  if (s?.lesson?.building) await db.sessions.update(sessionId, { lesson: { ...s.lesson, building: { ...s.lesson.building, error: kind } } });
}

/**
 * Continues writing a started lesson whose background writing stopped (app closed,
 * phone asleep, network error). Safe to call any time — does nothing when it is
 * already being written or complete.
 */
export async function continueWriting(sessionId: string): Promise<void> {
  if (writers.has(sessionId)) return writers.get(sessionId);
  const s = await db.sessions.get(sessionId);
  if (!s?.lesson?.building || s.status === "done") return;
  const skillset = await db.skillsets.get(s.skillsetId);
  if (!skillset) return;
  const draft = await db.drafts.get(s.skillsetId);
  if (!draft || draft.minutes !== s.minutes || draft.chunkIds.join() !== s.chunkIds.join()) {
    // the saved steps are gone: this lesson can't be finished — drop it, a fresh one will be made
    if (s.status === "ready" || !s.progress.page) await db.sessions.delete(s.id);
    else await markWritingFailed(s.id, new AiError("Lesson draft missing.", "bad-response"));
    return;
  }
  await db.sessions.update(s.id, { lesson: { ...s.lesson, building: { ...s.lesson.building, error: undefined } } });
  const all = lessonChunks(await skillsetChunks(s.skillsetId), skillset.placement?.known);
  const byId = new Map(all.map((c) => [c.id, c]));
  const picked = s.chunkIds.map((id) => byId.get(id)).filter((c): c is Chunk => !!c);
  const last = await lastDoneLesson(s.skillsetId);
  await writeAiLesson(s, { skillset, minutes: s.minutes, picked, titles: await sourceTitles(s.skillsetId), last: last?.lesson, mistakes: await recentMistakes(s.skillsetId), previousTitles: [], draft }, {}, true);
  await writers.get(s.id);
}

async function doPrepare(skillsetId: string, minutesIn: number, opts: PrepareOptions): Promise<Session> {
  let skillset = await db.skillsets.get(skillsetId);
  if (!skillset) throw new Error("Skillset not found");
  if (skillset.courseId) return prepareCourseSession(skillset);

  const minutes = clampMinutes(minutesIn);
  const profile = await getProfile();
  const state = aiState(profile, await providerReady());
  const useAi = !opts.offline && state === "ok";

  let kind: Session["kind"] = needsPlacement(skillset) ? "placement" : "lesson";
  if (kind === "placement") {
    // an already written placement test needs no AI to take
    const readyTest = await findReadySession(skillsetId, minutes, "placement");
    if (readyTest) return readyTest;
  }
  if (kind === "placement" && !useAi) {
    // no AI: the placement test is built from the learner's own sources
    const test = await offlinePlacement(skillset, minutes);
    if (test) {
      await saveSession(test);
      return test;
    }
    // nothing to build a test from: start from zero
    await skipPlacement(skillsetId);
    skillset = (await db.skillsets.get(skillsetId))!;
    kind = "lesson";
  }

  const existing = await findReadySession(skillsetId, minutes, kind);
  if (existing) {
    const staleOffline = existing.status === "ready" && existing.lesson?.mode === "offline" && useAi;
    if (!staleOffline) {
      if (existing.lesson?.building && !writers.has(existing.id)) void continueWriting(existing.id).catch(() => undefined);
      return existing;
    }
    await db.sessions.delete(existing.id);
  }

  const number = await nextSessionNumber(skillsetId);
  const base = baseSession(skillsetId, kind, number, minutes);
  let fallback: LessonContent["fallback"] = opts.offline ? "offline-mode" : state === "ok" ? undefined : state === "off" ? "offline-mode" : state;

  if (useAi) {
    try {
      // the placement test samples all material; lessons skip what the learner already knows
      const chunks = lessonChunks(await skillsetChunks(skillsetId), kind === "placement" ? undefined : skillset.placement?.known);
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
        // continue a lesson that was interrupted half-written (same portion, same material)
        const draft = usableDraft(await db.drafts.get(skillsetId), minutes, picked.map((c) => c.id));
        if (draft) base.number = draft.number;
        base.chunkIds = picked.map((c) => c.id);
        const started = await writeAiLesson(base, { skillset, minutes, picked, titles, last: last?.lesson, mistakes, previousTitles, draft }, opts);
        if (started.status === "saved") {
          await reportAiOk();
          return started.session; // the rest is being written in the background
        }
        base.lesson = started.lesson;
      }
      await reportAiOk();
    } catch (e) {
      // no credits / rejected key: remember it and continue offline; anything else goes to the screen
      if (!(e instanceof AiError) || !isBlocking(e.kind)) throw e;
      await reportAiError(e);
      fallback = e.kind;
      if (kind === "placement") {
        // the AI can't write the test: build it from the sources instead
        const test = await offlinePlacement(skillset, minutes);
        if (test) {
          await saveSession(test);
          return test;
        }
        await skipPlacement(skillsetId);
        skillset = (await db.skillsets.get(skillsetId))!;
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
  if (aiState(profile, await providerReady()) !== "ok") return;
  prepareSession(skillsetId, minutes).catch(() => {
    /* best effort — the learner can still generate on demand */
  });
}

/** Restart reading a skillset's sources from the beginning (after everything was read offline). */
export async function restartReading(skillsetId: string): Promise<void> {
  await db.skillsets.update(skillsetId, { cursor: 0, cursorWord: 0 });
  await db.sessions.where("[skillsetId+status]").equals([skillsetId, "ready"]).delete();
}
