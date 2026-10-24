import { useLiveQuery } from "dexie-react-hooks";
import { BuildProgress } from "../components/BuildProgress";
import { BookOpen, CloudOff, Download, FileUp, Flame, KeyRound, Play, Plus, Sparkles } from "lucide-react";
import { useUpdate } from "../app/App";
import { useAiState } from "../ai/status";
import { useCourseImport } from "../components/FilePickers";
import { Bar, Chevron, SectionLabel } from "../components/ui";
import { HeroBg } from "../components/visuals";
import type { AiState } from "../core/aiStatus";
import { lastNDays, localDay, longDate, parseDay, weekdayLetter } from "../core/dates";
import { pct } from "../core/scoring";
import { liveStreak } from "../core/streak";
import { db } from "../data/db";
import { pickCurrent, type SkillsetSummary, useProfile, useSkillsetSummaries, useToday } from "../data/hooks";
import { locale, type T, useT } from "../i18n";
import { useNav } from "../nav/store";
import { installUpdateSafely } from "../update/updater";

export function modeOf(x: SkillsetSummary, ai: AiState | undefined): "course" | "ai" | "offline" {
  if (x.s.courseId) return "course";
  if (x.open?.lesson?.mode === "offline") return "offline";
  if (x.open?.lesson?.mode === "ai" || x.open?.placement) return "ai";
  return ai === "ok" ? "ai" : "offline";
}

export function nextTitle(x: SkillsetSummary, ai: AiState | undefined, t: T): string {
  if (x.course) return x.course.finished ? t("next.courseDone") : (x.course.nextTitle ?? "");
  if (x.open?.placement) return t("next.placement");
  if (x.open?.lesson) return x.open.lesson.title;
  if (!x.s.placement && !x.s.placementSkipped && ai === "ok") return t("next.placement");
  return t("next.lessonN", { n: x.s.lessonsDone + 1 });
}

export function progressLabel(x: SkillsetSummary, t: T): string {
  if (x.course) return t("progress.lessonsOf", { done: x.course.done, total: x.course.total });
  if (!x.chunks) return t("progress.noSources");
  return t("progress.read", { p: Math.round(x.coverage * 100) });
}

function AiBanner({ state }: { state: AiState }) {
  const t = useT();
  const setTab = useNav((s) => s.setTab);
  if (state === "ok" || state === "off") return null;
  const text = state === "credits" ? t("home.ai.credits") : state === "auth" ? t("home.ai.auth") : t("home.ai.noKey");
  return (
    <button className={`banner${state === "no-key" ? "" : " warn"}`} onClick={() => setTab("settings")}>
      <span className="icon-dot">{state === "no-key" ? <KeyRound size={20} /> : <CloudOff size={20} />}</span>
      <span className="grow small">{text}</span>
      <Chevron />
    </button>
  );
}

function NextUp({ x, ai }: { x: SkillsetSummary; ai: AiState | undefined }) {
  const t = useT();
  const push = useNav((s) => s.push);
  const mode = modeOf(x, ai);
  const finished = !!x.course?.finished;
  const minutes = x.open?.minutes ?? x.s.minutes;
  const resume = x.open?.status === "active";
  return (
    <section className="next-card" aria-label={t("home.nextUp")}>
      <HeroBg hue={x.s.hue} name={x.s.name} big />
      <div className="next-inner">
        <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
          <span className="pill">{t(`mode.${mode}`)}</span>
          {!finished && <span className="pill">{t("portion.min", { n: minutes })}</span>}
        </div>
        <button className="next-skill" onClick={() => push({ name: "skillset", id: x.s.id })}>
          {x.s.name} <Chevron />
        </button>
        <h2 className="next-title">{nextTitle(x, ai, t)}</h2>
        {x.open?.lesson?.building && <BuildProgress building={x.open.lesson.building} compact />}
        <div className="next-progress">
          <Bar value={x.coverage} thin label={progressLabel(x, t)} />
          <span>{progressLabel(x, t)}</span>
        </div>
        {!finished && (
          <button className="btn primary block" onClick={() => push({ name: "session", skillsetId: x.s.id, minutes })}>
            <Play size={20} fill="currentColor" /> {resume ? t("home.resume") : t("home.start")}
          </button>
        )}
        {finished && (
          <button className="btn dark block" onClick={() => push({ name: "skillset", id: x.s.id })}>
            {t("home.openSkillset")}
          </button>
        )}
      </div>
    </section>
  );
}

function Today() {
  const t = useT();
  const profile = useProfile();
  const today = useToday();
  const days = lastNDays(7);
  const activity = useLiveQuery(() => db.activity.where("day").between(days[0], days[6], true, true).toArray(), [days[0]]) ?? [];
  const active = new Set(activity.filter((a) => a.sessions > 0).map((a) => a.day));
  if (!profile) return null;
  const goal = profile.dailyGoal || 15;
  const ratio = today.minutes / goal;
  const left = Math.max(0, goal - today.minutes);
  const acc = today.total ? today.correct / today.total : null;
  return (
    <section className="card" aria-label={t("home.today")}>
      <div className="row-between" style={{ marginBottom: 10 }}>
        <h2 className="card-h">{t("home.today")}</h2>
        <span className={`small ${left === 0 ? "accent bold" : "muted"}`}>{left === 0 ? t("home.goalDone") : t("home.minLeft", { n: left })}</span>
      </div>
      <div className="today-grid">
        <div>
          <div className="big-number">
            {today.minutes}
            <small>/ {t("portion.min", { n: goal })}</small>
          </div>
        </div>
        <div>
          <div className="k">{t("stat.xp")}</div>
          <div className="v">{today.xp}</div>
        </div>
        <div>
          <div className="k">{t("stat.accuracy")}</div>
          <div className="v">{pct(acc)}</div>
        </div>
      </div>
      <Bar value={ratio} label={t("home.today")} />
      <div className="mini-week" aria-label={t("home.last7")}>
        {days.map((d) => (
          <div key={d} className={`${active.has(d) ? "on" : ""}${d === localDay() ? " today" : ""}`}>
            <i />
            <span>{weekdayLetter((parseDay(d).getDay() + 6) % 7, locale())}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Home() {
  const t = useT();
  const profile = useProfile();
  const list = useSkillsetSummaries();
  const ai = useAiState();
  const { push } = useNav();
  const setTab = useNav((s) => s.setTab);
  const update = useUpdate((s) => s.info);
  const course = useCourseImport();
  if (!profile || !list) return <div className="screen with-tabbar" />;

  const streak = liveStreak(profile.streak, localDay());
  const firstName = profile.name.split(" ")[0] || "";
  const current = pickCurrent(list);
  const others = list.filter((x) => x !== current);
  const needsAiNote = list.some((x) => !x.s.courseId);

  return (
    <div className="screen with-tabbar">
      <div className="stack-lg">
        <header className="home-head">
          <div className="grow">
            <p className="muted small">{longDate(localDay(), locale())}</p>
            <h1>{firstName ? t("home.hello", { name: firstName }) : t("home.helloAnon")}</h1>
          </div>
          <button className={`streak-chip${streak ? " on" : ""}`} onClick={() => setTab("progress")} aria-label={t("home.streakAria", { n: streak })}>
            <Flame size={18} /> {streak}
          </button>
        </header>

        {update && (
          <button className="banner" onClick={() => installUpdateSafely(update)}>
            <span className="icon-dot accent">
              <Download size={20} />
            </span>
            <span className="grow">
              <b>{t("update.ready", { v: update.version })}</b>
              <span className="muted small block">{t("update.tap")}</span>
            </span>
          </button>
        )}

        {ai && needsAiNote && <AiBanner state={ai} />}

        {current ? (
          <NextUp x={current} ai={ai} />
        ) : (
          <section className="card stack-lg center-col">
            <div className="empty-art">
              <Sparkles size={34} />
            </div>
            <h2 className="section-title">{t("home.empty.title")}</h2>
            <p className="muted small">{t("home.empty.text")}</p>
            <button className="btn primary block" onClick={() => push({ name: "skillsetEdit" })}>
              <Plus size={20} /> {t("skillsets.new")}
            </button>
            <button className="btn dark block" onClick={course.open}>
              <FileUp size={20} /> {t("skillsets.importCourse")}
            </button>
            {course.input}
          </section>
        )}

        <Today />

        {others.length > 0 && (
          <section className="stack">
            <SectionLabel>{t("home.others")}</SectionLabel>
            {others.map((x) => (
              <div key={x.s.id} className="list-card">
                <button className="row grow" style={{ gap: 14, textAlign: "left" }} onClick={() => push({ name: "skillset", id: x.s.id })}>
                  <span className="mono" aria-hidden>
                    <HeroBg hue={x.s.hue} name={x.s.name} />
                    {x.s.courseId ? <BookOpen size={18} /> : <b>{x.s.name[0]?.toUpperCase()}</b>}
                  </span>
                  <span className="grow">
                    <span className="bold ellipsis block">{x.s.name}</span>
                    <span className="small muted ellipsis block">{nextTitle(x, ai, t)}</span>
                    <span className="block" style={{ marginTop: 6 }}>
                      <Bar value={x.coverage} thin label={progressLabel(x, t)} />
                    </span>
                  </span>
                </button>
                {!x.course?.finished && (
                  <button className="round-btn accent" aria-label={t("home.startIn", { name: x.s.name })} onClick={() => push({ name: "session", skillsetId: x.s.id, minutes: x.open?.minutes ?? x.s.minutes })}>
                    <Play size={18} fill="currentColor" />
                  </button>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
