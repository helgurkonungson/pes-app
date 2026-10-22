import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ExternalLink, Flame, Lightbulb, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AiError } from "../ai/client";
import { gradeAnswer } from "../ai/tutor";
import { confirmDialog } from "../components/ui";
import { BadgeIcon, Markdown, Rings, ScoreRing } from "../components/visuals";
import { badgeById } from "../core/badges";
import { canAdvance, lessonPages, type Page, placementPages, STEP_LABEL, stepsOf } from "../core/flow";
import { nowIso } from "../core/ids";
import { rankFor } from "../core/scoring";
import type { Session, SessionProgress, SessionResult } from "../core/types";
import { db, getProfile } from "../data/db";
import { completeSession, saveSession } from "../data/repo";
import { prefetchNext, prepareSession } from "../data/sessionService";
import { useNav } from "../nav/store";

type Phase = "loading" | "error" | "countdown" | "run" | "finishing" | "done";

const haptic = (kind: "ok" | "bad" | "tap") => {
  if (!Capacitor.isNativePlatform()) return;
  if (kind === "tap") Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
  else Haptics.notification({ type: kind === "ok" ? NotificationType.Success : NotificationType.Error }).catch(() => undefined);
};

export function SessionScreen({ skillsetId, minutes }: { skillsetId: string; minutes: number }) {
  const { pop, push } = useNav();
  const [phase, setPhase] = useState<Phase>("loading");
  const [stage, setStage] = useState("Getting things ready…");
  const [error, setError] = useState<AiError | Error | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [progress, setProgress] = useState<SessionProgress>({ page: 0, mcq: {}, seconds: 0 });
  const [result, setResult] = useState<SessionResult | null>(null);
  const [count, setCount] = useState(3);
  const [attempt, setAttempt] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  // ---- load / generate ----
  useEffect(() => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setPhase("loading");
    setError(null);
    prepareSession(skillsetId, minutes, (_s, detail) => detail && setStage(detail), ctrl.signal)
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
  }, [skillsetId, minutes, attempt]);

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
    const t = setTimeout(() => setCount((c) => c - 1), 800);
    return () => clearTimeout(t);
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
    const t = setInterval(() => {
      if (document.visibilityState === "visible") {
        setProgress((p) => ({ ...p, seconds: p.seconds + 1 }));
      }
    }, 1000);
    const save = setInterval(() => persist(progressRef.current), 10_000);
    return () => {
      clearInterval(t);
      clearInterval(save);
      persist(progressRef.current);
    };
  }, [phase, persist]);

  // ---- hardware back ----
  useEffect(() => {
    const onBack = async () => {
      if (phase === "run") {
        if (await confirmDialog("Leave the session?", { text: "Your progress is saved — you can continue later.", ok: "Leave" })) pop();
      } else {
        abortRef.current?.abort();
        pop();
      }
    };
    window.addEventListener("pes:session-back", onBack);
    return () => window.removeEventListener("pes:session-back", onBack);
  }, [phase, pop]);

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
    const sk = await db.skillsets.get(session.skillsetId);
    if (sk) prefetchNext(sk.id, sk.minutes);
  };

  // ---------- views ----------

  if (phase === "loading" || phase === "error") {
    return (
      <div className="session">
        <div className="session-top">
          <button className="round-btn" aria-label="Close" onClick={() => window.dispatchEvent(new CustomEvent("pes:session-back"))}>
            <X size={20} />
          </button>
        </div>
        <div className="preparing">
          {phase === "loading" ? (
            <>
              <div className="spin">
                <Rings values={[0.72, 0.5, 0.3]} size={150} stroke={14} />
              </div>
              <h2 className="section-title">{stage}</h2>
              <p className="muted small" style={{ maxWidth: 300 }}>
                Longer portions take a minute or two to write. Next time it will be ready in advance.
              </p>
            </>
          ) : (
            <>
              <div className="empty art" style={{ width: 84, height: 84, borderRadius: 28, background: "var(--bad-soft)", color: "var(--bad)", display: "grid", placeItems: "center" }}>
                <X size={36} />
              </div>
              <h2 className="section-title">Couldn't prepare the session</h2>
              <p className="muted small" style={{ maxWidth: 320 }}>
                {error?.message}
              </p>
              <div className="row">
                {(error as AiError)?.kind === "no-key" || (error as AiError)?.kind === "auth" ? (
                  <button className="btn primary" onClick={() => push({ name: "settings" })}>
                    Open settings
                  </button>
                ) : (
                  <button className="btn primary" onClick={() => setAttempt((a) => a + 1)}>
                    Try again
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
      <div className="full-accent" onClick={() => setCount(0)}>
        <p className="bold" style={{ opacity: 0.7 }}>
          {session?.kind === "placement" ? "Placement test" : session?.lesson?.title}
        </p>
        {count > 0 ? <div className="countdown">{count}</div> : null}
        <div className="display">Get ready</div>
        <p className="small" style={{ opacity: 0.7 }}>
          Tap to skip
        </p>
      </div>
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
          <button className="round-btn" aria-label="Leave session" onClick={() => window.dispatchEvent(new CustomEvent("pes:session-back"))}>
            <ChevronLeft size={22} />
          </button>
          <span className="pill accent">{STEP_LABEL[page.step]}</span>
          <span className="small muted" style={{ width: 40, textAlign: "right" }}>
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

      <div className="session-body">
        <div className="page-count" style={{ marginBottom: 10 }}>
          {pageIndex + 1}
          <small>/ {pages.length}</small>
        </div>
        <PageView page={page} session={session} progress={progress} update={updateProgress} />
      </div>

      <div className="cta-bar">
        <button className="btn dark" onClick={() => go(-1)} disabled={pageIndex === 0}>
          <ArrowLeft size={20} /> Previous
        </button>
        {isLast ? (
          <button className="btn primary" onClick={finish} disabled={!ok}>
            Finish <Check size={20} />
          </button>
        ) : (
          <button className="btn primary" onClick={() => go(1)} disabled={!ok}>
            Next <ArrowRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- page renderers ----------

function PageView({ page, session, progress, update }: { page: Page; session: Session; progress: SessionProgress; update: (p: Partial<SessionProgress>) => void }) {
  switch (page.kind) {
    case "intro":
      return (
        <div className="stack-lg">
          <h2 className="q-title">Let's find your starting point</h2>
          <p className="muted">{page.text}</p>
          <div className="card flat tight">
            <p className="small">
              {page.count} questions · from easy to hard · tap <b>I don't know</b> instead of guessing blindly — it makes the result more accurate.
            </p>
          </div>
        </div>
      );
    case "recap":
      return (
        <div className="stack-lg">
          <h2 className="q-title">Quick recap of last time</h2>
          <div className="card">
            <ul style={{ margin: 0, paddingLeft: 20 }} className="prose">
              {page.recap.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
          <p className="muted small">Next: a few recall questions, then today's new theory.</p>
        </div>
      );
    case "theory": {
      const links = session.lesson?.links;
      return (
        <div className="stack-lg">
          <div>
            <p className="tiny muted" style={{ marginBottom: 4 }}>
              {session.lesson?.title} · part {page.index + 1} of {page.of}
            </p>
            <h2 className="q-title" style={{ marginBottom: 0 }}>
              {page.section.heading}
            </h2>
          </div>
          <Markdown text={page.section.body} />
          {page.keyPoints && page.keyPoints.length > 0 && (
            <div className="keypoints">
              <h3>
                <Lightbulb size={14} style={{ verticalAlign: -2 }} /> Key points
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
                From the web
              </p>
              {links.map((l) => (
                <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="row small" style={{ padding: "6px 0", textDecoration: "none" }}>
                  <ExternalLink size={14} /> <span className="ellipsis">{l.title}</span>
                </a>
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
  const { mcq } = page;
  const chosen = progress.mcq[mcq.id];
  const answered = chosen !== undefined;
  const pick = (i: number) => {
    if (answered) return;
    haptic(i === mcq.answer ? "ok" : "bad");
    update({ mcq: { ...progress.mcq, [mcq.id]: i } });
  };
  const label = page.step === "review" ? "Recall" : page.step === "placement" ? "Question" : "Quiz";
  return (
    <div>
      <p className="tiny muted" style={{ marginBottom: 4 }}>
        {label} {page.index + 1} of {page.of}
        {mcq.topic ? ` · ${mcq.topic}` : ""}
      </p>
      <h2 className="q-title">{mcq.q}</h2>
      <div role="radiogroup">
        {mcq.options.map((o, i) => {
          let cls = "option";
          if (answered && i === mcq.answer) cls += " right";
          else if (answered && i === chosen) cls += " wrong";
          return (
            <button key={i} className={cls} role="radio" aria-checked={chosen === i} onClick={() => pick(i)} disabled={answered}>
              <span className="letter">{answered && i === mcq.answer ? <Check size={15} /> : answered && i === chosen ? <X size={15} /> : "ABCDEF"[i]}</span>
              <span>{o}</span>
            </button>
          );
        })}
      </div>
      {!answered && allowDontKnow && (
        <button className="btn ghost block" style={{ marginTop: 8 }} onClick={() => pick(-1)}>
          I don't know
        </button>
      )}
      {answered && (
        <div className="explain">
          <b className={chosen === mcq.answer ? "accent" : ""} style={{ color: chosen === mcq.answer ? "var(--good)" : "var(--bad)" }}>
            {chosen === mcq.answer ? "Correct!" : chosen === -1 ? "Here's the answer" : "Not quite"}
          </b>
          {mcq.explanation}
        </div>
      )}
    </div>
  );
}

function OpenView({ session, progress, update }: { session: Session; progress: SessionProgress; update: (p: Partial<SessionProgress>) => void }) {
  const lesson = session.lesson!;
  const [text, setText] = useState(progress.openAnswer && progress.openAnswer !== "__skipped__" ? progress.openAnswer : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const grade = progress.grade;
  const skipped = progress.openAnswer === "__skipped__";

  const check = async () => {
    setBusy(true);
    setErr(null);
    try {
      const sk = await db.skillsets.get(session.skillsetId);
      const profile = await getProfile();
      const g = await gradeAnswer({ model: profile.model, language: sk?.language ?? "English", lesson, answer: text });
      update({ openAnswer: text, grade: g });
      haptic(g.score >= 6 ? "ok" : "tap");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't check the answer.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack-lg">
      <div>
        <p className="tiny muted" style={{ marginBottom: 4 }}>
          Apply what you learned
        </p>
        <h2 className="q-title" style={{ marginBottom: 0 }}>
          {lesson.open.q}
        </h2>
      </div>
      {!grade && !skipped && (
        <>
          <textarea className="textarea" placeholder="Write your answer in 3–6 sentences…" value={text} onChange={(e) => setText(e.target.value)} disabled={busy} />
          {lesson.open.rubric.length > 0 && <p className="faint small">A good answer covers: {lesson.open.rubric.join(" · ")}</p>}
          {err && <div className="error-box">{err}</div>}
          <button className="btn primary block" onClick={check} disabled={busy || text.trim().split(/\s+/).length < 5}>
            {busy ? (
              <span className="pulse">Checking your answer…</span>
            ) : (
              <>
                <Sparkles size={18} /> Check my answer
              </>
            )}
          </button>
          <button className="btn ghost block" onClick={() => update({ openAnswer: "__skipped__" })} disabled={busy}>
            Skip this time
          </button>
        </>
      )}
      {skipped && <p className="muted">Skipped. You can finish the session.</p>}
      {grade && (
        <>
          <div className="card row" style={{ gap: 16 }}>
            <ScoreRing score={grade.score} />
            <div className="grow">
              <p className="tiny muted">Score out of 10</p>
              <p className="bold">{grade.verdict}</p>
            </div>
          </div>
          {grade.strengths.length > 0 && (
            <div className="card tight">
              <p className="small bold" style={{ color: "var(--good)", marginBottom: 6 }}>
                What worked
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
                To improve
              </p>
              <ul className="prose" style={{ margin: 0, paddingLeft: 20, fontSize: 14.5 }}>
                {grade.gaps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {grade.modelAnswer && (
            <div className="keypoints">
              <h3>Model answer</h3>
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
      <div className="congrats">
        <div className="check-badge">
          <div>
            <Check size={44} strokeWidth={3} />
          </div>
        </div>
        <h1 className="display" style={{ fontSize: 28 }}>
          Congratulations!
        </h1>
        <p style={{ opacity: 0.8, maxWidth: 280 }}>
          {session.kind === "placement" ? "Placement test complete. Your lessons will start from here." : `“${session.lesson?.title}” complete.`}
        </p>
        <div className="result-grid">
          <div>
            <div className="v">+{result.xp}</div>
            <div className="k">XP</div>
          </div>
          <div>
            <div className="v">{acc}%</div>
            <div className="k">Correct</div>
          </div>
          <div>
            <div className="v">
              <Flame size={18} style={{ verticalAlign: -2 }} /> {result.streak}
            </div>
            <div className="k">Day streak</div>
          </div>
        </div>
        {placement && (
          <div style={{ width: "100%", textAlign: "left", background: "rgba(12,26,25,.1)", borderRadius: 18, padding: "12px 14px" }}>
            <p className="bold" style={{ textTransform: "capitalize" }}>
              Level: {placement.level}
            </p>
            {placement.strengths.length > 0 && <p className="small">Strong: {placement.strengths.join(", ")}</p>}
            {placement.gaps.length > 0 && <p className="small">To work on: {placement.gaps.join(", ")}</p>}
          </div>
        )}
        {result.levelUp && (
          <p className="bold">
            Level up! You're now level {result.levelUp} · {rankFor(result.levelUp)}
          </p>
        )}
        {result.badges.length > 0 && (
          <div className="row" style={{ flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
            {result.badges.map((id) => {
              const b = badgeById(id);
              return b ? (
                <span key={id} className="pill" style={{ background: "#1c1d20", color: "var(--accent)", height: 32 }}>
                  <BadgeIcon name={b.icon} size={15} /> {b.title}
                </span>
              ) : null;
            })}
          </div>
        )}
        <button className="btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
