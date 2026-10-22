/** Prepares sessions (placement or lesson) by combining planner, data and AI. */
import { nowIso, uid } from "../core/ids";
import { clampMinutes, pickChunks, placementSize, planSession, sampleChunks } from "../core/planner";
import type { Session } from "../core/types";
import { generateLesson, generatePlacement, type Progress } from "../ai/tutor";
import { db, getProfile } from "./db";
import { findReadySession, lastDoneLesson, nextSessionNumber, recentMistakes, saveSession, skillsetChunks } from "./repo";

async function sourceTitles(skillsetId: string): Promise<Map<string, string>> {
  const sources = await db.sources.where("skillsetId").equals(skillsetId).toArray();
  return new Map(sources.map((s) => [s.id, s.title]));
}

const inflight = new Map<string, Promise<Session>>();

/**
 * Returns a ready (or already started) session for the skillset, generating one if needed.
 * The first session of a skillset is always the placement test.
 */
export function prepareSession(skillsetId: string, minutesIn: number, onProgress?: Progress, signal?: AbortSignal): Promise<Session> {
  const key = `${skillsetId}:${minutesIn}`;
  const running = inflight.get(key);
  if (running) return running;
  const p = doPrepare(skillsetId, minutesIn, onProgress, signal).finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

async function doPrepare(skillsetId: string, minutesIn: number, onProgress?: Progress, signal?: AbortSignal): Promise<Session> {
  const skillset = await db.skillsets.get(skillsetId);
  if (!skillset) throw new Error("Skillset not found");
  const minutes = clampMinutes(minutesIn);
  const kind: Session["kind"] = skillset.placement ? "lesson" : "placement";
  const existing = await findReadySession(skillsetId, minutes, kind);
  if (existing) return existing;

  const profile = await getProfile();
  const chunks = await skillsetChunks(skillsetId);
  const titles = await sourceTitles(skillsetId);
  const number = await nextSessionNumber(skillsetId);
  const base: Session = {
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

  if (kind === "placement") {
    onProgress?.("writing", "Building your placement test…");
    const samples = sampleChunks(chunks, 6);
    base.placement = await generatePlacement({ model: profile.model, skillset, samples, sourceTitles: titles, count: placementSize(minutes), signal });
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
      model: profile.model,
      skillset,
      plan,
      number,
      chunks: picked,
      sourceTitles: titles,
      lastLesson: last?.lesson,
      mistakes,
      previousTitles,
      onProgress,
      signal,
    });
    base.lesson = lesson;
    base.chunkIds = picked.map((c) => c.id);
  }
  // the skillset may have changed while we were generating (e.g. a source removed)
  if (!(await db.skillsets.get(skillsetId))) throw new Error("Skillset was deleted");
  await saveSession(base);
  return base;
}

/** After finishing a session, quietly prepare the next one so it is ready (and works offline). */
export function prefetchNext(skillsetId: string, minutes: number): void {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  prepareSession(skillsetId, minutes).catch(() => {
    /* best effort — the learner can still generate on demand */
  });
}
