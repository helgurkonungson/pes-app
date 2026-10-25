import { ArrowRight, Check, KeyRound, Upload } from "lucide-react";
import { useState } from "react";
import { AiError, testKey } from "../ai/client";
import { setApiKey } from "../ai/key";
import { useBackupRestore } from "../components/FilePickers";
import { FreeAiCard, FreeAiSheet } from "../components/FreeAi";
import { ExtLink, MinutesPicker, Segmented, toast } from "../components/ui";
import { HeroBg, Rings } from "../components/visuals";
import { updateProfile } from "../data/db";
import { type Lang, useLang, useT } from "../i18n";
import { aiErrorDetail, aiErrorText } from "./Session";

export function Onboarding() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const setLang = useLang((s) => s.set);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(15);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gemini, setGemini] = useState(false);
  const restore = useBackupRestore();

  const finish = async (withKey: boolean) => {
    setBusy(true);
    setError(null);
    try {
      if (withKey) {
        await testKey(key.trim());
        await setApiKey(key.trim());
      }
      await updateProfile({ name: name.trim() || t("onb.defaultName"), dailyGoal: goal, onboarded: true, uiLanguage: lang });
      toast(withKey ? t("onb.keySaved") : t("onb.noKey"));
    } catch (e) {
      setError(e instanceof AiError ? [aiErrorText(e, t), aiErrorDetail(e, t)].filter(Boolean).join("\n\n") : t("onb.keyFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="onb">
      <div className="dots" role="img" aria-label={t("onb.stepOf", { i: step + 1, n: 3 })}>
        {[0, 1, 2].map((i) => (
          <i key={i} className={i === step ? "on" : ""} />
        ))}
      </div>

      {step === 0 && (
        <>
          <Segmented<Lang>
            label={t("settings.language")}
            value={lang}
            onChange={setLang}
            options={[
              { id: "ru", label: "Русский" },
              { id: "en", label: "English" },
            ]}
          />
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
              <label htmlFor="name">{t("onb.name")}</label>
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
            <button className="btn primary grow" onClick={() => setStep(2)} disabled={!name.trim()}>
              {t("common.continue")} <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="stack-lg" style={{ flex: 1 }}>
            <span className="icon-dot accent" style={{ width: 56, height: 56 }}>
              <KeyRound size={26} />
            </span>
            <h1 className="display">{t("onb.keyTitle")}</h1>
            <p className="muted">{t("onb.keyLead")}</p>
            <FreeAiCard onClick={() => setGemini(true)} />
            <div className="card flat tight small">{t("onb.keyOptional")}</div>
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
          </div>
          <div className="stack onb-actions">
            <button className="btn primary block" onClick={() => finish(true)} disabled={busy || key.trim().length < 20}>
              {busy ? (
                t("common.checking")
              ) : (
                <>
                  <Check size={20} /> {t("onb.saveStart")}
                </>
              )}
            </button>
            <button className="btn dark block" onClick={() => finish(false)} disabled={busy}>
              {t("onb.skip")}
            </button>
          </div>
        </>
      )}
      {gemini && (
        <FreeAiSheet
          onClose={() => setGemini(false)}
          onDone={() => {
            setGemini(false);
            void updateProfile({ name: name.trim() || t("onb.defaultName"), dailyGoal: goal, onboarded: true, uiLanguage: lang });
          }}
        />
      )}
    </main>
  );
}
