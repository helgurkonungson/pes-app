import { useLiveQuery } from "dexie-react-hooks";
import { BookOpen, CloudOff, Target } from "lucide-react";
import { Chevron, Empty, TopBar } from "../components/ui";
import { Markdown } from "../components/visuals";
import { daysBetween, localDay, shortDate } from "../core/dates";
import { db } from "../data/db";
import { locale, type T, useT } from "../i18n";
import { useNav } from "../nav/store";

export function relativeDay(day: string, t: T, today: string = localDay()): string {
  const diff = daysBetween(day, today);
  if (diff === 0) return t("date.today");
  if (diff === 1) return t("date.yesterday");
  if (diff < 7) return t("date.daysAgo", { n: diff });
  return shortDate(day, locale());
}

export function History({ id }: { id: string }) {
  const t = useT();
  const sessions = useLiveQuery(
    () => db.sessions.where("[skillsetId+status]").equals([id, "done"]).toArray().then((l) => l.sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? ""))),
    [id],
  );
  const push = useNav((s) => s.push);
  return (
    <div className="screen">
      <TopBar title={t("history.title")} />
      {sessions && sessions.length === 0 && <Empty icon={<BookOpen size={34} />} title={t("history.empty.title")} text={t("history.empty.text")} />}
      <div className="stack">
        {sessions?.map((s) => (
          <button key={s.id} className="list-card" onClick={() => s.lesson && push({ name: "lesson", sessionId: s.id })} disabled={!s.lesson}>
            <span className="icon-dot">{s.kind === "placement" ? <Target size={20} /> : s.lesson?.mode === "offline" ? <CloudOff size={20} /> : <BookOpen size={20} />}</span>
            <span className="grow">
              <span className="bold ellipsis block">{s.kind === "placement" ? t("step.placement") : s.lesson?.title}</span>
              <span className="small muted block">
                {[
                  s.finishedAt ? relativeDay(localDay(new Date(s.finishedAt)), t) : "",
                  t("portion.min", { n: s.minutes }),
                  s.result && s.result.total ? t("history.correct", { c: s.result.correct, n: s.result.total }) : "",
                  s.result ? `+${s.result.xp} XP` : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            {s.lesson && <Chevron />}
          </button>
        ))}
      </div>
    </div>
  );
}

export function LessonView({ sessionId }: { sessionId: string }) {
  const t = useT();
  const s = useLiveQuery(() => db.sessions.get(sessionId), [sessionId]);
  const l = s?.lesson;
  return (
    <div className="screen">
      <TopBar title={t("history.lesson")} />
      {l && (
        <article className="stack-lg">
          <h1 className="display" style={{ fontSize: 26 }}>
            {l.title}
          </h1>
          {l.theory.sections.map((sec, i) => (
            <section key={i} className="card">
              <h2 className="section-title" style={{ marginBottom: 10 }}>
                {sec.heading}
              </h2>
              <Markdown text={sec.body} />
            </section>
          ))}
          {l.theory.keyPoints.length > 0 && (
            <div className="keypoints">
              <h3>{t(l.mode === "offline" ? "session.keySentences" : "session.keyPoints")}</h3>
              <ul>
                {l.theory.keyPoints.map((k, i) => (
                  <li key={i}>{k}</li>
                ))}
              </ul>
            </div>
          )}
          {s?.progress.grade && (
            <section className="card">
              <p className="small muted">{t("history.yourAnswer", { score: s.progress.grade.score })}</p>
              <p className="small bold" style={{ marginTop: 8 }}>
                {l.open.q}
              </p>
              {s.progress.openAnswer && (
                <p style={{ marginTop: 6 }} className="selectable">
                  {s.progress.openAnswer}
                </p>
              )}
              {s.progress.grade.modelAnswer && (
                <>
                  <div className="divider" />
                  <p className="small bold accent">{t("open.modelAnswer")}</p>
                  <Markdown text={s.progress.grade.modelAnswer} />
                </>
              )}
            </section>
          )}
        </article>
      )}
    </div>
  );
}
