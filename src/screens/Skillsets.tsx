import { BookOpen, FileUp, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useAiState } from "../ai/status";
import { useCourseImport } from "../components/FilePickers";
import { Bar, Empty, PageTitle } from "../components/ui";
import { HeroBg } from "../components/visuals";
import { pct } from "../core/scoring";
import { useSkillsetSummaries } from "../data/hooks";
import { useT } from "../i18n";
import { useNav } from "../nav/store";
import { modeOf, nextTitle, progressLabel } from "./Home";

export function Skillsets() {
  const t = useT();
  const list = useSkillsetSummaries();
  const ai = useAiState();
  const push = useNav((s) => s.push);
  const course = useCourseImport();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const l = list ?? [];
    return q ? l.filter((x) => x.s.name.toLowerCase().includes(q) || x.s.goal.toLowerCase().includes(q)) : l;
  }, [list, query]);

  return (
    <div className="screen with-tabbar">
      <PageTitle
        right={
          (list?.length ?? 0) > 4 ? (
            <button className="round-btn" aria-label={t("common.search")} aria-pressed={searching} onClick={() => setSearching((v) => !v)}>
              <Search size={20} />
            </button>
          ) : undefined
        }
      >
        {t("tab.skillsets")}
      </PageTitle>
      <div className="stack-lg">
        {searching && <input className="input" type="search" autoFocus placeholder={t("skillsets.search")} aria-label={t("skillsets.search")} value={query} onChange={(e) => setQuery(e.target.value)} />}

        <div className="grid-2">
          <button className="action-tile" onClick={() => push({ name: "skillsetEdit" })}>
            <span className="icon-dot accent">
              <Plus size={20} />
            </span>
            <span className="bold">{t("skillsets.new")}</span>
            <span className="small muted">{t("skillsets.newHint")}</span>
          </button>
          <button className="action-tile" onClick={course.open}>
            <span className="icon-dot">
              <FileUp size={20} />
            </span>
            <span className="bold">{t("skillsets.importCourse")}</span>
            <span className="small muted">{t("skillsets.importHint")}</span>
          </button>
        </div>
        {course.input}

        {list && list.length === 0 && <Empty icon={<BookOpen size={34} />} title={t("skillsets.empty.title")} text={t("skillsets.empty.text")} />}

        <div className="stack">
          {shown.map((x) => {
            const mode = modeOf(x, ai);
            return (
              <button key={x.s.id} className="skill-card" onClick={() => push({ name: "skillset", id: x.s.id })}>
                <span className="skill-cover" aria-hidden>
                  <HeroBg hue={x.s.hue} name={x.s.name} />
                  {x.s.courseId ? <BookOpen size={20} /> : <b>{x.s.name[0]?.toUpperCase()}</b>}
                </span>
                <span className="grow">
                  <span className="row-between" style={{ gap: 8 }}>
                    <span className="bold ellipsis">{x.s.name}</span>
                    <span className={`mode-tag ${mode}`}>{t(mode === "course" ? "mode.course" : mode === "ai" ? "mode.ai" : "mode.offline")}</span>
                  </span>
                  <span className="small muted ellipsis block">{nextTitle(x, ai, t)}</span>
                  <span className="block" style={{ margin: "8px 0 4px" }}>
                    <Bar value={x.coverage} thin label={progressLabel(x, t)} />
                  </span>
                  <span className="tiny muted block">
                    {progressLabel(x, t)} · {t("stat.lessonsN", { n: x.s.lessonsDone })} · {t("stat.accuracyShort", { p: pct(x.accuracy) })}
                  </span>
                </span>
              </button>
            );
          })}
          {list && list.length > 0 && shown.length === 0 && <p className="muted center small">{t("skillsets.nothingFound")}</p>}
        </div>
      </div>
    </div>
  );
}
