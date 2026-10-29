/** The result screen after a lesson or test: score, XP, energy, badges, placement summary (split out of Session.tsx, ADR-036). */
import { Check, Flame, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { BookBite } from "../../components/BookBite";
import { BadgeIcon } from "../../components/visuals";
import { badgeById } from "../../core/badges";
import { totalEnergy } from "../../core/energy";
import { rankFor } from "../../core/scoring";
import type { Session, SessionResult } from "../../core/types";
import { db } from "../../data/db";
import { type Key, locale, useT } from "../../i18n";
import { formatTokens } from "../../ai/usage";


export function Congrats({ session, result, onClose }: { session: Session; result: SessionResult | null; onClose: () => void }) {
  const t = useT();
  const [placement, setPlacement] = useState<{ level: string; strengths: string[]; gaps: string[]; known?: string[] } | null>(null);
  const [final, setFinal] = useState<{ score: number; total: number; weak: string[] } | null>(null);
  useEffect(() => {
    if (session.kind === "placement" && result) db.skillsets.get(session.skillsetId).then((s) => s?.placement && setPlacement(s.placement));
    if (session.kind === "final" && result) db.skillsets.get(session.skillsetId).then((s) => s?.final && setFinal(s.final));
  }, [session, result]);
  if (!result) {
    return (
      <div className="preparing">
        <BookBite size={150} />
      </div>
    );
  }
  const acc = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  return (
    <div className="screen" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div className="congrats" role="status">
        <div className="check-badge">
          <div>
            <Check size={44} strokeWidth={3} />
          </div>
        </div>
        <h1 className="display" style={{ fontSize: 28 }}>
          {t("done.title")}
        </h1>
        <p style={{ opacity: 0.8, maxWidth: 280 }}>
          {session.kind === "placement" ? t("done.placement") : session.kind === "final" ? t("final.title") : t("done.lesson", { title: session.lesson?.title ?? "" })}
        </p>
        <div className="result-grid">
          <div>
            <div className="v">+{result.xp}</div>
            <div className="k">XP</div>
          </div>
          <div>
            <div className="v">{result.total ? `${acc}%` : "—"}</div>
            <div className="k">{t("done.correct")}</div>
          </div>
          <div>
            <div className="v">
              <Flame size={18} style={{ verticalAlign: -2 }} /> {result.streak}
            </div>
            <div className="k">{t("done.streak")}</div>
          </div>
        </div>
        {placement && (
          <div className="placement-box">
            <p className="bold">{t("done.level", { level: t(`level.${placement.level}` as Key) })}</p>
            {placement.strengths.length > 0 && <p className="small">{t("done.strong", { list: placement.strengths.join(", ") })}</p>}
            {placement.gaps.length > 0 && <p className="small">{t("done.gaps", { list: placement.gaps.join(", ") })}</p>}
            {!!placement.known?.length && <p className="small">{t("done.known", { n: placement.known.length })}</p>}
          </div>
        )}
        {final && (
          <div className="placement-box">
            <p className="bold">{t("done.final", { score: final.score, total: final.total, p: final.total ? Math.round((final.score / final.total) * 100) : 0 })}</p>
            {final.weak.length > 0 && <p className="small">{t("done.finalWeak", { list: final.weak.join(", ") })}</p>}
          </div>
        )}
        {session.lesson?.usage && (
          <p className="small" style={{ opacity: 0.75 }}>
            {t("usage.lesson", { tokens: formatTokens(session.lesson.usage.input + session.lesson.usage.output, locale()), req: t("usage.requests", { n: session.lesson.usage.requests }) })}
          </p>
        )}
        {result.checkpoint && (
          <div className="placement-box">
            <p className="bold">{t("done.checkpoint", { score: result.checkpoint.correct, total: result.checkpoint.total })}</p>
          </div>
        )}
        {!!result.energy?.length && (
          <div className="placement-box energy-box">
            <p className="bold">
              <Zap size={16} style={{ verticalAlign: -2 }} /> {t("done.energy", { n: totalEnergy(result.energy) })}
            </p>
            <p className="small">{result.energy.map((g) => `+${g.amount} ${t(`energy.r.${g.reason}` as Key)}`).join(" · ")}</p>
          </div>
        )}
        {result.repaired && <p className="bold">{t("done.repaired", { n: result.streak })}</p>}
        {result.levelUp && <p className="bold">{t("done.levelUp", { n: result.levelUp, rank: t(`rank.${rankFor(result.levelUp)}` as Key) })}</p>}
        {result.badges.length > 0 && (
          <div className="row" style={{ flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
            {result.badges.map((id) => {
              const b = badgeById(id);
              return b ? (
                <span key={id} className="pill badge-pill">
                  <BadgeIcon name={b.icon} size={15} /> {t(`badge.${id}.t` as Key)}
                </span>
              ) : null;
            })}
          </div>
        )}
        <button className="btn" onClick={onClose}>
          {t("common.close")}
        </button>
      </div>
    </div>
  );
}
