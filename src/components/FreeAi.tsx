/**
 * Connecting a free AI service with as few steps as possible (ADR-021, ADR-023, ADR-028):
 * a neutral age screen once (only the band is kept), then one recommended service for this
 * learner — OpenRouter in one tap (sign in, the key comes back by itself) for adults
 * everywhere, Gemini too where Google offers it — and the rest under "Other services".
 */
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { Check, ChevronDown, ChevronRight, ExternalLink, KeyRound, Loader2, ShieldAlert, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { AiError } from "../ai/client";
import { adoptFreeKey } from "../ai/freeKey";
import { type FreeProvider, freeProvider } from "../ai/freeProviders";
import { type OrStatus, useOpenRouter } from "../ai/openrouterConnect";
import { PROVIDERS } from "../ai/providers";
import { meetsMinAge } from "../core/age";
import { freeAiPlan, phoneTimeZone } from "../core/freeAiPlan";
import { AgeBlocked, AgeGate } from "./AgeGate";
import type { ProviderId } from "../core/types";
import { useProfile } from "../data/hooks";
import { type Key, useT } from "../i18n";
import { GeminiSetupSheet } from "./GeminiSetup";
import { ExtLink, Sheet, toast } from "./ui";

export { adoptFreeKey };

const NAME = (id: ProviderId) => PROVIDERS[id].name;

/** "Free AI": age screen → the recommended service (+ "Other services") → the chosen connection. */
export function FreeAiSheet({ onClose, onDone, initial }: { onClose: () => void; onDone: () => void; initial?: ProviderId }) {
  const t = useT();
  const profile = useProfile();
  const [pick, setPick] = useState<ProviderId | null>(initial ?? null);
  const [more, setMore] = useState(false);
  if (!profile) return null;
  const group = profile.ageGroup;
  const back = initial ? undefined : () => setPick(null);

  if (pick === "gemini") return <GeminiSetupSheet onClose={onClose} onDone={onDone} onUseOpenRouter={group === "adult" ? () => setPick("openrouter") : undefined} />;
  if (pick === "openrouter") return <OpenRouterConnectSheet onClose={onClose} onDone={onDone} onBack={back} onManual={() => setPick("openrouter-manual" as ProviderId)} />;
  if ((pick as string) === "openrouter-manual") return <AssistedConnectSheet id="openrouter" onClose={onClose} onDone={onDone} onBack={() => setPick("openrouter")} />;
  if (pick) return <AssistedConnectSheet id={pick} onClose={onClose} onDone={onDone} onBack={back} />;

  const plan = freeAiPlan(group, phoneTimeZone());
  const card = (id: ProviderId, first: boolean) => (
    <button key={id} className="list-card inner" onClick={() => setPick(id)} aria-label={`${NAME(id)}. ${t(`free.${id}` as Key)}`}>
      <span className="grow" style={{ textAlign: "left" }}>
        <span className="bold block">
          {NAME(id)}
          {first && <span className="pill accent tiny-pill">{t("free.recommended")}</span>}
        </span>
        <span className="small muted block">{t(`free.${id}` as Key)}</span>
      </span>
      <ChevronRight size={20} className="muted" aria-hidden />
    </button>
  );

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
          {plan.primary.map((id, i) => card(id, i === 0))}
          {plan.others.length > 0 && (
            <>
              <button className="btn ghost block small" aria-expanded={more} onClick={() => setMore((m) => !m)}>
                {t("free.others")} <ChevronDown size={18} aria-hidden style={{ transform: more ? "rotate(180deg)" : undefined }} />
              </button>
              {more && plan.others.map((id) => card(id, false))}
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}

const OR_ERRORS: Record<Extract<OrStatus, { stage: "error" }>["kind"], Key> = {
  expired: "or.errExpired",
  state: "or.errExpired",
  denied: "or.errDenied",
  network: "or.errNetwork",
  key: "or.errKey",
  unknown: "or.errUnknown",
};

/** OpenRouter in one tap: consent → sign in on openrouter.ai → the app comes back with the key. */
export function OpenRouterConnectSheet({ onClose, onDone, onBack, onManual }: { onClose: () => void; onDone: () => void; onBack?: () => void; onManual: () => void }) {
  const t = useT();
  const profile = useProfile();
  const fp = freeProvider("openrouter") as FreeProvider;
  const { status, start, reset } = useOpenRouter();
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (status.stage === "done") {
      reset();
      onDone();
    }
  }, [status.stage, reset, onDone]);
  // a sign-in left over from an earlier visit is not this one
  useEffect(() => {
    if (useOpenRouter.getState().status.stage !== "connecting") reset();
  }, [reset]);

  if (!profile) return null;
  const group = profile.ageGroup;
  const go = () => void start().catch(() => toast(t("or.errUnknown")));

  return (
    <Sheet title={t("free.connectTitle", { name: "OpenRouter" })} onClose={onClose}>
      {!group ? (
        <AgeGate onDone={() => undefined} />
      ) : !meetsMinAge(group, fp.minAge) ? (
        <AgeBlocked onClose={onClose} />
      ) : status.stage === "idle" || status.stage === "done" ? (
        <div className="stack-lg">
          <p className="muted">{t("or.lead")}</p>
          <ul className="gemini-list small">
            {(["or.what1", "or.what2", "or.limit"] as Key[]).map((k) => (
              <li key={k}>
                <Check size={16} aria-hidden /> <span>{t(k)}</span>
              </li>
            ))}
          </ul>
          <div className="banner warn small" role="note">
            <ShieldAlert size={18} aria-hidden />
            <span className="grow">{t("free.trains", { name: "OpenRouter" })}</span>
          </div>
          <label className="check-row">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>
              {t("free.agree", { name: "OpenRouter" })} <ExtLink href={fp.termsUrl}>{t("free.terms", { name: "OpenRouter" })}</ExtLink>
            </span>
          </label>
          <button className="btn primary block" disabled={!agreed} onClick={go}>
            <Sparkles size={20} /> {t("or.signIn")}
          </button>
          <button className="btn ghost block small" disabled={!agreed} onClick={onManual}>
            <KeyRound size={18} /> {t("or.manual")}
          </button>
          {onBack && (
            <button className="btn ghost block small" onClick={onBack}>
              {t("common.back")}
            </button>
          )}
        </div>
      ) : status.stage === "waiting" ? (
        <div className="stack-lg" role="status">
          <p className="row" style={{ gap: 10, alignItems: "center" }}>
            <Loader2 size={20} className="spin" aria-hidden /> <span className="grow">{t("or.waiting")}</span>
          </p>
          <button className="btn dark block" onClick={go}>
            <ExternalLink size={20} /> {t("or.openAgain")}
          </button>
          <button className="btn ghost block small" onClick={onManual}>
            <KeyRound size={18} /> {t("or.manual")}
          </button>
        </div>
      ) : status.stage === "connecting" ? (
        <div className="stack-lg" role="status">
          <p className="row" style={{ gap: 10, alignItems: "center" }}>
            <Loader2 size={20} className="spin" aria-hidden /> <span className="grow">{t("or.connecting")}</span>
          </p>
        </div>
      ) : (
        <div className="stack-lg">
          <div className="error-box" role="alert">
            {t(OR_ERRORS[status.kind])}
          </div>
          <button className="btn primary block" onClick={go}>
            {t("common.retry")}
          </button>
          <button className="btn dark block" onClick={onManual}>
            <KeyRound size={18} /> {t("or.manual")}
          </button>
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
        <span>{t("free.ctaHint")}</span>
      </span>
    </button>
  );
}
