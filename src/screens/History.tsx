import { useLiveQuery } from "dexie-react-hooks";
import { BookOpen, Target } from "lucide-react";
import { Chevron, Empty, TopBar } from "../components/ui";
import { Markdown } from "../components/visuals";
import { localDay, relativeDay } from "../core/dates";
import { db } from "../data/db";
import { useNav } from "../nav/store";

export function History({ id }: { id: string }) {
  const sessions = useLiveQuery(
    () => db.sessions.where("[skillsetId+status]").equals([id, "done"]).toArray().then((l) => l.sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? ""))),
    [id],
  );
  const push = useNav((s) => s.push);
  return (
    <div className="screen">
      <TopBar title="Lessons" />
      {sessions && sessions.length === 0 && <Empty icon={<BookOpen size={34} />} title="No lessons yet" text="Finished sessions appear here so you can reread them." />}
      <div className="stack">
        {sessions?.map((s) => (
          <button key={s.id} className="list-card" onClick={() => s.lesson && push({ name: "lesson", sessionId: s.id })} disabled={!s.lesson}>
            <div className="icon-dot">{s.kind === "placement" ? <Target size={20} /> : <BookOpen size={20} />}</div>
            <div className="grow">
              <div className="bold ellipsis">{s.kind === "placement" ? "Placement test" : s.lesson?.title}</div>
              <div className="small muted">
                {s.finishedAt ? relativeDay(localDay(new Date(s.finishedAt))) : ""} · {s.minutes} min · {s.result ? `${s.result.correct}/${s.result.total} correct · +${s.result.xp} XP` : ""}
              </div>
            </div>
            {s.lesson && <Chevron />}
          </button>
        ))}
      </div>
    </div>
  );
}

export function LessonView({ sessionId }: { sessionId: string }) {
  const s = useLiveQuery(() => db.sessions.get(sessionId), [sessionId]);
  const l = s?.lesson;
  return (
    <div className="screen">
      <TopBar title="Lesson" />
      {l && (
        <div className="stack-lg">
          <h1 className="display" style={{ fontSize: 26 }}>
            {l.title}
          </h1>
          {l.theory.sections.map((sec, i) => (
            <div key={i} className="card">
              <h2 className="section-title" style={{ marginBottom: 10 }}>
                {sec.heading}
              </h2>
              <Markdown text={sec.body} />
            </div>
          ))}
          <div className="keypoints">
            <h3>Key points</h3>
            <ul>
              {l.theory.keyPoints.map((k, i) => (
                <li key={i}>{k}</li>
              ))}
            </ul>
          </div>
          {s?.progress.grade && (
            <div className="card">
              <p className="small muted">Your open answer · {s.progress.grade.score}/10</p>
              <p style={{ marginTop: 6 }} className="selectable">
                {s.progress.openAnswer}
              </p>
              <div className="divider" />
              <p className="small bold accent">Model answer</p>
              <Markdown text={s.progress.grade.modelAnswer} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
