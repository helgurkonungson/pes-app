/** Lesson pages: theory with Listen, multiple choice, the open question and the waiting page for a part still being written (split out of Session.tsx, ADR-036). */
import { Check, ExternalLink, Lightbulb, RotateCcw, Sparkles, Square, Volume2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { reportAiError, reportAiOk, useAiState } from "../../ai/status";
import { modelOf } from "../../ai/providers";
import { gradeAnswer } from "../../ai/tutor";
import { FreeAiSheet } from "../../components/FreeAi";
import { ExtLink, toast } from "../../components/ui";
import { WormGame } from "../../components/WormGame";
import { BuildProgress } from "../../components/BuildProgress";
import { Markdown, ScoreRing } from "../../components/visuals";
import { answerWords } from "../../core/answerWords";
import type { Page, StepKey } from "../../core/flow";
import type { OpenGrade, Session, SessionProgress } from "../../core/types";
import { db, getProfile } from "../../data/db";
import { continueWriting } from "../../data/sessionService";
import { type Key, locale, useT } from "../../i18n";
import { speak, speakable, stopSpeaking } from "../../native/tts";
import { aiErrorText } from "../aiText";
import { haptic } from "../../native/haptics";

const STEP: Record<StepKey, Key> = { review: "step.review", theory: "step.theory", quiz: "step.quiz", open: "step.open", placement: "step.placement" };

/** Reads the current theory part aloud; stops when the page changes. */
function ListenButton({ text }: { text: string }) {
  const t = useT();
  const [on, setOn] = useState(false);
  useEffect(() => () => void stopSpeaking(), []);
  const toggle = async () => {
    if (on) {
      await stopSpeaking();
      setOn(false);
      return;
    }
    setOn(true);
    try {
      await speak(text, locale());
    } catch {
      toast(t("tts.unavailable"));
    } finally {
      setOn(false);
    }
  };
  return (
    <button className={`btn small listen-btn${on ? " on" : ""}`} onClick={toggle} aria-pressed={on}>
      {on ? <Square size={16} /> : <Volume2 size={16} />} {on ? t("tts.stop") : t("tts.listen")}
    </button>
  );
}

/** Label of the current step: the review step is an intermediate test sometimes; the final test reuses the test pages. */
export function stepLabel(page: Page, session: Session): Key {
  if (page.step === "placement" && session.kind === "final") return "step.final";
  if (page.step === "review" && session.lesson?.checkpoint) return "step.checkpoint";
  return STEP[page.step];
}

// ---------- page renderers ----------

/** A part still being written: the waiting game, the writing progress, Retry if writing stopped. */
export function PendingWait({ session, step, pending, onPlay, onDone }: { session: Session; step?: string; pending: boolean; onPlay: () => void; onDone: () => void }) {
  const t = useT();
  const b = session.lesson?.building;
  const failed = !!b?.error;
  return (
    <div className="stack-lg pending-page">
      {pending && (
        <h2 className="q-title" role="status">
          {failed ? t("session.buildStopped") : t(step === "quiz" ? "session.buildingQuiz" : "session.buildingPart")}
        </h2>
      )}
      <WormGame ready={!pending} onPlay={onPlay} onDone={onDone} />
      {pending && b && <BuildProgress building={b} />}
      {pending && <p className="muted small">{failed ? t("session.buildStoppedText") : t("session.buildingText")}</p>}
      {pending && failed && (
        <button className="btn primary block" onClick={() => void continueWriting(session.id).catch(() => undefined)}>
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}

export function PageView({ page, session, progress, update, onSkipPlacement }: { page: Page; session: Session; progress: SessionProgress; update: (p: Partial<SessionProgress>) => void; onSkipPlacement?: () => void }) {
  const t = useT();
  switch (page.kind) {
    case "checkpoint":
      return (
        <div className="stack-lg">
          <h2 className="q-title">{t("checkpoint.title")}</h2>
          <p className="muted">{t("checkpoint.text", { n: page.count })}</p>
        </div>
      );
    case "intro":
      return (
        <div className="stack-lg">
          <h2 className="q-title">{session.kind === "final" ? t("final.title") : t("placement.title")}</h2>
          <p className="muted">{page.text}</p>
          <div className="card flat tight">
            <p className="small">{t("placement.howto", { n: page.count })}</p>
          </div>
          {session.kind === "placement" && <p className="muted small">{t("placement.skipNote")}</p>}
          {session.kind === "placement" && onSkipPlacement && (
            <button className="btn dark block" onClick={onSkipPlacement}>
              {t("placement.skip")}
            </button>
          )}
        </div>
      );
    case "pending":
      return null; // drawn by PendingWait, so the waiting game survives the part's arrival
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
          <ListenButton key={`${session.id}-${page.index}`} text={`${page.section.heading}.\n${speakable(page.section.body)}${page.keyPoints?.length ? `\n${page.keyPoints.join("\n")}` : ""}`} />
          {page.index === 0 && !!session.lesson?.revisit?.length && (
            <div className="revisit" data-testid="revisit">
              <h3>
                <RotateCcw size={14} style={{ verticalAlign: -2 }} /> {t("session.revisitTitle")}
              </h3>
              <ul>
                {session.lesson.revisit.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
          )}
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
      return <McqView page={page} progress={progress} update={update} test={session.kind !== "lesson"} allowDontKnow={page.step === "placement"} checkpoint={!!session.lesson?.checkpoint} />;
    case "open":
      return <OpenView session={session} progress={progress} update={update} />;
  }
}

function McqView({ page, progress, update, allowDontKnow, checkpoint, test }: { page: Extract<Page, { kind: "mcq" }>; progress: SessionProgress; update: (p: Partial<SessionProgress>) => void; allowDontKnow: boolean; checkpoint?: boolean; test?: boolean }) {
  const t = useT();
  const { mcq } = page;
  const chosen = progress.mcq[mcq.id];
  const answered = chosen !== undefined;
  const pick = (i: number) => {
    if (answered) return;
    haptic(i === mcq.answer ? "ok" : "bad");
    update({ mcq: { ...progress.mcq, [mcq.id]: i } });
  };
  const label = page.step === "review" ? t(checkpoint ? "mcq.checkpoint" : "mcq.recall") : page.step === "placement" ? t("mcq.question") : t("mcq.quiz");
  return (
    <div>
      <p className="tiny muted" style={{ marginBottom: 4 }}>
        {/* in a test the big counter above already says "question i of n" */}
        {test ? (mcq.topic ?? label) : `${t("mcq.counter", { label, i: page.index + 1, n: page.of })}${mcq.topic ? ` · ${mcq.topic}` : ""}`}
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
  const [keyVersion, setKeyVersion] = useState(0);
  const [freeAi, setFreeAi] = useState(false);
  const ai = useAiState(keyVersion);
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
  const words = answerWords(text);

  const checkAi = async () => {
    setBusy(true);
    setErr(null);
    try {
      const sk = await db.skillsets.get(session.skillsetId);
      const profile = await getProfile();
      const g = await gradeAnswer({ model: modelOf(profile), language: sk?.language ?? "English", lesson, answer: text });
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
        {!!lesson.revisit?.length && !grade && <p className="faint small" style={{ marginTop: 6 }}>{t("open.revisitHint")}</p>}
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
              {/* the main feature is AI checking open answers: offer it right here when no AI is connected */}
              {ai === "no-key" && (
                <div className="card flat tight stack" data-testid="open-ai-cta">
                  <p className="small">
                    <Sparkles size={14} style={{ verticalAlign: -2 }} /> {t("open.aiCta")}
                  </p>
                  <button className="btn dark block" onClick={() => setFreeAi(true)} disabled={busy}>
                    {t("open.aiCtaBtn")}
                  </button>
                </div>
              )}
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
      {freeAi && (
        <FreeAiSheet
          onClose={() => setFreeAi(false)}
          onDone={() => {
            setFreeAi(false);
            setKeyVersion((v) => v + 1);
          }}
        />
      )}
      {grade && (
        <>
          {!!progress.openAnswer && progress.openAnswer !== "__skipped__" && (
            <div className="card tight your-answer">
              <p className="tiny muted" style={{ marginBottom: 4 }}>
                {t("open.answerAria")}
              </p>
              <p className="small selectable">{progress.openAnswer}</p>
            </div>
          )}
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
              <p className="small bold" style={{ color: "var(--warn)", marginBottom: 6 }}>
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
