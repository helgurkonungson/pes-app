/**
 * First run (1.1.0): welcome → a few words about you (name optional) → a 30-second sample of the
 * main feature (an open answer checked by AI, shown on a ready example, no AI or network needed)
 * → how to switch AI on: Chompbook Pro trial, a free AI, or later. Your own API key sits behind
 * "I have my own key" for those who want it; every option stays in Settings → AI provider.
 */
import { ArrowRight, Check, ChevronDown, Crown, KeyRound, Sparkles, Upload } from "lucide-react";
import { useState } from "react";
import { AiError, testKey } from "../ai/client";
import { setApiKey } from "../ai/key";
import { useBackupRestore } from "../components/FilePickers";
import { FreeAiCard, FreeAiSheet } from "../components/FreeAi";
import { LanguageButton } from "../components/LanguagePicker";
import { ExtLink, MinutesPicker, toast } from "../components/ui";
import { HeroBg, Rings, ScoreRing } from "../components/visuals";
import { updateProfile } from "../data/db";
import { useLang, useT } from "../i18n";
import { useNav } from "../nav/store";
import { proPurchasable } from "../pro/purchases";
import { aiErrorDetail, aiErrorText } from "./aiText";

const STEPS = 4;

/** Step 3: a ready example of the main feature — the learner's own words, checked like a tutor would. */
function Demo({ revealed, onReveal }: { revealed: boolean; onReveal: () => void }) {
  const t = useT();
  return (
    <div className="stack-lg demo" data-testid="onb-demo">
      <div>
        <p className="tiny muted" style={{ marginBottom: 4 }}>
          {t("onb.demo.kicker")}
        </p>
        <h1 className="display">{t("onb.demo.title")}</h1>
      </div>
      <div className="card tight">
        <p className="tiny muted" style={{ marginBottom: 4 }}>
          {t("onb.demo.qLabel")}
        </p>
        <p className="bold">{t("onb.demo.q")}</p>
      </div>
      <div className="card tight your-answer">
        <p className="tiny muted" style={{ marginBottom: 4 }}>
          {t("onb.demo.aLabel")}
        </p>
        <p className="small">{t("onb.demo.a")}</p>
      </div>
      {revealed ? (
        <>
          <div className="card row" style={{ gap: 16 }}>
            <ScoreRing score={8} />
            <div className="grow">
              <p className="tiny muted">{t("open.aiScore")}</p>
              <p className="bold">{t("onb.demo.verdict")}</p>
            </div>
          </div>
          <div className="card tight">
            <p className="small bold" style={{ color: "var(--good)", marginBottom: 6 }}>
              {t("open.worked")}
            </p>
            <p className="small">{t("onb.demo.worked")}</p>
            <p className="small bold" style={{ color: "var(--warn)", margin: "10px 0 6px" }}>
              {t("open.improve")}
            </p>
            <p className="small">{t("onb.demo.improve")}</p>
          </div>
          <p className="faint small">{t("onb.demo.note")}</p>
        </>
      ) : (
        <button className="btn dark block" onClick={onReveal}>
          <Sparkles size={18} /> {t("onb.demo.reveal")}
        </button>
      )}
    </div>
  );
}

export function Onboarding() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const setLang = useLang((s) => s.set);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(15);
  const [revealed, setRevealed] = useState(false);
  const [ownKey, setOwnKey] = useState(false);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gemini, setGemini] = useState(false);
  const restore = useBackupRestore();
  const pro = proPurchasable();

  const profileDone = () => ({ name: name.trim() || t("onb.defaultName"), dailyGoal: goal, onboarded: true, uiLanguage: lang, tutorial: "pending" as const });

  const finish = async (withKey: boolean) => {
    setBusy(true);
    setError(null);
    try {
      if (withKey) {
        await testKey(key.trim());
        await setApiKey(key.trim());
      }
      await updateProfile(profileDone());
      toast(withKey ? t("onb.keySaved") : t("onb.noKey"));
    } catch (e) {
      setError(e instanceof AiError ? [aiErrorText(e, t), aiErrorDetail(e, t)].filter(Boolean).join("\n\n") : t("onb.keyFailed"));
    } finally {
      setBusy(false);
    }
  };

  /** Pro: the app opens with the plans on top; the first-run tutorial waits until they are closed. */
  const tryPro = async () => {
    useNav.getState().push({ name: "pro" });
    await updateProfile(profileDone());
  };

  return (
    <main className="onb">
      <div className="dots" role="img" aria-label={t("onb.stepOf", { i: step + 1, n: STEPS })}>
        {Array.from({ length: STEPS }, (_, i) => (
          <i key={i} className={i === step ? "on" : ""} />
        ))}
      </div>

      {step === 0 && (
        <>
          <div className="onb-lang">
            <LanguageButton value={lang} onChange={setLang} />
          </div>
          <div className="hero-art">
            <HeroBg hue={174} name="P" big />
            <div style={{ position: "relative", zIndex: 1 }}>
              <Rings values={[0.82, 0.6, 0.38]} size={170} stroke={16} />
            </div>
          </div>
          <div className="stack-lg">
            <h1 className="display">
              {t("onb.title1")}
              <br />
              <span className="accent">{t("onb.title2")}</span>
            </h1>
            <p className="muted">{t("onb.lead")}</p>
          </div>
          <div className="stack onb-actions">
            <button className="btn primary block" onClick={() => setStep(1)}>
              {t("onb.start")} <ArrowRight size={20} />
            </button>
            <button className="btn ghost block" onClick={restore.open}>
              <Upload size={18} /> {t("onb.restore")}
            </button>
            {restore.input}
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <div className="stack-lg" style={{ flex: 1 }}>
            <h1 className="display">{t("onb.aboutYou")}</h1>
            <div className="field">
              <label htmlFor="name">{t("onb.nameOptional")}</label>
              <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("onb.namePh")} autoComplete="given-name" maxLength={40} />
            </div>
            <div className="field">
              <span className="label">{t("onb.goal")}</span>
              <MinutesPicker value={goal} onChange={setGoal} label={t("onb.goal")} />
              <p className="faint small">{t("onb.goalHint")}</p>
            </div>
          </div>
          <div className="row onb-actions">
            <button className="btn dark" onClick={() => setStep(0)}>
              {t("common.back")}
            </button>
            <button className="btn primary grow" onClick={() => setStep(2)}>
              {t("common.continue")} <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ flex: 1 }}>
            <Demo revealed={revealed} onReveal={() => setRevealed(true)} />
          </div>
          <div className="row onb-actions">
            <button className="btn dark" onClick={() => setStep(1)}>
              {t("common.back")}
            </button>
            <button className="btn primary grow" onClick={() => setStep(3)}>
              {t("common.continue")} <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="stack-lg" style={{ flex: 1 }}>
            <h1 className="display">{t("onb.aiTitle")}</h1>
            <p className="muted">{t("onb.aiLead")}</p>
            {pro && (
              <button className="onb-choice pro" onClick={tryPro} disabled={busy}>
                <span className="icon-dot accent">
                  <Crown size={22} />
                </span>
                <span className="grow">
                  <b>{t("onb.proTitle")}</b>
                  <span>{t("onb.proHint")}</span>
                </span>
                <ArrowRight size={20} aria-hidden />
              </button>
            )}
            <FreeAiCard onClick={() => setGemini(true)} />
            <p className="faint small">{t("onb.noAiNote")}</p>
            <button className="disclosure small" aria-expanded={ownKey} onClick={() => setOwnKey((v) => !v)}>
              <KeyRound size={16} /> {t("onb.ownKey")} <ChevronDown size={16} className="disc-chev" aria-hidden />
            </button>
            {ownKey && (
              <div className="stack">
                <div className="field">
                  <label htmlFor="key">{t("settings.key")}</label>
                  <input id="key" className="input selectable" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-…" autoComplete="off" autoCapitalize="off" spellCheck={false} />
                  <p className="faint small">
                    {t("onb.keyWhere")} <ExtLink href="https://console.anthropic.com/settings/keys">console.anthropic.com</ExtLink>
                  </p>
                </div>
                {error && (
                  <div className="error-box" role="alert">
                    {error}
                  </div>
                )}
                <button className="btn dark block" onClick={() => finish(true)} disabled={busy || key.trim().length < 20}>
                  {busy ? (
                    t("common.checking")
                  ) : (
                    <>
                      <Check size={20} /> {t("onb.saveStart")}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          <div className="stack onb-actions">
            <button className="btn primary block" onClick={() => finish(false)} disabled={busy}>
              {t("onb.later")}
            </button>
          </div>
        </>
      )}
      {gemini && (
        <FreeAiSheet
          onClose={() => setGemini(false)}
          onDone={() => {
            setGemini(false);
            void updateProfile(profileDone());
          }}
        />
      )}
    </main>
  );
}
