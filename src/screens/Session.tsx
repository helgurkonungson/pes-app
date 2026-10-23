import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { ArrowLeft, ArrowRight, Check, CloudOff, ExternalLink, Flame, Lightbulb, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AiError } from "../ai/client";
import { reportAiError, reportAiOk, useAiState } from "../ai/status";
import { gradeAnswer } from "../ai/tutor";
import { confirmDialog, ExtLink } from "../components/ui";
import { BadgeIcon, Markdown, Rings, ScoreRing } from "../components/visuals";
import type { AiErrorKind } from "../core/aiStatus";
import { badgeById } from "../core/badges";
import { canAdvance, lessonPages, type Page, placementPages, type StepKey, stepsOf } from "../core/flow";
import { nowIso } from "../core/ids";
import { OfflineError } from "../core/offline";
import { rankFor } from "../core/scoring";
import type { OpenGrade, Session, SessionProgress, SessionResult } from "../core/types";
import { db, getProfile } from "../data/db";
import { completeSession, saveSession } from "../data/repo";
import { writeSnapshot } from "../data/safety";
import { CourseFinishedError, prefetchNext, prepareSession, restartReading } from "../data/sessionService";
import { type Key, type T, useT } from "../i18n";
import { useNav } from "../nav/store";

type Phase = "loading" | "error" | "countdown" | "run" | "finishing" | "done";

const haptic = (kind: "ok" | "bad" | "tap") => {
  if (!Capacitor.isNativePlatform()) return;
  if (kind === "tap") Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
  else Haptics.notification({ type: kind === "ok" ? NotificationType.Success : NotificationType.Error }).catch(() => undefined);
};

const STEP: Record<StepKey, Key> = { review: "step.review", theory: "step.theory", quiz: "step.quiz", open: "step.open", placement: "step.placement" };

const AI_ERR: Record<AiErrorKind, Key> = {
  "no-key": "aiErr.noKey",
  auth: "aiErr.auth",
  credits: "aiErr.credits",
  rate: "aiErr.rate",
  overloaded: "aiErr.overloaded",
  network: "aiErr.network",
  "bad-response": "aiErr.badResponse",
  api: "aiErr.api",
  aborted: "aiErr.aborted",
};

export function aiErrorText(e: unknown, t: T): string {
  if (e instanceof AiError) return t(AI_ERR[e.kind] ?? "aiErr.api") + (e.kind === "api" ? ` (${e.status ?? ""})` : "");
  if (e instanceof OfflineError) return t(e.code === "no-sources" ? "offline.err.noSources" : "offline.err.finished");
  if (e instanceof CourseFinishedError) return t("course.finished");
  return e instanceof Error ? e.message : String(e);
}

export function SessionScreen({ skillsetId, minutes, offline }: { skillsetId: string; minutes: number; offline?: boolean }) {
  const t = useT();
  const { pop, push, setTab } = useNav();
  const [phase, setPhase] = useState<Phase>("loading");
  const [stage, setStage] = useState<Key>("session.preparing");
  const [error, setError] = useState<unknown>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [progress, setProgress] = useState<SessionProgress>({ page: 0, mcq: {}, seconds: 0 });
  const [result, setResult] = useState<SessionResult | null>(null);
  const [count, setCount] = useState(3);
  const [attempt, setAttempt] = useState(0);
  const [forceOffline, setForceOffline] = useState(!!offline);
  const abortRef = useRef<AbortController | null>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  // ---- load / generate ----
  useEffect(() => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setPhase("loading");
    setError(null);
    prepareSession(skillsetId, minutes, {
      offline: forceOffline,
      signal: ctrl.signal,
      onProgress: (s) => setStage(s === "research" ? "session.researching" : s === "grading" ? "session.grading" : "session.writing"),
    })
      .then((s) => {
        if (ctrl.signal.aborted) return;
        setSession(s);
        setProgress(s.progress);
        setPhase(s.status === "active" ? "run" : "countdown");
      })
      .catch((e) => {
        if (ctrl.signal.aborted) return;
        setError(e);
        setPhase("error");
      });
    return () => ctrl.abort();
  }, [skillsetId, minutes, attempt, forceOffline]);

  // ---- countdown ----
  useEffect(() => {
    if (phase !== "countdown") return;
    if (count <= 0) {
      if (session) {
        const s = { ...session, status: "active" as const, startedAt: session.startedAt ?? nowIso() };
        setSession(s);
        saveSession(s);
      }
      setPhase("run");
      return;
    }
    const tm = setTimeout(() => setCount((c) => c - 1), 700);
    return () => clearTimeout(tm);
  }, [phase, count, session]);

  // ---- persist progress ----
  const persist = useCallback(
    (p: SessionProgress) => {
      if (!session) return;
      db.sessions.update(session.id, { progress: p, status: "active" }).catch(() => undefined);
    },
    [session],
  );

  const updateProgress = useCallback(
    (patch: Partial<SessionProgress>) => {
      setProgress((prev) => {
        const next = { ...prev, ...patch };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  // ---- active-time counter ----
  useEffect(() => {
    if (phase !== "run") return;
    const tm = setInterval(() => {
      if (document.visibilityState === "visible") setProgress((p) => ({ ...p, seconds: p.seconds + 1 }));
    }, 1000);
    const save = setInterval(() => persist(progressRef.current), 10_000);
    return () => {
      clearInterval(tm);
      clearInterval(save);
      persist(progressRef.current);
    };
  }, [phase, persist]);

  // ---- hardware back ----
  useEffect(() => {
    const onBack = async () => {
      if (phase === "run") {
        if (await confirmDialog(t("session.leave"), { text: t("session.leaveText"), ok: t("session.leaveOk") })) pop();
      } else {
        abortRef.current?.abort();
        pop();
      }
    };
    window.addEventListener("pes:session-back", onBack);
    return () => window.removeEventListener("pes:session-back", onBack);
  }, [phase, pop, t]);

  const pages: Page[] = useMemo(() => {
    if (!session) return [];
    return session.kind === "placement" && session.placement ? placementPages(session.placement) : session.lesson ? lessonPages(session.lesson) : [];
  }, [session]);

  const finish = async () => {
    if (!session) return;
    setPhase("finishing");
    persist(progressRef.current);
    await db.sessions.update(session.id, { progress: progressRef.current });
    const r = await completeSession(session.id);
    setResult(r);
    setPhase("done");
    haptic("ok");
    writeSnapshot();
    const sk = await db.skillsets.get(session.skillsetId);
    if (sk) prefetchNext(sk.id, sk.minutes);
  };

  const close = () => window.dispatchEvent(new CustomEvent("pes:session-back"));

  // ---------- views ----------

  if (phase === "loading" || phase === "error") {
    const kind = error instanceof AiError ? error.kind : undefined;
    const canOffline = phase === "error" && !forceOffline && !(error instanceof OfflineError) && !(error instanceof CourseFinishedError) && kind !== "aborted";
    return (
      <div className="session">
        <div className="session-top">
          <button className="round-btn" aria-label={t("common.close")} onClick={close}>
            <X size={20} />
          </button>
        </div>
        <div className="preparing">
          {phase === "loading" ? (
            <>
              <div className="spin">
                <Rings values={[0.72, 0.5, 0.3]} size={150} stroke={14} />
              </div>
              <h2 className="section-title" role="status">
                {t(stage)}
              </h2>
              <p className="muted small" style={{ maxWidth: 300 }}>
                {forceOffline ? t("session.offlineFast") : t("session.slowHint")}
              </p>
            </>
          ) : (
            <>
              <div className="err-art">
                {error instanceof CourseFinishedError ? <Check size={36} /> : <CloudOff size={36} />}
              </div>
              <h2 className="section-title">{error instanceof CourseFinishedError ? t("course.finishedTitle") : t("session.cantPrepare")}</h2>
              <p className="muted small" style={{ maxWidth: 320 }} role="alert">
                {aiErrorText(error, t)}
              </p>
              <div className="stack" style={{ width: "100%", maxWidth: 340 }}>
                {canOffline && (
                  <button className="btn primary block" onClick={() => setForceOffline(true)}>
                    <CloudOff size={18} /> {t("session.studyOffline")}
                  </button>
                )}
                {error instanceof OfflineError && error.code === "finished" && (
                  <button
                    className="btn primary block"
                    onClick={async () => {
                      await restartReading(skillsetId);
                      setAttempt((a) => a + 1);
                    }}
                  >
                    {t("skillset.restart")}
                  </button>
                )}
                {error instanceof OfflineError && error.code === "no-sources" && (
                  <button className="btn primary block" onClick={() => push({ name: "sources", id: skillsetId })}>
                    {t("session.addSources")}
                  </button>
                )}
                {(kind === "network" || kind === "overloaded" || kind === "rate" || kind === "bad-response" || kind === "api" || !kind) && !(error instanceof OfflineError) && !(error instanceof CourseFinishedError) && (
                  <button className={`btn ${canOffline ? "dark" : "primary"} block`} onClick={() => setAttempt((a) => a + 1)}>
                    {t("common.retry")}
                  </button>
                )}
                {(kind === "auth" || kind === "no-key") && (
                  <button
                    className="btn dark block"
                    onClick={() => {
                      useNav.getState().reset();
                      setTab("settings");
                    }}
                  >
                    {t("session.openSettings")}
                  </button>
                )}
                {error instanceof CourseFinishedError && (
                  <button className="btn primary block" onClick={pop}>
                    {t("common.close")}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (phase === "countdown") {
    return (
      <button className="full-accent" onClick={() => setCount(0)}>
        <p className="bold" style={{ opacity: 0.75 }}>
          {session?.kind === "placement" ? t("step.placement") : session?.lesson?.title}
        </p>
        {count > 0 ? <div className="countdown">{count}</div> : null}
        <div className="display">{t("session.getReady")}</div>
        <p className="small" style={{ opacity: 0.75 }}>
          {t("session.tapToSkip")}
        </p>
      </button>
    );
  }

  if ((phase === "done" || phase === "finishing") && session) {
    return <Congrats session={session} result={result} onClose={pop} />;
  }

  if (!session || !pages.length) return <div className="session" />;

  const pageIndex = Math.min(progress.page, pages.length - 1);
  const page = pages[pageIndex];
  const steps = stepsOf(pages);
  const stepIdx = steps.findIndex((s, i) => pageIndex >= s.first && (i === steps.length - 1 || pageIndex < steps[i + 1].first));
  const isLast = pageIndex === pages.length - 1;
  const ok = canAdvance(page, progress);

  const go = (d: number) => {
    haptic("tap");
    updateProgress({ page: Math.max(0, Math.min(pages.length - 1, pageIndex + d)) });
    document.querySelector(".session-body")?.scrollTo({ top: 0 });
  };

  return (
    <div className="session">
      <div className="session-top">
        <div className="row-between">
          <button className="round-btn" aria-label={t("session.leaveAria")} onClick={close}>
            <X size={20} />
          </button>
          <span className="pill accent">{t(STEP[page.step])}</span>
          <span className="small muted timer" aria-label={t("session.timeAria")}>
            {Math.floor(progress.seconds / 60)}:{String(progress.seconds % 60).padStart(2, "0")}
          </span>
        </div>
        <div className="steps" aria-hidden>
          {steps.map((s, i) => {
            const end = i === steps.length - 1 ? pages.length : steps[i + 1].first;
            const fill = i < stepIdx ? 1 : i > stepIdx ? 0 : (pageIndex - s.first + 1) / (end - s.first);
            return (
              <i key={s.step}>
                <b style={{ width: `${fill * 100}%` }} />
              </i>
            );
          })}
        </div>
      </div>

      <div className="session-body" tabIndex={0} role="region" aria-label={t(STEP[page.step])}>
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div className="page-count" aria-label={t("session.pageAria", { i: pageIndex + 1, n: pages.length })}>
            {pageIndex + 1}
            <small>/ {pages.length}</small>
          </div>
          {pageIndex === 0 && session.lesson?.mode && session.lesson.mode !== "ai" && (
            <span className={`mode-tag ${session.lesson.mode}`}>{t(session.lesson.mode === "course" ? "mode.course" : "mode.offline")}</span>
          )}
        </div>
        {pageIndex === 0 && session.lesson?.mode === "offline" && session.lesson.fallback && session.lesson.fallback !== "offline-mode" && (
          <div className="banner warn small" style={{ marginBottom: 14 }}>
            <CloudOff size={18} /> <span className="grow">{t(session.lesson.fallback === "credits" ? "session.fallback.credits" : session.lesson.fallback === "auth" ? "session.fallback.auth" : "session.fallback.noKey")}</span>
          </div>
        )}
        <PageView page={page} session={session} progress={progress} update={updateProgress} />
      </div>

      <div className="cta-bar">
        <button className="btn dark" onClick={() => go(-1)} disabled={pageIndex === 0}>
          <ArrowLeft size={20} /> {t("common.prev")}
        </button>
        {isLast ? (
          <button className="btn primary" onClick={finish} disabled={!ok}>
            {t("session.finish")} <Check size={20} />
          </button>
        ) : (
          <button className="btn primary" onClick={() => go(1)} disabled={!ok}>
            {t("common.next")} <ArrowRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- page renderers ----------

function PageView({ page, session, progress, update }: { page: Page; session: Session; progress: SessionProgress; update: (p: Partial<SessionProgress>) => void }) {
  const t = useT();
  switch (page.kind) {
    case "intro":
      return (
        <div className="stack-lg">
          <h2 className="q-title">{t("placement.title")}</h2>
          <p className="muted">{page.text}</p>
          <div className="card flat tight">
            <p className="small">{t("placement.howto", { n: page.count })}</p>
          </div>
        </div>
      );
    case "recap":
      return (
        <div className="stack-lg">
          <h2 className="q-title">{t("session.recapTitle")}</h2>
          <div className="card">
            <ul style={{ margin: 0, paddingLeft: 20 }} className="prose">
              {page.recap.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
          <p className="muted small">{t("session.recapNext")}</p>
        </div>
      );
    case "theory": {
      const links = session.lesson?.links;
      const offline = session.lesson?.mode === "offline";
      return (
        <div className="stack-lg">
          <div>
            <p className="tiny muted" style={{ marginBottom: 4 }}>
              {t(offline ? "session.readingPart" : "session.theoryPart", { i: page.index + 1, n: page.of })}
            </p>
            <h2 className="q-title" style={{ marginBottom: 0 }}>
              {page.section.heading}
            </h2>
          </div>
          <Markdown text={page.section.body} />
          {page.keyPoints && page.keyPoints.length > 0 && (
            <div className="keypoints">
              <h3>
                <Lightbulb size={14} style={{ verticalAlign: -2 }} /> {t(offline ? "session.keySentences" : "session.keyPoints")}
              </h3>
              <ul>
                {page.keyPoints.map((k, i) => (
                  <li key={i}>{k}</li>
                ))}
              </ul>
            </div>
          )}
          {page.keyPoints && links && links.length > 0 && (
            <div className="card tight">
              <p className="small bold" style={{ marginBottom: 6 }}>
                {t("session.fromWeb")}
              </p>
              {links.map((l) => (
                <ExtLink key={l.url} href={l.url} className="row small link-row">
                  <ExternalLink size={14} /> <span className="ellipsis">{l.title}</span>
                </ExtLink>
              ))}
            </div>
          )}
        </div>
      );
    }
    case "mcq":
      return <McqView page={page} progress={progress} update={update} allowDontKnow={page.step === "placement"} />;
    case "open":
      return <OpenView session={session} progress={progress} update={update} />;
  }
}

function McqView({ page, progress, update, allowDontKnow }: { page: Extract<Page, { kind: "mcq" }>; progress: SessionProgress; update: (p: Partial<SessionProgress>) => void; allowDontKnow: boolean }) {
  const t = useT();
  const { mcq } = page;
  const chosen = progress.mcq[mcq.id];
  const answered = chosen !== undefined;
  const pick = (i: number) => {
    if (answered) return;
    haptic(i === mcq.answer ? "ok" : "bad");
    update({ mcq: { ...progress.mcq, [mcq.id]: i } });
  };
  const label = page.step === "review" ? t("mcq.recall") : page.step === "placement" ? t("mcq.question") : t("mcq.quiz");
  return (
    <div>
      <p className="tiny muted" style={{ marginBottom: 4 }}>
        {t("mcq.counter", { label, i: page.index + 1, n: page.of })}
        {mcq.topic ? ` · ${mcq.topic}` : ""}
      </p>
      <h2 className="q-title selectable">{mcq.q}</h2>
      <div role="radiogroup" aria-label={mcq.q}>
        {mcq.options.map((o, i) => {
          let cls = "option";
          if (answered && i === mcq.answer) cls += " right";
          else if (answered && i === chosen) cls += " wrong";
          return (
            <button key={i} className={cls} role="radio" aria-checked={chosen === i} onClick={() => pick(i)} disabled={answered}>
              <span className="letter" aria-hidden>
                {answered && i === mcq.answer ? <Check size={15} /> : answered && i === chosen ? <X size={15} /> : "ABCDEF"[i]}
              </span>
              <span>{o}</span>
            </button>
          );
        })}
      </div>
      {!answered && allowDontKnow && (
        <button className="btn ghost block" style={{ marginTop: 8 }} onClick={() => pick(-1)}>
          {t("mcq.dontKnow")}
        </button>
      )}
      {answered && (
        <div className="explain" role="status">
          <b style={{ color: chosen === mcq.answer ? "var(--good)" : "var(--bad)" }}>{chosen === mcq.answer ? t("mcq.correct") : chosen === -1 ? t("mcq.answerIs") : t("mcq.wrong")}</b>
          {mcq.explanation}
        </div>
      )}
    </div>
  );
}

function OpenView({ session, progress, update }: { session: Session; progress: SessionProgress; update: (p: Partial<SessionProgress>) => void }) {
  const t = useT();
  const ai = useAiState();
  const lesson = session.lesson!;
  const [text, setText] = useState(progress.openAnswer && progress.openAnswer !== "__skipped__" ? progress.openAnswer : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selfMode, setSelfMode] = useState(false);
  const [ticked, setTicked] = useState<boolean[]>(() => lesson.open.rubric.map(() => false));
  const grade = progress.grade;
  const skipped = progress.openAnswer === "__skipped__";
  const canAi = ai === "ok";
  const hasModel = !!lesson.open.modelAnswer;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const checkAi = async () => {
    setBusy(true);
    setErr(null);
    try {
      const sk = await db.skillsets.get(session.skillsetId);
      const profile = await getProfile();
      const g = await gradeAnswer({ model: profile.model, language: sk?.language ?? "English", lesson, answer: text });
      update({ openAnswer: text, grade: g });
      reportAiOk();
      haptic(g.score >= 6 ? "ok" : "tap");
    } catch (e) {
      reportAiError(e);
      setErr(aiErrorText(e, t));
      if (hasModel || lesson.open.rubric.length) setSelfMode(true);
    } finally {
      setBusy(false);
    }
  };

  const saveSelf = () => {
    const total = Math.max(1, lesson.open.rubric.length);
    const n = ticked.filter(Boolean).length;
    const g: OpenGrade = {
      score: Math.round((10 * n) / total),
      verdict: t("open.selfVerdict", { n, total }),
      strengths: lesson.open.rubric.filter((_, i) => ticked[i]),
      gaps: lesson.open.rubric.filter((_, i) => !ticked[i]),
      modelAnswer: lesson.open.modelAnswer ?? "",
      self: true,
    };
    update({ openAnswer: text, grade: g });
    haptic("ok");
  };

  return (
    <div className="stack-lg">
      <div>
        <p className="tiny muted" style={{ marginBottom: 4 }}>
          {t("open.kicker")}
        </p>
        <h2 className="q-title selectable" style={{ marginBottom: 0 }}>
          {lesson.open.q}
        </h2>
      </div>
      {!grade && !skipped && (
        <>
          <textarea className="textarea" aria-label={t("open.answerAria")} placeholder={t("open.placeholder")} value={text} onChange={(e) => setText(e.target.value)} disabled={busy} />
          {!selfMode && lesson.open.rubric.length > 0 && <p className="faint small">{t("open.covers", { list: lesson.open.rubric.join(" · ") })}</p>}
          {err && (
            <div className="error-box" role="alert">
              {err}
            </div>
          )}
          {!selfMode && (
            <>
              {canAi && (
                <button className="btn primary block" onClick={checkAi} disabled={busy || words < 5}>
                  {busy ? (
                    <span className="pulse">{t("open.checking")}</span>
                  ) : (
                    <>
                      <Sparkles size={18} /> {t("open.checkAi")}
                    </>
                  )}
                </button>
              )}
              <button className={`btn ${canAi ? "dark" : "primary"} block`} onClick={() => setSelfMode(true)} disabled={busy}>
                <Check size={18} /> {t("open.selfCheck")}
              </button>
              {!canAi && <p className="faint small center">{t("open.noAiHint")}</p>}
              <button className="btn ghost block" onClick={() => update({ openAnswer: "__skipped__" })} disabled={busy}>
                {t("open.skip")}
              </button>
            </>
          )}
          {selfMode && (
            <div className="stack-lg">
              {hasModel && (
                <div className="keypoints" style={{ marginTop: 0 }}>
                  <h3>{t(lesson.mode === "offline" ? "open.keyIdeas" : "open.modelAnswer")}</h3>
                  <Markdown text={lesson.open.modelAnswer!} />
                </div>
              )}
              {lesson.open.rubric.length > 0 && (
                <fieldset className="card tight checklist">
                  <legend className="small bold">{t("open.tickCovered")}</legend>
                  {lesson.open.rubric.map((r, i) => (
                    <label key={i} className="check-row">
                      <input type="checkbox" checked={ticked[i]} onChange={(e) => setTicked((arr) => arr.map((v, k) => (k === i ? e.target.checked : v)))} />
                      <span>{r}</span>
                    </label>
                  ))}
                </fieldset>
              )}
              <button className="btn primary block" onClick={saveSelf}>
                {t("open.saveSelf")}
              </button>
            </div>
          )}
        </>
      )}
      {skipped && <p className="muted">{t("open.skipped")}</p>}
      {grade && (
        <>
          <div className="card row" style={{ gap: 16 }}>
            <ScoreRing score={grade.score} />
            <div className="grow">
              <p className="tiny muted">{grade.self ? t("open.selfScore") : t("open.aiScore")}</p>
              <p className="bold">{grade.verdict}</p>
            </div>
          </div>
          {grade.strengths.length > 0 && (
            <div className="card tight">
              <p className="small bold" style={{ color: "var(--good)", marginBottom: 6 }}>
                {grade.self ? t("open.covered") : t("open.worked")}
              </p>
              <ul className="prose" style={{ margin: 0, paddingLeft: 20, fontSize: 14.5 }}>
                {grade.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {grade.gaps.length > 0 && (
            <div className="card tight">
              <p className="small bold" style={{ color: "var(--gold)", marginBottom: 6 }}>
                {grade.self ? t("open.missed") : t("open.improve")}
              </p>
              <ul className="prose" style={{ margin: 0, paddingLeft: 20, fontSize: 14.5 }}>
                {grade.gaps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {grade.modelAnswer && !grade.self && (
            <div className="keypoints">
              <h3>{t("open.modelAnswer")}</h3>
              <Markdown text={grade.modelAnswer} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------- result ----------

function Congrats({ session, result, onClose }: { session: Session; result: SessionResult | null; onClose: () => void }) {
  const t = useT();
  const [placement, setPlacement] = useState<{ level: string; strengths: string[]; gaps: string[] } | null>(null);
  useEffect(() => {
    if (session.kind === "placement" && result) db.skillsets.get(session.skillsetId).then((s) => s?.placement && setPlacement(s.placement));
  }, [session, result]);
  if (!result) {
    return (
      <div className="preparing">
        <div className="spin">
          <Rings values={[0.7]} size={90} stroke={10} />
        </div>
      </div>
    );
  }
  const acc = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  return (
    <div className="screen" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div className="congrats" role="status">
        <div className="check-badge">
          <div>
            <Check size={44} strokeWidth={3} />
          </div>
        </div>
        <h1 className="display" style={{ fontSize: 28 }}>
          {t("done.title")}
        </h1>
        <p style={{ opacity: 0.8, maxWidth: 280 }}>{session.kind === "placement" ? t("done.placement") : t("done.lesson", { title: session.lesson?.title ?? "" })}</p>
        <div className="result-grid">
          <div>
            <div className="v">+{result.xp}</div>
            <div className="k">XP</div>
          </div>
          <div>
            <div className="v">{result.total ? `${acc}%` : "—"}</div>
            <div className="k">{t("done.correct")}</div>
          </div>
          <div>
            <div className="v">
              <Flame size={18} style={{ verticalAlign: -2 }} /> {result.streak}
            </div>
            <div className="k">{t("done.streak")}</div>
          </div>
        </div>
        {placement && (
          <div className="placement-box">
            <p className="bold">{t("done.level", { level: t(`level.${placement.level}` as Key) })}</p>
            {placement.strengths.length > 0 && <p className="small">{t("done.strong", { list: placement.strengths.join(", ") })}</p>}
            {placement.gaps.length > 0 && <p className="small">{t("done.gaps", { list: placement.gaps.join(", ") })}</p>}
          </div>
        )}
        {result.levelUp && <p className="bold">{t("done.levelUp", { n: result.levelUp, rank: t(`rank.${rankFor(result.levelUp)}` as Key) })}</p>}
        {result.badges.length > 0 && (
          <div className="row" style={{ flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
            {result.badges.map((id) => {
              const b = badgeById(id);
              return b ? (
                <span key={id} className="pill badge-pill">
                  <BadgeIcon name={b.icon} size={15} /> {t(`badge.${id}.t` as Key)}
                </span>
              ) : null;
            })}
          </div>
        )}
        <button className="btn" onClick={onClose}>
          {t("common.close")}
        </button>
      </div>
    </div>
  );
}
