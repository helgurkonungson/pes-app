/** Live queries shared by several screens. */
import { useLiveQuery } from "dexie-react-hooks";
import { localDay } from "../core/dates";
import { coverage } from "../core/planner";
import type { DayActivity, Profile, Skillset } from "../core/types";
import { db } from "./db";

export interface SkillsetSummary {
  s: Skillset;
  chunks: number;
  sources: number;
  coverage: number;
  accuracy: number | null;
  nextLabel: string;
  hasReady: boolean;
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
  return useLiveQuery(async () => {
    const list = await db.skillsets.orderBy("createdAt").toArray();
    return Promise.all(
      list.map(async (s) => {
        const [chunks, sources, ready] = await Promise.all([
          db.chunks.where("skillsetId").equals(s.id).count(),
          db.sources.where("skillsetId").equals(s.id).count(),
          db.sessions.where("[skillsetId+status]").equals([s.id, "ready"]).count(),
        ]);
        return {
          s,
          chunks,
          sources,
          coverage: coverage(chunks, s.cursor),
          accuracy: s.total ? s.correct / s.total : null,
          nextLabel: s.placement ? `Lesson ${s.lessonsDone + 1} · ${s.minutes} min` : "Placement test",
          hasReady: ready > 0,
        };
      }),
    );
  }, []);
}

export function useSkillset(id: string) {
  return useLiveQuery(async () => {
    const s = await db.skillsets.get(id);
    if (!s) return null;
    const [chunks, sources, sessions] = await Promise.all([
      db.chunks.where("skillsetId").equals(id).count(),
      db.sources.where("skillsetId").equals(id).toArray(),
      db.sessions.where("skillsetId").equals(id).toArray(),
    ]);
    return { s, chunks, sources, sessions, coverage: coverage(chunks, s.cursor) };
  }, [id]);
}
