import { BookOpen, ChevronLeft, Clock, Globe, History as HistoryIcon, Pencil, Play, Target, Trash2 } from "lucide-react";
import { confirmDialog, MenuRow, MinutesPicker, toast, Toggle } from "../components/ui";
import { HeroBg } from "../components/visuals";
import { pct } from "../core/scoring";
import { useSkillset } from "../data/hooks";
import { deleteSkillset, updateSkillset } from "../data/repo";
import { useNav } from "../nav/store";

export function SkillsetDetail({ id }: { id: string }) {
  const data = useSkillset(id);
  const { push, pop } = useNav();
  if (data === undefined) return <div className="screen" />;
  if (data === null)
    return (
      <div className="screen">
        <p className="muted">This skillset no longer exists.</p>
      </div>
    );
  const { s, sources, sessions, coverage } = data;
  const done = sessions.filter((x) => x.status === "done");
  const ready = sessions.find((x) => x.status === "ready" || x.status === "active");
  const level = s.placement ? s.placement.level : "—";
  const acc = s.total ? s.correct / s.total : null;

  const start = () => push({ name: "session", skillsetId: s.id, minutes: s.minutes });

  const remove = async () => {
    if (await confirmDialog(`Delete “${s.name}”?`, { text: "Its sources, lessons and progress will be removed. Your total XP and badges stay.", ok: "Delete", danger: true })) {
      await deleteSkillset(s.id);
      pop();
      toast("Skillset deleted");
    }
  };

  return (
    <div className="screen with-cta">
      <div className="hero">
        <HeroBg hue={s.hue} name={s.name} big />
        <button className="round-btn glass back" aria-label="Back" onClick={pop}>
          <ChevronLeft size={22} />
        </button>
        <button className="round-btn glass menu" aria-label="Edit" onClick={() => push({ name: "skillsetEdit", id: s.id })}>
          <Pencil size={18} />
        </button>
        <h1>{s.name}</h1>
        <div className="row" style={{ gap: 8 }}>
          <span className="pill">
            <Clock size={13} /> {s.minutes} min
          </span>
          <span className="pill">
            <BookOpen size={13} /> {sources.length} source{sources.length === 1 ? "" : "s"}
          </span>
          {ready?.status === "ready" && <span className="pill">Lesson ready</span>}
        </div>
      </div>

      <div className="stack" style={{ marginTop: 6 }}>
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: 6 }}>
            About
          </h2>
          <p className="muted small">{s.goal || "No goal written yet. Tap the pencil to add one — lessons adapt to it."}</p>
          <div className="stat-strip">
            <div>
              <div className="label">Level</div>
              <div className="value">{level}</div>
            </div>
            <div>
              <div className="label">Progress</div>
              <div className="value">{Math.round(coverage * 100)}%</div>
            </div>
            <div>
              <div className="label">Accuracy</div>
              <div className="value">{pct(acc)}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ paddingTop: 6, paddingBottom: 6 }}>
          <MenuRow icon={<BookOpen size={20} className="accent" />} label="Sources" value={sources.length ? `${sources.length}` : "Add"} onClick={() => push({ name: "sources", id: s.id })} />
          <MenuRow icon={<HistoryIcon size={20} className="accent" />} label="Lessons" value={`${done.length}`} onClick={() => push({ name: "history", id: s.id })} />
          <MenuRow
            icon={<Globe size={20} className="accent" />}
            label="Use the internet"
            right={<Toggle on={s.useInternet} onChange={(v) => updateSkillset(s.id, { useInternet: v })} label="Use the internet" />}
          />
        </div>

        <div className="card">
          <h2 className="section-title" style={{ marginBottom: 12 }}>
            Portion size
          </h2>
          <MinutesPicker value={s.minutes} onChange={(m) => updateSkillset(s.id, { minutes: m })} />
        </div>

        {s.placement && (
          <div className="card">
            <div className="row" style={{ marginBottom: 10 }}>
              <Target size={20} className="accent" />
              <h2 className="section-title">Starting point</h2>
            </div>
            <p className="small muted">
              Placement test: {s.placement.score}/{s.placement.total} · <span style={{ textTransform: "capitalize" }}>{s.placement.level}</span>
            </p>
            {s.placement.strengths.length > 0 && <p className="small" style={{ marginTop: 8 }}>Strong: {s.placement.strengths.join(", ")}</p>}
            {s.placement.gaps.length > 0 && <p className="small" style={{ marginTop: 4 }}>To work on: {s.placement.gaps.join(", ")}</p>}
          </div>
        )}

        <button className="btn danger block" onClick={remove} style={{ marginTop: 8 }}>
          <Trash2 size={18} /> Delete skillset
        </button>
      </div>

      <div className="cta-bar">
        <button className="btn primary" onClick={start}>
          <Play size={20} fill="currentColor" />
          {ready?.status === "active" ? "Continue session" : s.placement ? `Start lesson · ${s.minutes} min` : "Start placement test"}
        </button>
      </div>
    </div>
  );
}
