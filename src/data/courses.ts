/** Importing course files. Re-importing a newer version keeps the learner's progress. */
import { parseCourse } from "../core/course";
import { nowIso, uid } from "../core/ids";
import type { Course, Skillset } from "../core/types";
import { db } from "./db";

export interface CourseImportResult {
  course: Course;
  skillset: Skillset;
  /** True when the course was already in the app and got updated. */
  updated: boolean;
  /** Lessons that were not in the previous version. */
  newLessons: number;
}

export async function importCourse(text: string): Promise<CourseImportResult> {
  const course = parseCourse(text, nowIso());
  return db.transaction("rw", [db.courses, db.skillsets, db.sessions], async () => {
    const old = await db.courses.get(course.id);
    const oldIds = new Set(old?.lessons.map((l) => l.id) ?? []);
    await db.courses.put(course);
    const existing = (await db.skillsets.toArray()).find((s) => s.courseId === course.id);
    if (existing) {
      // a not-yet-started lesson may come from the old version — rebuild it next time
      await db.sessions.where("[skillsetId+status]").equals([existing.id, "ready"]).delete();
      return { course, skillset: existing, updated: true, newLessons: course.lessons.filter((l) => !oldIds.has(l.id)).length };
    }
    const skillset: Skillset = {
      id: uid("sk_"),
      name: course.title,
      goal: course.goal || course.description,
      hue: course.hue,
      minutes: course.minutes,
      useInternet: false,
      language: course.language,
      createdAt: nowIso(),
      cursor: 0,
      lessonsDone: 0,
      xp: 0,
      correct: 0,
      total: 0,
      minutesSpent: 0,
      placementSkipped: true,
      courseId: course.id,
    };
    await db.skillsets.put(skillset);
    return { course, skillset, updated: false, newLessons: course.lessons.length };
  });
}
