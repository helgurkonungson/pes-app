/**
 * Chompbook Pro — built-in AI with no setup. A placeholder until payments exist: it explains
 * what Pro will be and offers the free AI meanwhile (ADR-031).
 */
import { Check, Crown, Sparkles } from "lucide-react";
import { useState } from "react";
import { FreeAiSheet } from "../components/FreeAi";
import { TopBar } from "../components/ui";
import { type Key, useT } from "../i18n";
import { useNav } from "../nav/store";

export function Pro() {
  const t = useT();
  const pop = useNav((s) => s.pop);
  const [free, setFree] = useState(false);
  return (
    <div className="screen with-cta">
      <TopBar title={t("pro.title")} />
      <div className="stack-lg">
        <div className="pro-hero" aria-hidden>
          <Crown size={56} />
        </div>
        <p>{t("pro.lead")}</p>
        <ul className="gemini-list">
          {(["pro.f1", "pro.f2", "pro.f3"] as Key[]).map((k) => (
            <li key={k}>
              <Check size={18} aria-hidden /> <span>{t(k)}</span>
            </li>
          ))}
        </ul>
        <div className="banner small" role="note" data-testid="pro-soon">
          <span className="grow">{t("pro.soon")}</span>
        </div>
      </div>
      <div className="cta-bar">
        <button className="btn primary block" onClick={() => setFree(true)}>
          <Sparkles size={20} /> {t("pro.free")}
        </button>
      </div>
      {free && (
        <FreeAiSheet
          onClose={() => setFree(false)}
          onDone={() => {
            setFree(false);
            pop();
          }}
        />
      )}
    </div>
  );
}
