/**
 * First-run tutorial: five short animated slides shown once after onboarding, and again
 * from Settings → "Watch the tutorial". Skippable at any moment; after a skip a message
 * says where to find it later. Swipe, buttons, dots and the Android back button all work.
 */
import { ArrowLeft, ArrowRight, BookOpen, CloudOff, Flag, Flame, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTutorial } from "../app/tutorialStore";
import { updateProfile } from "../data/db";
import { type Key, useT } from "../i18n";
import { onBack } from "../nav/store";
import { toast } from "./ui";


const SLIDES = ["sources", "portion", "flow", "streak", "ai"] as const;
type Slide = (typeof SLIDES)[number];

export function Tutorial() {
  const t = useT();
  const [i, setI] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const last = i === SLIDES.length - 1;
  const slide = SLIDES[i];

  const close = (how: "done" | "skipped") => {
    useTutorial.getState().hide();
    void updateProfile({ tutorial: how });
    if (how === "skipped") toast(t("tut.skipped"), 6000);
  };
  const go = (d: number) => setI((x) => Math.max(0, Math.min(SLIDES.length - 1, x + d)));

  // Android back: previous slide, or skip on the first one
  const iRef = useRef(i);
  iRef.current = i;
  useEffect(
    () =>
      onBack(() => {
        if (iRef.current > 0) setI((x) => x - 1);
        else close("skipped");
        return true;
      }),
    [],
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Escape") close("skipped");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div
      className="tutorial"
      role="dialog"
      aria-modal="true"
      aria-label={t("tut.aria")}
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        const s = touch.current;
        touch.current = null;
        if (!s) return;
        const dx = e.changedTouches[0].clientX - s.x;
        const dy = e.changedTouches[0].clientY - s.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="tut-top">
        <div className="dots" role="img" aria-label={t("tut.stepOf", { i: i + 1, n: SLIDES.length })}>
          {SLIDES.map((s, k) => (
            <i key={s} className={k === i ? "on" : ""} />
          ))}
        </div>
        {!last && (
          <button className="btn ghost small tut-skip" onClick={() => close("skipped")}>
            {t("tut.skip")}
          </button>
        )}
      </div>

      <div className="tut-stage" key={slide} aria-hidden>
        <Art slide={slide} />
      </div>
      <div className="tut-text" key={`${slide}-text`} aria-live="polite">
        <h1 className="display">{t(`tut.${slide}.title` as Key)}</h1>
        <p className="muted">{t(`tut.${slide}.text` as Key)}</p>
      </div>

      <div className="row tut-actions">
        {i > 0 && (
          <button className="btn dark" onClick={() => go(-1)} aria-label={t("common.prev")}>
            <ArrowLeft size={20} />
          </button>
        )}
        {last ? (
          <button className="btn primary grow" onClick={() => close("done")}>
            {t("tut.done")} <Sparkles size={20} />
          </button>
        ) : (
          <button className="btn primary grow" onClick={() => go(1)}>
            {t("common.next")} <ArrowRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

/** One looping illustration per slide — CSS animations only (no libraries, no images). */
function Art({ slide }: { slide: Slide }) {
  const t = useT();
  switch (slide) {
    case "sources":
      return (
        <div className="tut-art tut-sources">
          <div className="tut-book">
            <BookOpen size={46} />
          </div>
          {[0, 1, 2].map((k) => (
            <div key={k} className="tut-page" style={{ animationDelay: `${k * 0.45}s` }}>
              <i />
              <i />
              <i />
            </div>
          ))}
        </div>
      );
    case "portion":
      return (
        <div className="tut-art tut-portion">
          <svg viewBox="0 0 120 120" className="tut-ring">
            <circle cx="60" cy="60" r="48" className="track" />
            <circle cx="60" cy="60" r="48" className="fill" />
          </svg>
          <div className="tut-chips">
            {[5, 15, 30, 60].map((m, k) => (
              <span key={m} style={{ animationDelay: `${k * 0.8}s` }}>
                {t("portion.min", { n: m })}
              </span>
            ))}
          </div>
        </div>
      );
    case "flow":
      return (
        <div className="tut-art tut-flow">
          {(["step.review", "step.theory", "step.quiz", "step.open"] as Key[]).map((k, n) => (
            <div key={k} className="tut-step" style={{ animationDelay: `${n * 0.7}s` }}>
              <b>{n + 1}</b> {t(k)}
            </div>
          ))}
        </div>
      );
    case "streak":
      return (
        <div className="tut-art tut-streak">
          <div className="tut-flame">
            <Flame size={64} />
          </div>
          <span className="tut-xp">+20 XP</span>
          <div className="tut-card">
            <div className="front">?</div>
            <div className="back">✓</div>
          </div>
        </div>
      );
    case "ai":
      return (
        <div className="tut-art tut-ai">
          <div className="tut-lesson">
            <div className="row-between">
              <span className="mode-tag ai">{t("report.aiTag")}</span>
              <span className="tut-flag">
                <Flag size={18} />
              </span>
            </div>
            <i />
            <i />
            <i className="short" />
          </div>
          <span className="mode-tag tut-offline">
            <CloudOff size={13} /> {t("mode.offline")}
          </span>
        </div>
      );
  }
}
