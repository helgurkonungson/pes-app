/**
 * "Free AI from Google": an explicit consent, then the key is created in the learner's
 * own Google account (one-tap sign-in inside the app) — or, when that can't run, the
 * Google AI Studio key page opens in an in-app browser and the copied key is picked up
 * from the clipboard on return. ADR-021.
 */
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { Check, ExternalLink, Loader2, ShieldAlert, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AiError, testKey } from "../ai/client";
import { http } from "../ai/compat";
import { AI_STUDIO_KEYS, CLOUD_SCOPE, CONSENT_VERSION, createGeminiKey, GEMINI_TERMS, GeminiSetupError, geminiKeyIn, type SetupFailure, type SetupStep } from "../ai/geminiSetup";
import { setApiKey } from "../ai/key";
import { pickDefaultModel } from "../ai/providers";
import { getProfile, updateProfile } from "../data/db";
import { logEvent } from "../data/logs";
import { type Key, useT } from "../i18n";
import { GoogleSignInCancelled, googleAccessToken, googleSignInAvailable } from "../native/googleAuth";
import { ExtLink, Sheet, toast } from "./ui";

type State = { k: "consent" } | { k: "working"; step: SetupStep } | { k: "error"; reason: SetupFailure; detail?: string } | { k: "manual"; checking?: boolean; error?: string };

const STEPS: { id: SetupStep; label: Key }[] = [
  { id: "project", label: "gemini.stepProject" },
  { id: "api", label: "gemini.stepApi" },
  { id: "key", label: "gemini.stepKey" },
  { id: "check", label: "gemini.stepCheck" },
];

/** Saves a working Gemini key and makes Gemini the active provider. */
async function adoptKey(key: string, auto: boolean): Promise<void> {
  const models = await testKey(key, "gemini");
  await setApiKey(key, "gemini");
  const p = await getProfile();
  const model = p.providerModels?.gemini || pickDefaultModel("gemini", models.map((m) => m.id));
  await updateProfile({
    provider: "gemini",
    aiBlock: undefined,
    providerModels: { ...p.providerModels, ...(model ? { gemini: model } : {}) },
    geminiConsent: { version: CONSENT_VERSION, at: new Date().toISOString(), auto },
  });
}

export function GeminiSetupSheet({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const t = useT();
  const [state, setState] = useState<State>({ k: "consent" });
  const [agreed, setAgreed] = useState(false);
  const [pasted, setPasted] = useState("");
  const token = useRef<string | null>(null); // in memory only, for a retry within this sheet
  const auto = googleSignInAvailable();

  const finish = () => {
    toast(t("gemini.done"));
    onDone();
  };

  const runAuto = async () => {
    try {
      if (!token.current) token.current = await googleAccessToken([CLOUD_SCOPE]);
      setState({ k: "working", step: "project" });
      const { key } = await createGeminiKey(token.current, {
        http,
        onStep: (step) => setState({ k: "working", step }),
        testKey: (k) => testKey(k, "gemini"),
      });
      await adoptKey(key, true);
      finish();
    } catch (e) {
      if (e instanceof GoogleSignInCancelled) return setState({ k: "consent" });
      const reason: SetupFailure = e instanceof GeminiSetupError ? e.reason : e instanceof AiError && e.kind === "network" ? "network" : "unknown";
      const detail = e instanceof Error ? e.message : String(e);
      if (reason === "denied") token.current = null;
      void logEvent("ai", `Gemini setup: ${reason}`, detail);
      setState({ k: "error", reason, detail });
    }
  };

  /** Reads the clipboard after the learner comes back from the key page. */
  const pickUp = async (): Promise<boolean> => {
    let text = "";
    try {
      const { Clipboard } = await import("@capacitor/clipboard");
      text = (await Clipboard.read()).value ?? "";
    } catch {
      /* no clipboard access: the field below is still there */
    }
    const key = geminiKeyIn(text);
    if (!key) return false;
    setPasted(key);
    await saveManual(key);
    return true;
  };

  const saveManual = async (raw: string) => {
    const key = geminiKeyIn(raw) ?? raw.trim();
    setState({ k: "manual", checking: true });
    try {
      await adoptKey(key, false);
      finish();
    } catch (e) {
      setState({ k: "manual", error: e instanceof AiError ? t("gemini.manualBad") : t("settings.keyCheckFailed") });
    }
  };

  const openKeyPage = async (then: "pickup" | "retry") => {
    if (then === "pickup") setState({ k: "manual" });
    if (Capacitor.isNativePlatform()) {
      const h = await Browser.addListener("browserFinished", () => {
        void h.remove();
        if (then === "retry") void runAuto();
        else void pickUp();
      });
      await Browser.open({ url: AI_STUDIO_KEYS, presentationStyle: "fullscreen" });
    } else {
      window.open(AI_STUDIO_KEYS, "_blank", "noopener");
    }
  };

  useEffect(() => () => void Browser.removeAllListeners().catch(() => undefined), []);

  const errorText: Record<SetupFailure, Key> = {
    terms: "gemini.errTerms",
    denied: "gemini.errDenied",
    quota: "gemini.errQuota",
    config: "gemini.errConfig",
    network: "gemini.errNetwork",
    unknown: "gemini.errUnknown",
  };

  return (
    <Sheet title={t("gemini.title")} onClose={onClose}>
      {state.k === "consent" && (
        <div className="stack-lg">
          <p className="muted">{t(auto ? "gemini.leadAuto" : "gemini.leadManual")}</p>
          <ul className="gemini-list small">
            {(auto ? (["gemini.what1", "gemini.what2", "gemini.what3", "gemini.what4"] as Key[]) : (["gemini.manual1", "gemini.what3", "gemini.what4"] as Key[])).map((k) => (
              <li key={k}>
                <Check size={16} aria-hidden /> <span>{t(k)}</span>
              </li>
            ))}
          </ul>
          <div className="banner warn small" role="note">
            <ShieldAlert size={18} aria-hidden />
            <span className="grow">
              {t("gemini.freeData")} {t("gemini.region")}
            </span>
          </div>
          <label className="check-row">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>
              {t("gemini.agree")} <ExtLink href={GEMINI_TERMS}>{t("gemini.terms")}</ExtLink>
            </span>
          </label>
          {auto ? (
            <button className="btn primary block" disabled={!agreed} onClick={() => void runAuto()}>
              <Sparkles size={20} /> {t("gemini.signIn")}
            </button>
          ) : (
            <button className="btn primary block" disabled={!agreed} onClick={() => void openKeyPage("pickup")}>
              <ExternalLink size={20} /> {t("gemini.openStudio")}
            </button>
          )}
          {auto && (
            <button className="btn ghost block small" disabled={!agreed} onClick={() => void openKeyPage("pickup")}>
              {t("gemini.manualInstead")}
            </button>
          )}
        </div>
      )}

      {state.k === "working" && (
        <div className="stack-lg" role="status">
          <p className="muted">{t("gemini.working")}</p>
          <ol className="gemini-steps">
            {STEPS.map((s, i) => {
              const cur = STEPS.findIndex((x) => x.id === state.step);
              return (
                <li key={s.id} className={i < cur ? "done" : i === cur ? "now" : ""}>
                  {i < cur ? <Check size={18} aria-hidden /> : i === cur ? <Loader2 size={18} className="spin" aria-hidden /> : <span className="dot" aria-hidden />}
                  <span>{t(s.label)}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {state.k === "error" && (
        <div className="stack-lg">
          <div className="error-box" role="alert">
            {t(errorText[state.reason])}
          </div>
          {state.reason === "terms" && (
            <button className="btn primary block" onClick={() => void openKeyPage("retry")}>
              <ExternalLink size={20} /> {t("gemini.acceptTerms")}
            </button>
          )}
          {(state.reason === "denied" || state.reason === "network" || state.reason === "unknown") && (
            <button className="btn primary block" onClick={() => void runAuto()}>
              {t("common.retry")}
            </button>
          )}
          <button className={`btn ${state.reason === "quota" || state.reason === "config" ? "primary" : "dark"} block`} onClick={() => void openKeyPage("pickup")}>
            {t("gemini.manualInstead")}
          </button>
        </div>
      )}

      {state.k === "manual" && (
        <div className="stack-lg">
          <ol className="gemini-howto small">
            <li>{t("gemini.how1")}</li>
            <li>{t("gemini.how2")}</li>
            <li>{t("gemini.how3")}</li>
          </ol>
          <div className="field">
            <label htmlFor="gemini-key">{t("gemini.keyLabel")}</label>
            <input id="gemini-key" className="input selectable" value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder="AIza…" autoComplete="off" autoCapitalize="off" spellCheck={false} />
          </div>
          {state.error && (
            <div className="error-box" role="alert">
              {state.error}
            </div>
          )}
          <button className="btn primary block" disabled={state.checking || !geminiKeyIn(pasted)} onClick={() => void saveManual(pasted)}>
            {state.checking ? t("common.checking") : t("gemini.saveKey")}
          </button>
          <button className="btn dark block" onClick={() => void openKeyPage("pickup")}>
            <ExternalLink size={20} /> {t("gemini.openStudio")}
          </button>
        </div>
      )}
    </Sheet>
  );
}
