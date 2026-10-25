/** Neutral age screen (ADR-023), shown once before connecting an AI service. */
import { useState } from "react";
import { type AgeGroup, ageGroupFromYear, birthYears } from "../core/age";
import { updateProfile } from "../data/db";
import { useT } from "../i18n";

/** Neutral age screen: a year picker with no hint of the "right" answer. */
export function AgeGate({ onDone }: { onDone: (g: AgeGroup) => void }) {
  const t = useT();
  const [year, setYear] = useState("");
  return (
    <div className="stack-lg">
      <p className="muted">{t("age.lead")}</p>
      <div className="field">
        <label htmlFor="birth-year">{t("age.year")}</label>
        <select id="birth-year" className="select" value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">—</option>
          {birthYears().map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <p className="faint small">{t("age.private")}</p>
      <button
        className="btn primary block"
        disabled={!year}
        onClick={async () => {
          const g = ageGroupFromYear(Number(year));
          await updateProfile({ ageGroup: g });
          onDone(g);
        }}
      >
        {t("common.continue")}
      </button>
    </div>
  );
}

export function AgeBlocked({ onClose }: { onClose: () => void }) {
  const t = useT();
  return (
    <div className="stack-lg">
      <p>{t("age.blocked")}</p>
      <button className="btn primary block" onClick={onClose}>
        {t("common.close")}
      </button>
    </div>
  );
}

