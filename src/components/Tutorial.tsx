/**
 * First-run tutorial: five short animated slides shown once after onboarding, and again
 * from Settings → "Watch the tutorial". Skippable at any moment; after a skip a message
 * says where to find it later. Swipe, buttons, dots and the Android back button all work.
 *
 * The last step (ADR-031) offers a free built-in course — one tap opens its first lesson —
 * or "Create my own skill": a short how-to, why AI helps, and how to connect it (free AI
 * with its catches, Chompbook Pro, or the learner's own key).
 */
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, CloudOff, Crown, Flag, Flame, KeyRound, Plus, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAiState } from "../ai/status";
import { activeProvider, PROVIDERS } from "../ai/providers";
import { useTutorial } from "../app/tutorialStore";
import { updateProfile } from "../data/db";
import { useProfile } from "../data/hooks";
import { type Key, useT } from "../i18n";
import { useSettingsIntent } from "../nav/intent";
import { onBack, useNav } from "../nav/store";
import { BuiltinCourseList, useOpenBuiltin } from "./BuiltinCourses";
import { FreeAiSheet } from "./FreeAi";
import { toast } from "./ui";


const SLIDES = ["sources", "portion", "flow", "streak", "ai", "start"] as const;
type Slide = (typeof SLIDES)[number];
/** Pages of the "own skill" path after the last slide. */
type Page = "own" | "connect" | "free" | "key";
const PARENT: Record<Page, Page | null> = { own: null, connect: "own", free: "connect", key: "connect" };

export function Tutorial() {
  const t = useT();
  const [i, setI] = useState(0);
  const [page, setPage] = useState<Page | null>(null);
  const [freeSheet, setFreeSheet] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const nav = useNav();
  const builtin = useOpenBuiltin();
  const ai = useAiState();
  const profile = useProfile();
  const last = i === SLIDES.length - 1;
  const slide = SLIDES[i];

  const close = (how: "done" | "skipped") => {
    useTutorial.getState().hide();
    void updateProfile({ tutorial: how });
    if (how === "skipped") toast(t("tut.skipped"), 6000);
  };
  const go = (d: number) => setI((x) => Math.max(0, Math.min(SLIDES.length - 1, x + d)));
  const finish = (after: () => void) => {
    close("done");
    after();
  };
  const pickCourse = async (slug: string) => {
    if (await builtin.open(slug)) close("done");
  };
  const createSkill = () =>
    finish(() => {
      nav.setTab("skillsets");
      nav.push({ name: "skillsetEdit" });
    });
  const openPro = () => finish(() => nav.push({ name: "pro" }));
  const openKeySettings = () =>
    finish(() => {
      useSettingsIntent.getState().openProvider();
      nav.setTab("settings");
    });
  const up = () => setPage((p) => (p ? PARENT[p] : null));

  // Android back: up one page, previous slide, or skip on the first one
  const state = useRef({ i, page });
  state.current = { i, page };
  useEffect(
    () =>
      onBack(() => {
        if (state.current.page) up();
        else if (state.current.i > 0) setI((x) => x - 1);
        else close("skipped");
        return true;
      }),
    [],
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (page || freeSheet) return;
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Escape") close("skipped");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const backBtn = (onClick: () => void) => (
    <button className="btn dark" onClick={onClick} aria-label={t("common.back")}>
      <ArrowLeft size={20} />
    </button>
  );

  const body = page ? (
    <OwnPage
      page={page}
      aiOk={ai === "ok"}
      providerName={PROVIDERS[activeProvider(profile)].name}
      onPage={setPage}
      onBack={up}
      onCreate={createSkill}
      onPro={openPro}
      onFree={() => setFreeSheet(true)}
      onKey={openKeySettings}
      backBtn={backBtn}
    />
  ) : slide === "start" ? (
    <>
      <div className="tut-page-body" aria-live="polite">
        <h1 className="display">{t("tut.start.title")}</h1>
        <p className="muted">{t("tut.start.text")}</p>
        <BuiltinCourseList compact busy={builtin.busy} onPick={(slug) => void pickCourse(slug)} />
        <button className="list-card tut-own-card" onClick={() => setPage("own")} data-testid="tut-own">
          <span className="icon-dot accent">
            <Plus size={20} />
          </span>
          <span className="grow" style={{ textAlign: "left" }}>
            <span className="bold block">{t("tut.start.own")}</span>
            <span className="small muted block">{t("tut.start.ownHint")}</span>
          </span>
          <ChevronRight size={20} className="muted" aria-hidden />
        </button>
      </div>
      <div className="row tut-actions">
        {backBtn(() => go(-1))}
        <button className="btn ghost grow" onClick={() => close("done")}>
          {t("tut.start.later")}
        </button>
      </div>
    </>
  ) : (
    <>
      <div className="tut-stage" key={slide} aria-hidden>
        <Art slide={slide} />
      </div>
      <div className="tut-text" key={`${slide}-text`} aria-live="polite">
        <h1 className="display">{t(`tut.${slide}.title` as Key)}</h1>
        <p className="muted">{t(`tut.${slide}.text` as Key)}</p>
      </div>
      <div className="row tut-actions">
        {i > 0 && backBtn(() => go(-1))}
        <button className="btn primary grow" onClick={() => go(1)}>
          {t("common.next")} <ArrowRight size={20} />
        </button>
      </div>
    </>
  );

  return (
    <>
      <div
        className="tutorial"
        role="dialog"
        aria-modal="true"
        aria-label={t("tut.aria")}
        onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={(e) => {
          const s = touch.current;
          touch.current = null;
          if (!s || page) return;
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
        {body}
      </div>
      {freeSheet && (
        <div className="tut-sheets">
          <FreeAiSheet
            onClose={() => setFreeSheet(false)}
            onDone={() => {
              setFreeSheet(false);
              createSkill();
            }}
          />
        </div>
      )}
    </>
  );
}

/** The "own skill" path: how it works → connect AI → free AI's catches / own key. */
function OwnPage(p: {
  page: Page;
  aiOk: boolean;
  providerName: string;
  onPage: (p: Page) => void;
  onBack: () => void;
  onCreate: () => void;
  onPro: () => void;
  onFree: () => void;
  onKey: () => void;
  backBtn: (onClick: () => void) => React.ReactNode;
}) {
  const t = useT();
  const option = (icon: React.ReactNode, title: Key, hint: Key, onClick: () => void, testId: string) => (
    <button className="list-card" onClick={onClick} data-testid={testId}>
      <span className="icon-dot">{icon}</span>
      <span className="grow" style={{ textAlign: "left" }}>
        <span className="bold block">{t(title)}</span>
        <span className="small muted block">{t(hint)}</span>
      </span>
      <ChevronRight size={20} className="muted" aria-hidden />
    </button>
  );
  let content: React.ReactNode;
  let actions: React.ReactNode;
  switch (p.page) {
    case "own":
      content = (
        <>
          <h1 className="display">{t("own.title")}</h1>
          <ol className="tut-steps">
            {(["own.step1", "own.step2", "own.step3"] as Key[]).map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ol>
          <div className="banner small" role="note">
            <Sparkles size={18} aria-hidden />
            <span className="grow">{t("own.withAi")}</span>
          </div>
          <button className="btn ghost block small" onClick={p.onCreate}>
            {t("own.noAi")}
          </button>
        </>
      );
      actions = (
        <button className="btn primary grow" onClick={() => p.onPage("connect")}>
          {t("own.next")} <ArrowRight size={20} />
        </button>
      );
      break;
    case "connect":
      content = p.aiOk ? (
        <>
          <h1 className="display">{t("ownai.title")}</h1>
          <div className="banner small" role="status">
            <Check size={18} aria-hidden />
            <span className="grow">{t("ownai.connected", { name: p.providerName })}</span>
          </div>
        </>
      ) : (
        <>
          <h1 className="display">{t("ownai.title")}</h1>
          <p className="muted">{t("ownai.lead")}</p>
          {option(<Sparkles size={20} />, "ownai.free", "ownai.freeHint", () => p.onPage("free"), "own-free")}
          {option(<Crown size={20} />, "ownai.pro", "ownai.proHint", p.onPro, "own-pro")}
          {option(<KeyRound size={20} />, "ownai.key", "ownai.keyHint", () => p.onPage("key"), "own-key")}
          <button className="btn ghost block small" onClick={p.onCreate}>
            {t("ownai.skip")}
          </button>
        </>
      );
      actions = p.aiOk ? (
        <button className="btn primary grow" onClick={p.onCreate}>
          <Plus size={20} /> {t("own.create")}
        </button>
      ) : null;
      break;
    case "free":
      content = (
        <>
          <h1 className="display">{t("ownfree.title")}</h1>
          <p className="muted">{t("ownfree.lead")}</p>
          <ul className="tut-pitfalls small">
            {(["ownfree.p1", "ownfree.p2", "ownfree.p3", "ownfree.p4", "ownfree.p5"] as Key[]).map((k) => (
              <li key={k}>
                <AlertTriangle size={16} aria-hidden /> <span>{t(k)}</span>
              </li>
            ))}
          </ul>
        </>
      );
      actions = (
        <button className="btn primary grow" onClick={p.onFree}>
          <Sparkles size={20} /> {t("ownfree.go")}
        </button>
      );
      break;
    case "key":
      content = (
        <>
          <h1 className="display">{t("ownkey.title")}</h1>
          <p className="muted">{t("ownkey.lead")}</p>
          <ol className="tut-steps small">
            {(["ownkey.s1", "ownkey.s2", "ownkey.s3"] as Key[]).map((k) => (
              <li key={k} className="selectable">
                {t(k)}
              </li>
            ))}
          </ol>
          <p className="faint small">{t("ownkey.safe")}</p>
        </>
      );
      actions = (
        <button className="btn primary grow" onClick={p.onKey}>
          <KeyRound size={20} /> {t("ownkey.open")}
        </button>
      );
      break;
  }
  return (
    <>
      <div className="tut-page-body" key={p.page} aria-live="polite">
        {content}
      </div>
      <div className="row tut-actions">
        {p.backBtn(p.onBack)}
        {actions}
      </div>
    </>
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
