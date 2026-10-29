/** The "preparing the lesson" status: title, an always-moving bar and changing phrases (split out of Session.tsx, ADR-036). */
import { useEffect, useRef, useState } from "react";
import { type Key, useT } from "../../i18n";
import { loadingPhrase, loadingProgress } from "../../core/loading";

/** Title, an always-moving progress bar and phrases that change every few seconds while a lesson is prepared. */
export function LoadingStatus({ stage, stageText, steps }: { stage: Key; stageText: string; steps: { done: number; total: number } | null }) {
  const t = useT();
  const [seconds, setSeconds] = useState(0);
  const stepStart = useRef({ done: -1, at: 0 });
  useEffect(() => {
    const tm = setInterval(() => setSeconds((x) => x + 1), 1000);
    return () => clearInterval(tm);
  }, []);
  const real = steps && steps.total > 1 ? steps : null;
  if (real && stepStart.current.done !== real.done) stepStart.current = { done: real.done, at: seconds };
  const value = loadingProgress({ steps: real, secondsInStep: seconds - stepStart.current.at, secondsTotal: seconds });
  const phrase = t(loadingPhrase(value, seconds));
  // a generic stage gets the changing phrase as its title; a specific one keeps it and shows the phrase below
  const generic = stage === "session.preparing" || stage === "session.writing";
  const pct = Math.round(value * 100);
  return (
    <>
      <h2 className="section-title" role="status">
        {generic ? phrase : stageText}
      </h2>
      <div className="gen-steps">
        <div className="gen-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={real ? t("session.stepCount", { i: Math.min(real.done + 1, real.total), n: real.total }) : stageText}>
          <span style={{ width: `${Math.max(3, pct)}%` }} />
        </div>
        <p className="muted small loading-phrase" key={generic ? "steps" : phrase} aria-hidden={!generic ? true : undefined}>
          {real ? `${t("session.stepCount", { i: Math.min(real.done + 1, real.total), n: real.total })}${generic ? "" : ` · ${phrase}`}` : generic ? `${pct}%` : phrase}
        </p>
      </div>
    </>
  );
}
