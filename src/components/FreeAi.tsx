/**
 * Connecting a free AI service with as few steps as possible (ADR-021, ADR-023):
 * a neutral age screen once (only the band is kept), then a list of free services the
 * learner's age allows. Gemini creates its key automatically; Groq, Mistral and OpenRouter
 * open their key page inside the app and pick the copied key from the clipboard.
 */
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { Check, ChevronRight, ExternalLink, ShieldAlert, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { AiError, testKey } from "../ai/client";
import { FREE_CONSENT_VERSION, FREE_PROVIDERS, type FreeProvider, freeProvider } from "../ai/freeProviders";
import { setApiKey } from "../ai/key";
import { pickDefaultModel, PROVIDERS } from "../ai/providers";
import { meetsMinAge } from "../core/age";
import { AgeBlocked, AgeGate } from "./AgeGate";
import type { ProviderId } from "../core/types";
import { getProfile, updateProfile } from "../data/db";
import { useProfile } from "../data/hooks";
import { type Key, useT } from "../i18n";
import { googleSignInAvailable } from "../native/googleAuth";
import { GeminiSetupSheet } from "./GeminiSetup";
import { ExtLink, Sheet, toast } from "./ui";

/** Saves a verified key, makes the provider active and records the consent. */
export async function adoptFreeKey(id: ProviderId, key: string): Promise<void> {
  const models = await testKey(key, id);
  await setApiKey(key, id);
  const p = await getProfile();
  const model = p.providerModels?.[id] || pickDefaultModel(id, models.map((m) => m.id));
  await updateProfile({
    provider: id,
    aiBlock: undefined,
    providerModels: { ...p.providerModels, ...(model ? { [id]: model } : {}) },
    aiConsents: { ...p.aiConsents, [id]: { version: FREE_CONSENT_VERSION, at: new Date().toISOString() } },
  });
}

const NAME = (id: ProviderId) => PROVIDERS[id].name;

/** "Free AI": age screen → list of free services → the chosen connection. */
export function FreeAiSheet({ onClose, onDone, initial }: { onClose: () => void; onDone: () => void; initial?: ProviderId }) {
  const t = useT();
  const profile = useProfile();
  const [pick, setPick] = useState<ProviderId | null>(initial ?? null);
  if (!profile) return null;
  const group = profile.ageGroup;

  if (pick === "gemini") return <GeminiSetupSheet onClose={onClose} onDone={onDone} />;
  if (pick) return <AssistedConnectSheet id={pick} onClose={onClose} onDone={onDone} onBack={initial ? undefined : () => setPick(null)} />;

  return (
    <Sheet title={t("free.title")} onClose={onClose}>
      {!group ? (
        <AgeGate onDone={() => undefined} />
      ) : group === "child" ? (
        <AgeBlocked onClose={onClose} />
      ) : (
        <div className="stack">
          <p className="muted small" style={{ marginBottom: 6 }}>
            {t("free.lead")}
          </p>
          {FREE_PROVIDERS.map((fp) => {
            const ok = meetsMinAge(group, fp.minAge);
            return (
              <button key={fp.id} className="list-card inner" disabled={!ok} onClick={() => setPick(fp.id)} aria-label={`${NAME(fp.id)}. ${t(`free.${fp.id}` as Key)}`}>
                <span className="grow" style={{ textAlign: "left" }}>
                  <span className="bold block">
                    {NAME(fp.id)}
                    {fp.id === "gemini" && <span className="pill accent tiny-pill">{t("free.recommended")}</span>}
                  </span>
                  <span className="small muted block">{t(`free.${fp.id}` as Key)}</span>
                  {!ok && <span className="small block warn-text">{t("free.from18")}</span>}
                </span>
                {ok && <ChevronRight size={20} className="muted" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}

/** Groq / Mistral / OpenRouter: consent → key page in the app → the copied key is checked and saved. */
export function AssistedConnectSheet({ id, onClose, onDone, onBack }: { id: ProviderId; onClose: () => void; onDone: () => void; onBack?: () => void }) {
  const t = useT();
  const profile = useProfile();
  const fp = freeProvider(id) as FreeProvider;
  const [agreed, setAgreed] = useState(false);
  const [parent, setParent] = useState(false);
  const [stage, setStage] = useState<"consent" | "key">("consent");
  const [pasted, setPasted] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => void Browser.removeAllListeners().catch(() => undefined), []);
  if (!profile) return null;
  const group = profile.ageGroup;
  const teen = group === "teen";

  const save = async (raw: string) => {
    const key = fp.keyIn(raw) ?? raw.trim();
    setChecking(true);
    setError(null);
    try {
      await adoptFreeKey(id, key);
      toast(t("free.connected", { name: NAME(id) }));
      onDone();
    } catch (e) {
      setError(e instanceof AiError && e.kind === "network" ? t("gemini.errNetwork") : t("free.badKey", { name: NAME(id) }));
    } finally {
      setChecking(false);
    }
  };

  const pickUp = async () => {
    try {
      const { Clipboard } = await import("@capacitor/clipboard");
      const key = fp.keyIn((await Clipboard.read()).value ?? "");
      if (key) {
        setPasted(key);
        await save(key);
      }
    } catch {
      /* no clipboard access: the field is there */
    }
  };

  const open = async () => {
    setStage("key");
    if (Capacitor.isNativePlatform()) {
      const h = await Browser.addListener("browserFinished", () => {
        void h.remove();
        void pickUp();
      });
      await Browser.open({ url: fp.keyUrl, presentationStyle: "fullscreen" });
    } else window.open(fp.keyUrl, "_blank", "noopener");
  };

  return (
    <Sheet title={t("free.connectTitle", { name: NAME(id) })} onClose={onClose}>
      {!group ? (
        <AgeGate onDone={() => undefined} />
      ) : !meetsMinAge(group, fp.minAge) ? (
        <AgeBlocked onClose={onClose} />
      ) : stage === "consent" ? (
        <div className="stack-lg">
          <p className="muted">{t("free.assistedLead", { name: NAME(id) })}</p>
          <ul className="gemini-list small">
            {(["free.step1", "free.step2", "free.step3"] as Key[]).map((k) => (
              <li key={k}>
                <Check size={16} aria-hidden /> <span>{t(k, { name: NAME(id) })}</span>
              </li>
            ))}
          </ul>
          <div className="banner warn small" role="note">
            <ShieldAlert size={18} aria-hidden />
            <span className="grow">{t(fp.trainsOnFree ? "free.trains" : "free.noTrain", { name: NAME(id) })}</span>
          </div>
          {teen && (
            <label className="check-row">
              <input type="checkbox" checked={parent} onChange={(e) => setParent(e.target.checked)} />
              <span>{t("free.parent")}</span>
            </label>
          )}
          <label className="check-row">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>
              {t("free.agree", { name: NAME(id) })} <ExtLink href={fp.termsUrl}>{t("free.terms", { name: NAME(id) })}</ExtLink>
            </span>
          </label>
          <button className="btn primary block" disabled={!agreed || (teen && !parent)} onClick={() => void open()}>
            <ExternalLink size={20} /> {t("free.openKeys", { name: NAME(id) })}
          </button>
          {onBack && (
            <button className="btn ghost block small" onClick={onBack}>
              {t("common.back")}
            </button>
          )}
        </div>
      ) : (
        <div className="stack-lg">
          <ol className="gemini-howto small">
            <li>{t("free.how1", { name: NAME(id) })}</li>
            <li>{t("free.how2")}</li>
            <li>{t("gemini.how3")}</li>
          </ol>
          <div className="field">
            <label htmlFor="free-key">{t("free.keyLabel", { name: NAME(id) })}</label>
            <input id="free-key" className="input selectable" value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder={PROVIDERS[id].keyPlaceholder} autoComplete="off" autoCapitalize="off" spellCheck={false} />
          </div>
          {error && (
            <div className="error-box" role="alert">
              {error}
            </div>
          )}
          <button className="btn primary block" disabled={checking || pasted.trim().length < 20} onClick={() => void save(pasted)}>
            {checking ? t("common.checking") : t("gemini.saveKey")}
          </button>
          <button className="btn dark block" onClick={() => void open()}>
            <ExternalLink size={20} /> {t("free.openKeys", { name: NAME(id) })}
          </button>
        </div>
      )}
    </Sheet>
  );
}

/** The "Free AI" card shown on the key step of onboarding and in Settings. */
export function FreeAiCard({ onClick }: { onClick: () => void }) {
  const t = useT();
  return (
    <button className="free-ai" onClick={onClick}>
      <Sparkles size={24} aria-hidden />
      <span className="grow">
        <b>{t("free.cta")}</b>
        <span>{t(googleSignInAvailable() ? "free.ctaHintAuto" : "free.ctaHint")}</span>
      </span>
    </button>
  );
}
