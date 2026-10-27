/**
 * Built-in starter courses (ADR-031): installed on first open from the text files bundled
 * with the app, in the interface language. They work like an imported course — no AI, no
 * network — and skip the placement test, since they start from zero.
 */
import { courseFromText } from "../core/courseText";
import type { Skillset } from "../core/types";
import { builtinCourseId, loadBuiltinCourse } from "../courses";
import type { Lang } from "../i18n";
import { importCourse } from "./courses";
import { db } from "./db";
import { skipPlacement } from "./repo";

export interface BuiltinInstall {
  skillset: Skillset;
  /** False when the course was already in the app (it is opened, not added again). */
  fresh: boolean;
}

/** The skillset of a built-in course in this language, if the learner already has it. */
export async function findBuiltin(slug: string, lang: Lang): Promise<Skillset | undefined> {
  const id = builtinCourseId(slug, lang);
  return (await db.skillsets.toArray()).find((s) => s.courseId === id);
}

/**
 * Adds a built-in course (or returns the one already added). A newer bundled version of a
 * course already in the app is imported over it — progress stays (see importCourse).
 */
export async function installBuiltinCourse(slug: string, lang: Lang): Promise<BuiltinInstall> {
  const raw = courseFromText(await loadBuiltinCourse(slug, lang));
  const existing = (await db.skillsets.toArray()).find((s) => s.courseId === raw.id);
  if (existing) {
    const stored = await db.courses.get(raw.id);
    if (stored && stored.version < raw.version) await importCourse(JSON.stringify(raw));
    return { skillset: existing, fresh: false };
  }
  const r = await importCourse(JSON.stringify(raw));
  await skipPlacement(r.skillset.id);
  return { skillset: (await db.skillsets.get(r.skillset.id)) ?? r.skillset, fresh: true };
}
