import { Capacitor } from "@capacitor/core";
import { ArrowLeft, ArrowRight, Check, CloudOff, X } from "lucide-react";
import { liveQuery } from "dexie";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AiError } from "../ai/client";
import { useAiState } from "../ai/status";
import { confirmDialog } from "../components/ui";
import { WormGame } from "../components/WormGame";
import { ReportButton } from "../components/ReportLesson";
import { BuildProgress } from "../components/BuildProgress";
import { canAdvance, lessonPages, type Page, placementPages, stepsOf } from "../core/flow";
import { nowIso } from "../core/ids";
import { OfflineError } from "../core/offline";
import type { Session, SessionProgress, SessionResult } from "../core/types";
import { db, getProfile } from "../data/db";
import { completeSession, skipPlacement } from "../data/repo";
import { writeSnapshot } from "../data/safety";
import { continueWriting, CourseFinishedError, isWriting, prefetchNext, prepareSession, restartReading } from "../data/sessionService";
import { type Key, useT } from "../i18n";
import { scheduleReminders, setReminder } from "../native/reminders";
import { useNav } from "../nav/store";
import { keepScreenOn } from "../native/awake";
import { aiErrorDetail, aiErrorText } from "./aiText";
import { haptic } from "../native/haptics";
import { Congrats } from "./session/Congrats";
import { LoadingStatus } from "./session/LoadingStatus";
import { PageView, PendingWait, stepLabel } from "./session/PageView";

type Phase = "loading" | "error" | "countdown" | "run" | "finishing" | "done";

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
  /** The lesson is prepared but the learner is still playing the waiting game: the phase to go to after the round. */
  const [readyPhase, setReadyPhase] = useState<Phase | null>(null);
  /** The page whose part arrived while a round of the waiting game was still on: it opens after the round. */
  const [gamePage, setGamePage] = useState<number | null>(null);
  const [genSteps, setGenSteps] = useState<{ done: number; total: number } | null>(null);
  const [sectionOf, setSectionOf] = useState({ i: 1, n: 1 });
  const abortRef = useRef<AbortController | null>(null);
  /** The app went to the background (phone asleep, switched away) while the lesson was being written. */
  const wasHiddenRef = useRef(false);
  const autoResumesRef = useRef(0);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  // ---- load / generate ----
  useEffect(() => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setPhase("loading");
    setReadyPhase(null);
    setError(null);
    // keep the phone awake while an AI lesson is written; finished steps are saved either way
    const release = forceOffline ? () => undefined : keepScreenOn();
    const onHide = () => {
      if (document.visibilityState === "hidden") wasHiddenRef.current = true;
    };
    document.addEventListener("visibilitychange", onHide);
    prepareSession(skillsetId, minutes, {
      offline: forceOffline,
      signal: ctrl.signal,
      onProgress: (s, detail, st) => {
        if (st) setGenSteps(st);
        if (s === "research") return setStage("session.researching");
        if (s === "grading") return setStage("session.grading");
        if (detail === "plan") return setStage("session.stepPlan");
        if (detail === "review") return setStage("session.stepReview");
        if (detail === "quiz") return setStage("session.stepQuiz");
        const m = detail?.match(/^section (\d+)\/(\d+)$/);
        if (m) {
          setSectionOf({ i: Number(m[1]), n: Number(m[2]) });
          return setStage("session.stepSection");
        }
        setStage("session.writing");
      },
    })
      .then((s) => {
        if (ctrl.signal.aborted) return;
        autoResumesRef.current = 0;
        setSession(s);
        setProgress(s.progress);
        // the waiting game hands over when its round ends (at once if nobody is playing)
        setReadyPhase(s.status === "active" ? "run" : "countdown");
      })
      .catch((e) => {
        if (ctrl.signal.aborted) return;
        // a request cut off by sleep / background: continue from the saved steps on return
        const kind = e instanceof AiError ? e.kind : undefined;
        const resumable = kind === "network" || kind === "overloaded" || (kind === "api" && (e.status ?? 0) >= 500);
        if (resumable && (wasHiddenRef.current || document.visibilityState === "hidden") && autoResumesRef.current < 3) {
          autoResumesRef.current++;
          wasHiddenRef.current = false;
          setStage("session.paused");
          const go = () => {
            if (document.visibilityState !== "visible") return;
            document.removeEventListener("visibilitychange", go);
            setStage("session.resuming");
            setAttempt((a) => a + 1);
          };
          document.addEventListener("visibilitychange", go);
          go();
          return;
        }
        setError(e);
        setPhase("error");
      });
    return () => {
      ctrl.abort();
      release();
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [skillsetId, minutes, attempt, forceOffline]);

  // ---- countdown ----
  useEffect(() => {
    if (phase !== "countdown") return;
    if (count <= 0) {
      if (session) {
        const s = { ...session, status: "active" as const, startedAt: session.startedAt ?? nowIso() };
        setSession(s);
        // only these fields: the lesson itself may be updated by its background writer meanwhile
        db.sessions.update(s.id, { status: s.status, startedAt: s.startedAt }).catch(() => undefined);
      }
      setPhase("run");
      return;
    }
    const tm = setTimeout(() => setCount((c) => c - 1), 700);
    return () => clearTimeout(tm);
  }, [phase, count, session]);

  // ---- a lesson still being written: take each new part as it is saved; resume stalled writing ----
  const sessionId = session?.id;
  const building = !!session?.lesson?.building;
  useEffect(() => {
    if (!sessionId || !building) return;
    const sub = liveQuery(() => db.sessions.get(sessionId)).subscribe({
      next: (rec) => {
        if (rec?.lesson) setSession((prev) => (prev && prev.id === rec.id ? { ...prev, lesson: rec.lesson } : prev));
      },
      error: () => undefined,
    });
    const resume = () => {
      if (document.visibilityState === "visible" && !isWriting(sessionId)) void continueWriting(sessionId).catch(() => undefined);
    };
    resume();
    document.addEventListener("visibilitychange", resume);
    return () => {
      sub.unsubscribe();
      document.removeEventListener("visibilitychange", resume);
    };
  }, [sessionId, building]);

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

  const aiNow = useAiState();
  const pages: Page[] = useMemo(() => {
    if (!session) return [];
    if (session.kind !== "lesson" && session.placement) return placementPages(session.placement);
    // the open question needs an AI to grade it; without AI the step is left out
    return session.lesson ? lessonPages(session.lesson, { open: aiNow === "ok" }) : [];
  }, [session, aiNow]);

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
    void scheduleReminders(); // today is done: no reminder tonight
    // after the first finished session, offer daily reminders once
    if (Capacitor.isNativePlatform() && !(await getProfile()).reminder) {
      const yes = await confirmDialog(t("reminder.ask"), { text: t("reminder.askText"), ok: t("reminder.yes"), cancel: t("reminder.no") });
      await setReminder(yes);
    }
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
              <WormGame ready={readyPhase !== null} onDone={() => readyPhase && setPhase(readyPhase)} />
              {readyPhase === null && (
                <>
                  <LoadingStatus stage={stage} stageText={stage === "session.stepSection" ? t(stage, sectionOf) : t(stage)} steps={forceOffline ? null : genSteps} />
                  <p className="muted small" style={{ maxWidth: 300 }}>
                    {forceOffline ? t("session.offlineFast") : t("session.slowHint")}
                  </p>
                </>
              )}
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
              {aiErrorDetail(error, t) && (
                <p className="muted small err-detail" style={{ maxWidth: 320 }}>
                  {aiErrorDetail(error, t)}
                </p>
              )}
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
          {session?.kind === "placement" ? t("step.placement") : session?.kind === "final" ? t("step.final") : session?.lesson?.title}
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
          <span className="pill accent">{t(stepLabel(page, session))}</span>
          <span className="row top-right">
            <span className="small muted timer" aria-label={t("session.timeAria")}>
              {Math.floor(progress.seconds / 60)}:{String(progress.seconds % 60).padStart(2, "0")}
            </span>
            <ReportButton session={session} page={page} />
          </span>
        </div>
        {session.lesson?.building && page.kind !== "pending" && (
          <div className="build-strip">
            <BuildProgress building={session.lesson.building} compact />
          </div>
        )}
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

      <div className="session-body" tabIndex={0} role="region" aria-label={t(stepLabel(page, session))}>
        <div className="row-between" style={{ marginBottom: 10 }}>
          {(() => {
            // a test counts its questions (the intro page is not one); a lesson counts its pages
            const test = session.kind !== "lesson";
            if (test && page.kind !== "mcq") return <span />;
            const i = test && page.kind === "mcq" ? page.index + 1 : pageIndex + 1;
            const n = test && page.kind === "mcq" ? page.of : pages.length;
            return (
              <div className="page-count" aria-label={t(test ? "session.questionAria" : "session.pageAria", { i, n })}>
                {i}
                <small>/ {n}</small>
              </div>
            );
          })()}
          {pageIndex === 0 && session.lesson && (
            <span className={`mode-tag ${session.lesson.mode ?? "ai"}`}>{t(session.lesson.mode === "course" ? "mode.course" : session.lesson.mode === "offline" ? "mode.offline" : "report.aiTag")}</span>
          )}
        </div>
        {pageIndex === 0 && session.lesson?.mode === "offline" && session.lesson.fallback && session.lesson.fallback !== "offline-mode" && (
          <div className="banner warn small" style={{ marginBottom: 14 }}>
            <CloudOff size={18} /> <span className="grow">{t(session.lesson.fallback === "credits" ? "session.fallback.credits" : session.lesson.fallback === "auth" ? "session.fallback.auth" : "session.fallback.noKey")}</span>
          </div>
        )}
        {page.kind === "pending" || gamePage === pageIndex ? (
          <PendingWait
            session={session}
            step={page.kind === "pending" ? page.step : undefined}
            pending={page.kind === "pending"}
            onPlay={() => setGamePage(pageIndex)}
            onDone={() => setGamePage(null)}
          />
        ) : (
          <PageView
            page={page}
            session={session}
            progress={progress}
            update={updateProgress}
            onSkipPlacement={async () => {
              if (!(await confirmDialog(t("placement.skipConfirm"), { text: t("placement.skipConfirmText"), ok: t("placement.skip") }))) return;
              await skipPlacement(session.skillsetId);
              setSession(null);
              setPhase("loading");
              setAttempt((a) => a + 1); // prepare the first lesson instead
            }}
          />
        )}
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
