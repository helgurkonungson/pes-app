import { ArrowRight, Check, KeyRound } from "lucide-react";
import { useState } from "react";
import { AiError, testKey } from "../ai/client";
import { setApiKey } from "../ai/key";
import { HeroBg, Rings } from "../components/visuals";
import { MinutesPicker, toast } from "../components/ui";
import { updateProfile } from "../data/db";

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(15);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async (withKey: boolean) => {
    setBusy(true);
    setError(null);
    try {
      if (withKey) {
        await testKey(key.trim());
        await setApiKey(key.trim());
      }
      await updateProfile({ name: name.trim() || "Learner", dailyGoal: goal, onboarded: true });
      toast(withKey ? "Key saved. Let's create your first skillset!" : "You can add your key later in Settings.");
    } catch (e) {
      setError(e instanceof AiError ? e.message : "Couldn't check the key. Check your connection.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="onb">
      <div className="dots" aria-hidden>
        {[0, 1, 2].map((i) => (
          <i key={i} className={i === step ? "on" : ""} />
        ))}
      </div>

      {step === 0 && (
        <>
          <div className="hero-art">
            <HeroBg hue={174} name="P" big />
            <div style={{ position: "relative", zIndex: 1 }}>
              <Rings values={[0.82, 0.6, 0.38]} size={190} stroke={18} />
            </div>
          </div>
          <div className="stack-lg">
            <h1 className="display">
              Learn anything
              <br />
              <span className="accent">in daily portions</span>
            </h1>
            <p className="muted">Add your books, articles and notes. Pick 5, 15, 30 or 60 minutes a day. Each session reviews, teaches, quizzes and checks your thinking.</p>
          </div>
          <button className="btn primary block" onClick={() => setStep(1)}>
            Get started <ArrowRight size={20} />
          </button>
        </>
      )}

      {step === 1 && (
        <>
          <div className="stack-lg" style={{ flex: 1 }}>
            <h1 className="display">About you</h1>
            <div className="field">
              <label htmlFor="name">Your name</label>
              <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Oleg" autoComplete="given-name" />
            </div>
            <div className="field">
              <label>Daily goal</label>
              <MinutesPicker value={goal} onChange={setGoal} />
              <p className="faint small">You can choose a different portion every session.</p>
            </div>
          </div>
          <button className="btn primary block" onClick={() => setStep(2)} disabled={!name.trim()}>
            Continue <ArrowRight size={20} />
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div className="stack-lg" style={{ flex: 1 }}>
            <div className="icon-dot accent" style={{ width: 56, height: 56 }}>
              <KeyRound size={26} />
            </div>
            <h1 className="display">Your AI key</h1>
            <p className="muted">
              PES writes lessons and checks your answers with Claude, using your own API key. The key stays in your phone's secure storage and is sent only to Anthropic.
            </p>
            <div className="field">
              <label htmlFor="key">Claude API key</label>
              <input id="key" className="input selectable" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-…" autoComplete="off" autoCapitalize="off" spellCheck={false} />
              <p className="faint small">
                Get one at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">console.anthropic.com</a>. Usage is billed to your Anthropic account.
              </p>
            </div>
            {error && <div className="error-box">{error}</div>}
          </div>
          <div className="stack">
            <button className="btn primary block" onClick={() => finish(true)} disabled={busy || key.trim().length < 20}>
              {busy ? "Checking…" : (
                <>
                  <Check size={20} /> Save and start
                </>
              )}
            </button>
            <button className="btn ghost block" onClick={() => finish(false)} disabled={busy}>
              Skip for now
            </button>
          </div>
        </>
      )}
    </div>
  );
}
