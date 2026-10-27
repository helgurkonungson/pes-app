/**
 * The five free starter courses (ADR-031): cards for the tutorial's last step and the
 * Skillsets screen, and opening one — installed on first tap, straight into lesson 1.
 */
import { useLiveQuery } from "dexie-react-hooks";
import { Brain, Check, ChevronRight, Lightbulb, Sparkles, Table, Wallet } from "lucide-react";
import { useState } from "react";
import { BUILTIN_COURSES, type BuiltinCourse, builtinCourseId } from "../courses";
import { installBuiltinCourse } from "../data/builtinCourses";
import { db } from "../data/db";
import { writeSnapshot } from "../data/safety";
import { type Key, useLang, useT } from "../i18n";
import { useNav } from "../nav/store";
import { toast } from "./ui";

const ICONS = { brain: Brain, sparkles: Sparkles, table: Table, wallet: Wallet, lightbulb: Lightbulb };

export function CourseIcon({ c, size = 22 }: { c: BuiltinCourse; size?: number }) {
  const I = ICONS[c.icon];
  return (
    <span className="course-icon" style={{ "--hue": c.hue } as React.CSSProperties} aria-hidden>
      <I size={size} />
    </span>
  );
}

/** Opens a built-in course in the interface language: adds it if needed, then starts the next lesson. */
export function useOpenBuiltin(): { open: (slug: string) => Promise<boolean>; busy: string | null } {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const nav = useNav();
  const [busy, setBusy] = useState<string | null>(null);
  const open = async (slug: string) => {
    if (busy) return false;
    setBusy(slug);
    try {
      const { skillset, fresh } = await installBuiltinCourse(slug, lang);
      if (fresh) {
        toast(t("course.added", { title: skillset.name, n: 8 }));
        writeSnapshot();
      }
      nav.setTab("skillsets");
      nav.push({ name: "skillset", id: skillset.id });
      nav.push({ name: "session", skillsetId: skillset.id, minutes: skillset.minutes });
      return true;
    } catch {
      toast(t("courses.err"));
      return false;
    } finally {
      setBusy(null);
    }
  };
  return { open, busy };
}

/** Course ids already in the app (to mark the cards "Added"). */
function useAddedCourseIds(): Set<string> {
  return useLiveQuery(async () => new Set((await db.skillsets.toArray()).map((s) => s.courseId).filter((x): x is string => !!x)), [], new Set<string>());
}

export function BuiltinCourseList({ onPick, busy, compact }: { onPick: (slug: string) => void; busy?: string | null; compact?: boolean }) {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const added = useAddedCourseIds();
  return (
    <div className={`stack course-list${compact ? " compact" : ""}`}>
      {BUILTIN_COURSES.map((c) => {
        const has = added.has(builtinCourseId(c.slug, lang));
        return (
          <button key={c.slug} className="list-card inner course-card" disabled={!!busy} aria-busy={busy === c.slug} onClick={() => onPick(c.slug)} data-course={c.slug}>
            <CourseIcon c={c} />
            <span className="grow" style={{ textAlign: "left", minWidth: 0 }}>
              <span className="bold block">{t(`courses.${c.slug}.title` as Key)}</span>
              <span className="small muted block">{t(`courses.${c.slug}.hint` as Key)}</span>
              {!compact && (
                <span className="tiny muted block">
                  {t("stat.lessonsN", { n: 8 })}
                  {has && (
                    <>
                      {" · "}
                      <Check size={12} aria-hidden /> {t("courses.added")}
                    </>
                  )}
                </span>
              )}
            </span>
            <ChevronRight size={20} className="muted" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
