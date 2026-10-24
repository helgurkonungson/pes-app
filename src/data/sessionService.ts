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
import { asReviewQuestions, dueCards, isCheckpoint, testCards } from "../core/srs";
import { localDay } from "../core/dates";
import type { Chunk, LessonContent, LessonDraft, Mcq, Session, Skillset } from "../core/types";
import { t } from "../i18n";
import { db, getProfile } from "./db";
import { doneCourseLessonIds, findReadySession, lastDoneLesson, nextSessionNumber, recentMistakes, saveSession, skillsetCards, skillsetChunks, skipPlacement } from "./repo";

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

// ---------- review step, intermediate and final tests ----------

/** Review questions per lesson (due cards). */
const REVIEW_MAX = 6;
const CHECKPOINT_SIZE = 8;
const FINAL_SIZE = 15;

/**
 * The review step of the next lesson: spaced-repetition cards due today, or — every few
 * lessons — an intermediate test over everything learned so far. Empty for the first lesson.
 */
export async function buildReview(skillset: Skillset, last: LessonContent | undefined): Promise<{ review: LessonContent["review"]; checkpoint: boolean }> {
  if (!last) return { review: { recap: [], questions: [] }, checkpoint: false };
  const cards = await skillsetCards(skillset.id);
  if (isCheckpoint(skillset.lessonsDone, cards.length)) {
    return { review: { recap: [], questions: asReviewQuestions(testCards(cards, CHECKPOINT_SIZE), "ck") }, checkpoint: true };
  }
  const due = dueCards(cards, localDay()).slice(0, REVIEW_MAX);
  return { review: { recap: last.theory.keyPoints.slice(0, 4), questions: asReviewQuestions(due) }, checkpoint: false };
}

/** A ready lesson may have been prepared days ago: give it today's due cards before it starts. */
async function refreshReview(session: Session): Promise<Session> {
  if (session.status !== "ready" || session.kind !== "lesson" || !session.lesson) return session;
  const skillset = await db.skillsets.get(session.skillsetId);
  if (!skillset) return session;
  const last = await lastDoneLesson(session.skillsetId);
  const { review, checkpoint } = await buildReview(skillset, last?.lesson);
  // a background writer may have saved newer parts (or the finished lesson) meanwhile:
  // patch only the review of the stored lesson, never write back the copy we were given
  return db.transaction("rw", db.sessions, db.drafts, async () => {
    const fresh = await db.sessions.get(session.id);
    if (!fresh?.lesson) return fresh ?? session;
    const lesson = withReview(fresh.lesson, review, checkpoint);
    await db.sessions.update(fresh.id, { lesson });
    if (lesson.building) {
      const d = await db.drafts.get(fresh.skillsetId);
      if (d) await db.drafts.put({ ...d, review });
    }
    return { ...fresh, lesson };
  });
}

function withReview(lesson: LessonContent, review: LessonContent["review"], checkpoint: boolean | undefined): LessonContent {
  const out: LessonContent = { ...lesson, review, checkpoint };
  if (!checkpoint) delete out.checkpoint;
  return out;
}

/** Saves a newer version of a lesson being written, keeping the review step stored with it (refreshReview may have renewed it). */
async function storeWrittenLesson(sessionId: string, lesson: LessonContent): Promise<void> {
  await db.transaction("rw", db.sessions, async () => {
    const cur = await db.sessions.get(sessionId);
    if (!cur) return;
    // a late partial must never turn a finished lesson back into one "still being written"
    if (cur.lesson && !cur.lesson.building && lesson.building) return;
    await db.sessions.update(sessionId, { lesson: cur.lesson ? withReview(lesson, cur.lesson.review, cur.lesson.checkpoint) : lesson });
  });
}

/** The final test, once the material is covered: questions from every topic learned. Null when there is too little to test. */
async function finalTest(skillset: Skillset, minutes: number): Promise<Session | null> {
  if (skillset.final) return null;
  const cards = await skillsetCards(skillset.id);
  if (cards.length < 4) return null;
  const ready = await findReadySession(skillset.id, minutes, "final");
  if (ready) return ready;
  const s = baseSession(skillset.id, "final", await nextSessionNumber(skillset.id), minutes);
  s.placement = { intro: t("final.intro"), questions: asReviewQuestions(testCards(cards, FINAL_SIZE), "f") };
  await saveSession(s);
  return s;
}

/** True when every lesson chunk of the sources has been taught. */
function materialCovered(chunks: Chunk[], skillset: Skillset): boolean {
  return chunks.length > 0 && chunks.every((c) => c.order < skillset.cursor);
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
  if (ready) return refreshReview(ready);
  for (const s of open) if (s.kind === "lesson") await db.sessions.delete(s.id);
  if (!next) {
    const test = await finalTest(skillset, course.minutes);
    if (test) return test;
    throw new CourseFinishedError();
  }
  // the author's recall questions for the previous lesson + today's due cards
  const lesson = buildCourseLesson(course, next, { doneIds, mistakes: [] });
  const last = await lastDoneLesson(skillset.id);
  const { review, checkpoint } = await buildReview(skillset, last?.lesson);
  lesson.review = checkpoint ? review : { recap: lesson.review.recap.length ? lesson.review.recap : review.recap, questions: [...review.questions, ...lesson.review.questions].slice(0, REVIEW_MAX) };
  if (checkpoint) lesson.checkpoint = true;
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
  const lesson = buildOfflineLesson({
    chunks,
    cursor: skillset.cursor,
    cursorWord: skillset.cursorWord ?? 0,
    minutes,
    mistakes: [],
    labels: offlineLabels(),
    seed: skillset.cursor * 100_003 + (skillset.cursorWord ?? 0) + skillset.lessonsDone * 7,
  });
  lesson.fallback = fallback;
  const { review, checkpoint } = await buildReview(skillset, last?.lesson);
  lesson.review = review;
  if (checkpoint) lesson.checkpoint = true;
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
  /** The review step (due cards / intermediate test); the AI doesn't write it. */
  review?: { review: LessonContent["review"]; checkpoint: boolean };
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
  return writers.has(sessionId) || resuming.has(sessionId);
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
      review: inp.review?.review,
      onPartial: async (partial) => {
        partial.mode = "ai";
        if (inp.review?.checkpoint) partial.checkpoint = true;
        if (started) {
          await storeWrittenLesson(base.id, partial);
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
      if (inp.review?.checkpoint) lesson.checkpoint = true;
      if (!started) {
        await db.drafts.delete(base.skillsetId);
        return resolve({ status: "done", lesson });
      }
      // finished lesson first, then the draft: a lesson marked "building" never loses its saved steps
      await storeWrittenLesson(base.id, lesson);
      await db.drafts.delete(base.skillsetId);
    });
    const tracked = done.catch(async (e) => {
      if (!started) return reject(e);
      await markWritingFailed(base.id, e);
    });
    const entry = tracked.then(() => undefined);
    writers.set(base.id, entry);
    void entry.finally(() => {
      if (writers.get(base.id) === entry) writers.delete(base.id);
    });
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
export function continueWriting(sessionId: string): Promise<void> {
  const running = writers.get(sessionId) ?? resuming.get(sessionId);
  if (running) return running;
  // registered before the first await, so two callers can never start two writers
  const p = resumeWriting(sessionId).finally(() => resuming.delete(sessionId));
  resuming.set(sessionId, p);
  return p;
}

/** continueWriting calls between their start and the moment the writer is registered. */
const resuming = new Map<string, Promise<void>>();

async function resumeWriting(sessionId: string): Promise<void> {
  const s = await db.sessions.get(sessionId);
  if (!s?.lesson?.building || s.status === "done") return;
  const skillset = await db.skillsets.get(s.skillsetId);
  if (!skillset) return;
  const draft = await db.drafts.get(s.skillsetId);
  if (!draft || draft.minutes !== s.minutes || draft.chunkIds.join() !== s.chunkIds.join()) {
    // the saved steps are gone: this lesson can't be finished — drop it, a fresh one will be made
    if (s.status === "ready" && !s.startedAt && !s.progress.page) await db.sessions.delete(s.id);
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

  if (kind === "lesson") {
    // all the material is covered: the final test comes next (once)
    const all = lessonChunks(await skillsetChunks(skillsetId), skillset.placement?.known);
    if (materialCovered(all, skillset) && !(await db.sessions.where("[skillsetId+status]").equals([skillsetId, "active"]).count())) {
      const test = await finalTest(skillset, minutes);
      if (test) return test;
    }
  }

  const existing = await findReadySession(skillsetId, minutes, kind);
  if (existing) {
    const staleOffline = existing.status === "ready" && existing.lesson?.mode === "offline" && useAi;
    if (!staleOffline) {
      if (existing.lesson?.building && !writers.has(existing.id)) void continueWriting(existing.id).catch(() => undefined);
      return refreshReview(existing);
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
        const samples = sampleChunks(chunks, Math.ceil(placementSize(minutes) / 2)); // two questions per part
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
        const review = draft?.review ? { review: draft.review as LessonContent["review"], checkpoint: false } : await buildReview(skillset, last?.lesson);
        const started = await writeAiLesson(base, { skillset, minutes, picked, titles, last: last?.lesson, mistakes, previousTitles, draft, review }, opts);
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
