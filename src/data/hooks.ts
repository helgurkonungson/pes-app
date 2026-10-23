/** Live queries shared by several screens. */
import { useLiveQuery } from "dexie-react-hooks";
import { courseCoverage, nextCourseLesson } from "../core/course";
import { localDay } from "../core/dates";
import { coverage } from "../core/planner";
import type { Course, DayActivity, Profile, Session, Skillset, Source } from "../core/types";
import { db } from "./db";

export interface SkillsetSummary {
  s: Skillset;
  chunks: number;
  sources: number;
  coverage: number;
  accuracy: number | null;
  /** Ready or started session, if any. */
  open?: Session;
  course?: { total: number; done: number; nextTitle?: string; finished: boolean };
  /** Most recent activity (finished session) — used to pick what to continue. */
  lastAt?: string;
}

async function summarize(s: Skillset): Promise<SkillsetSummary> {
  const [chunks, sources, sessions, course] = await Promise.all([
    db.chunks.where("skillsetId").equals(s.id).count(),
    db.sources.where("skillsetId").equals(s.id).count(),
    db.sessions.where("skillsetId").equals(s.id).toArray(),
    s.courseId ? db.courses.get(s.courseId) : Promise.resolve(undefined),
  ]);
  const done = sessions.filter((x) => x.status === "done");
  const open = sessions.find((x) => x.status === "active") ?? sessions.find((x) => x.status === "ready");
  const lastAt = done.map((x) => x.finishedAt ?? "").sort().pop();
  let courseInfo: SkillsetSummary["course"];
  let cov = coverage(chunks, s.cursor + (s.cursorWord ? 0.5 : 0));
  if (course) {
    const doneIds = new Set(done.map((x) => x.lesson?.courseLessonId).filter((x): x is string => !!x));
    const next = nextCourseLesson(course, doneIds);
    courseInfo = { total: course.lessons.length, done: course.lessons.filter((l) => doneIds.has(l.id)).length, nextTitle: next?.title, finished: !next };
    cov = courseCoverage(course, doneIds);
  }
  return { s, chunks, sources, coverage: cov, accuracy: s.total ? s.correct / s.total : null, open, course: courseInfo, lastAt };
}

export function useProfile(): Profile | undefined {
  return useLiveQuery(() => db.profile.get("me"), []);
}

export function useToday(): DayActivity {
  const day = localDay();
  const a = useLiveQuery(() => db.activity.get(day), [day]);
  return a ?? { day, minutes: 0, xp: 0, sessions: 0, correct: 0, total: 0 };
}

export function useSkillsetSummaries(): SkillsetSummary[] | undefined {
  return useLiveQuery(async () => Promise.all((await db.skillsets.orderBy("createdAt").toArray()).map(summarize)), []);
}

/** The skillset to continue: one with a started lesson, else the most recently studied, else the newest. */
export function pickCurrent(list: SkillsetSummary[]): SkillsetSummary | undefined {
  const active = list.find((x) => x.open?.status === "active");
  if (active) return active;
  const unfinished = list.filter((x) => !x.course?.finished);
  const pool = unfinished.length ? unfinished : list;
  return [...pool].sort((a, b) => (b.lastAt ?? b.s.createdAt).localeCompare(a.lastAt ?? a.s.createdAt))[0];
}

export interface SkillsetDetailData {
  s: Skillset;
  chunks: number;
  sources: Source[];
  sessions: Session[];
  coverage: number;
  course?: Course;
  doneIds: Set<string>;
}

export function useSkillset(id: string): SkillsetDetailData | null | undefined {
  return useLiveQuery(async () => {
    const s = await db.skillsets.get(id);
    if (!s) return null;
    const [chunks, sources, sessions, course] = await Promise.all([
      db.chunks.where("skillsetId").equals(id).count(),
      db.sources.where("skillsetId").equals(id).sortBy("addedAt"),
      db.sessions.where("skillsetId").equals(id).toArray(),
      s.courseId ? db.courses.get(s.courseId) : Promise.resolve(undefined),
    ]);
    const doneIds = new Set(sessions.filter((x) => x.status === "done").map((x) => x.lesson?.courseLessonId).filter((x): x is string => !!x));
    const cov = course ? courseCoverage(course, doneIds) : coverage(chunks, s.cursor + (s.cursorWord ? 0.5 : 0));
    return { s, chunks, sources, sessions, coverage: cov, course, doneIds };
  }, [id]);
}
