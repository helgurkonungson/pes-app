import { BookOpen, Check, ChevronLeft, CircleDot, Clock, CloudOff, Globe, History as HistoryIcon, Lock, Pencil, Play, RotateCcw, Target } from "lucide-react";
import { useState } from "react";
import { useAiState } from "../ai/status";
import { Group, MenuRow, MinutesPicker, SectionLabel, Sheet, toast, Toggle } from "../components/ui";
import { HeroBg } from "../components/visuals";
import { courseModules } from "../core/course";
import { pct } from "../core/scoring";
import { useSkillset } from "../data/hooks";
import { updateSkillset } from "../data/repo";
import { restartReading } from "../data/sessionService";
import { useT } from "../i18n";
import { useNav } from "../nav/store";

export function SkillsetDetail({ id }: { id: string }) {
  const t = useT();
  const data = useSkillset(id);
  const ai = useAiState();
  const { push, pop } = useNav();
  const [sheet, setSheet] = useState<null | "portion">(null);
  if (data === undefined) return <div className="screen" />;
  if (data === null)
    return (
      <div className="screen">
        <p className="muted">{t("skillset.gone")}</p>
      </div>
    );
  const { s, sources, sessions, coverage, course, doneIds } = data;
  const done = sessions.filter((x) => x.status === "done");
  const open = sessions.find((x) => x.status === "active") ?? sessions.find((x) => x.status === "ready");
  const acc = s.total ? s.correct / s.total : null;
  const isCourse = !!course;
  const courseDone = course ? course.lessons.every((l) => doneIds.has(l.id)) : false;
  const readAll = !isCourse && data.chunks > 0 && s.cursor >= data.chunks;
  const mode = isCourse ? "course" : ai === "ok" ? "ai" : "offline";
  const needsPlacement = !isCourse && !s.placement && !s.placementSkipped;
  const minutes = isCourse ? (course?.minutes ?? s.minutes) : s.minutes;
  const nextLesson = course?.lessons.find((l) => !doneIds.has(l.id));

  const start = (offline?: boolean) => push({ name: "session", skillsetId: s.id, minutes, offline });

  const ctaLabel = open?.status === "active" ? t("skillset.resume") : needsPlacement && ai === "ok" ? t("skillset.startPlacement") : t("skillset.start", { n: minutes });

  return (
    <div className="screen with-cta">
      <div className="hero">
        <HeroBg hue={s.hue} name={s.name} big />
        <button className="round-btn glass back" aria-label={t("common.back")} onClick={pop}>
          <ChevronLeft size={22} />
        </button>
        <button className="round-btn glass menu" aria-label={t("skillset.edit")} onClick={() => push({ name: "skillsetEdit", id: s.id })}>
          <Pencil size={18} />
        </button>
        <h1>{s.name}</h1>
        <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
          <span className="pill">{t(mode === "course" ? "mode.course" : mode === "ai" ? "mode.ai" : "mode.offline")}</span>
          <span className="pill">
            <Clock size={13} /> {t("portion.min", { n: minutes })}
          </span>
          {isCourse ? (
            <span className="pill">
              <BookOpen size={13} /> {t("stat.lessonsN", { n: course!.lessons.length })}
            </span>
          ) : (
            <span className="pill">
              <BookOpen size={13} /> {t("stat.sourcesN", { n: sources.length })}
            </span>
          )}
        </div>
      </div>

      <div className="stack-lg" style={{ marginTop: 12 }}>
        {s.goal && <p className="muted small selectable">{s.goal}</p>}

        <div className="stat-cards">
          <div>
            <div className="label">{t("stat.progress")}</div>
            <div className="value">{Math.round(coverage * 100)}%</div>
          </div>
          <div>
            <div className="label">{t("stat.lessons")}</div>
            <div className="value">{done.filter((x) => x.kind === "lesson").length}</div>
          </div>
          <div>
            <div className="label">{t("stat.accuracy")}</div>
            <div className="value">{pct(acc)}</div>
          </div>
        </div>

        {isCourse && course && (
          <section className="stack">
            <SectionLabel>{t("skillset.syllabus")}</SectionLabel>
            {courseModules(course).map((m, mi) => (
              <div key={mi} className="group">
                {m.module && <p className="group-title">{m.module}</p>}
                {m.lessons.map((l) => {
                  const isDone = doneIds.has(l.id);
                  const isNext = l.id === nextLesson?.id;
                  const session = isDone ? done.find((x) => x.lesson?.courseLessonId === l.id) : undefined;
                  return (
                    <button
                      key={l.id}
                      className={`syllabus-row${isNext ? " next" : ""}${!isDone && !isNext ? " later" : ""}`}
                      disabled={!isDone && !isNext}
                      onClick={() => (session ? push({ name: "lesson", sessionId: session.id }) : isNext ? start() : undefined)}
                    >
                      <span className={`status${isDone ? " done" : ""}`} aria-hidden>
                        {isDone ? <Check size={14} strokeWidth={3} /> : isNext ? <CircleDot size={16} /> : <Lock size={13} />}
                      </span>
                      <span className="grow">
                        <span className="block">{l.title}</span>
                        <span className="tiny muted">{isDone ? t("skillset.lessonDone") : isNext ? t("skillset.lessonNext") : t("skillset.lessonLater")}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </section>
        )}

        {!isCourse && (
          <Group>
            <MenuRow icon={<BookOpen size={20} />} label={t("skillset.sources")} value={sources.length ? String(sources.length) : t("common.add")} onClick={() => push({ name: "sources", id: s.id })} />
            <MenuRow icon={<HistoryIcon size={20} />} label={t("skillset.history")} value={String(done.length)} onClick={() => push({ name: "history", id: s.id })} />
            <MenuRow icon={<Clock size={20} />} label={t("skillset.portion")} value={t("portion.min", { n: s.minutes })} onClick={() => setSheet("portion")} />
            <MenuRow
              icon={<Globe size={20} />}
              label={t("skillset.internet")}
              hint={t("skillset.internetHint")}
              right={<Toggle on={s.useInternet} onChange={(v) => updateSkillset(s.id, { useInternet: v })} label={t("skillset.internet")} />}
            />
          </Group>
        )}
        {isCourse && done.length > 0 && (
          <Group>
            <MenuRow icon={<HistoryIcon size={20} />} label={t("skillset.history")} value={String(done.length)} onClick={() => push({ name: "history", id: s.id })} />
          </Group>
        )}

        {!isCourse && (
          <Group>
            {needsPlacement && (
              <MenuRow
                icon={<Target size={20} />}
                label={t("skillset.placement")}
                hint={ai === "ok" ? t("skillset.placementHint") : t("skillset.placementNeedsAi")}
                value={t("skillset.skip")}
                onClick={async () => {
                  await updateSkillset(s.id, { placementSkipped: true });
                  toast(t("skillset.placementSkipped"));
                }}
              />
            )}
            {s.placement && (
              <MenuRow
                icon={<Target size={20} />}
                label={t("skillset.startingPoint")}
                hint={[
                  `${s.placement.score}/${s.placement.total} · ${t(`level.${s.placement.level}` as "level.beginner")}`,
                  s.placement.gaps.length ? t("skillset.toWorkOn", { list: s.placement.gaps.join(", ") }) : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
            )}
            {ai === "ok" && !readAll && sources.length > 0 && <MenuRow icon={<CloudOff size={20} />} label={t("skillset.offlineLesson")} hint={t("skillset.offlineLessonHint")} onClick={() => start(true)} />}
            {readAll && (
              <MenuRow
                icon={<RotateCcw size={20} />}
                label={t("skillset.restart")}
                hint={t("skillset.restartHint")}
                onClick={async () => {
                  await restartReading(s.id);
                  toast(t("skillset.restarted"));
                }}
              />
            )}
          </Group>
        )}
        {!isCourse && sources.length === 0 && ai !== "ok" && <p className="faint small center">{t("skillset.needSources")}</p>}
      </div>

      {!courseDone && (
        <div className="cta-bar">
          <button className="btn primary" onClick={() => start()} disabled={!isCourse && sources.length === 0 && ai !== "ok"}>
            <Play size={20} fill="currentColor" />
            {ctaLabel}
          </button>
        </div>
      )}

      {sheet === "portion" && (
        <Sheet title={t("skillset.portion")} onClose={() => setSheet(null)}>
          <div className="stack-lg">
            <MinutesPicker value={s.minutes} onChange={(m) => updateSkillset(s.id, { minutes: m })} />
            <p className="faint small">{t("skillset.portionHint")}</p>
            <button className="btn primary block" onClick={() => setSheet(null)}>
              {t("common.done")}
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

