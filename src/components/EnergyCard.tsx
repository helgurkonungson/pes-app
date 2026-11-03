/** Energy balance, freezes and how to earn more (ADR-029): on Progress and in the Home sheet (1.1.0). */
import { Snowflake, Zap } from "lucide-react";
import { canBuyFreeze, ENERGY, FREEZE_COST, MAX_FREEZES } from "../core/energy";
import type { Profile } from "../core/types";
import { buyStreakFreeze } from "../data/repo";
import { useT } from "../i18n";
import { toast } from "./ui";

export function EnergyCard({ profile, open, bare }: { profile: Profile; open?: boolean; bare?: boolean }) {
  const t = useT();
  const energy = profile.energy ?? 0;
  const freezes = profile.freezes ?? 0;
  const full = freezes >= MAX_FREEZES;
  const can = canBuyFreeze(energy, freezes);
  const [m7, m30, m100] = ENERGY.milestones.map(([, e]) => e);
  return (
    <section className={bare ? "stack" : "card stack"} aria-label={t("energy.title")}>
      <div className="row-between">
        <div>
          <p className="small muted bold">{t("energy.title")}</p>
          <div className="big-number energy-number">
            <Zap size={24} aria-hidden /> {energy}
          </div>
        </div>
        <div className="freeze-stock" aria-label={t("energy.freezesOf", { n: freezes, max: MAX_FREEZES })}>
          <p className="small muted bold">{t("energy.freezes")}</p>
          <div className="row" style={{ gap: 4, justifyContent: "flex-end" }} aria-hidden>
            {Array.from({ length: MAX_FREEZES }, (_, i) => (
              <span key={i} className={`frost${i < freezes ? " on" : ""}`}>
                <Snowflake size={18} />
              </span>
            ))}
          </div>
        </div>
      </div>
      <button
        className={`btn ${can ? "primary" : "dark"} block`}
        disabled={!can}
        onClick={async () => {
          if (await buyStreakFreeze()) toast(t("energy.bought"));
        }}
      >
        <Snowflake size={18} /> {full ? t("energy.full") : can ? t("energy.buy", { cost: FREEZE_COST }) : t("energy.need", { n: FREEZE_COST - energy })}
        {can && <Zap size={16} aria-hidden />}
      </button>
      <p className="small muted">{t("energy.what")}</p>
      <p className="small muted">{t("energy.freezeHint")}</p>
      <details className="earn" open={open}>
        <summary className="small bold">{t("energy.how")}</summary>
        <ul className="small muted">
          <li>{t("energy.earn.session", { n: ENERGY.session })}</li>
          <li>{t("energy.earn.review", { n: ENERGY.reviewCorrect })}</li>
          <li>{t("energy.earn.perfect", { n: ENERGY.perfect })}</li>
          <li>{t("energy.earn.test", { a: ENERGY.checkpoint, b: ENERGY.final })}</li>
          <li>{t("energy.earn.streak", { a: m7, b: m30, c: m100 })}</li>
          <li>{t("energy.earn.week", { n: ENERGY.cleanWeek })}</li>
          <li>{t("energy.earn.comeback", { n: ENERGY.comeback })}</li>
        </ul>
      </details>
    </section>
  );
}
