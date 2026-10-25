/** Settings → Lesson reports: what the learner reported, with sending to the developer. */
import { useLiveQuery } from "dexie-react-hooks";
import { Flag, Send, Trash2 } from "lucide-react";
import { Empty, TopBar } from "../components/ui";
import { db } from "../data/db";
import { REPORT_URL, deliver, shareReports } from "../data/reports";
import { type Key, locale, useT } from "../i18n";

export function Reports() {
  const t = useT();
  const rows = useLiveQuery(() => db.reports.orderBy("id").reverse().toArray(), []);
  const unsent = rows?.filter((r) => !r.sentAt) ?? [];

  const send = async () => {
    if (REPORT_URL && (await deliver(unsent))) return;
    await shareReports(unsent.length ? unsent : (rows ?? []), t("report.shareTitle"));
  };

  return (
    <div className="screen with-cta">
      <TopBar title={t("reports.title")} />
      <div className="stack-lg">
        <p className="muted small">{t("reports.hint")}</p>
        {rows && rows.length === 0 && <Empty icon={<Flag size={34} />} title={t("reports.empty")} />}
        <div className="stack">
          {rows?.map((r) => (
            <div key={r.id} className="list-card log-row">
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="small muted">
                  {new Date(r.at).toLocaleString(locale())} · {r.sentAt ? t("reports.sent") : t("reports.notSent")}
                </div>
                <div className="small bold">{t(`report.reason.${r.reason}` as Key)}</div>
                {r.lessonTitle && <div className="small ellipsis">{r.lessonTitle}</div>}
                {r.comment && <div className="tiny faint selectable log-msg">{r.comment}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
      {rows && rows.length > 0 && (
        <div className="cta-bar">
          <button className="btn dark" onClick={() => db.reports.clear()} aria-label={t("reports.clear")}>
            <Trash2 size={18} /> {t("reports.clear")}
          </button>
          <button className="btn primary" onClick={send}>
            <Send size={18} /> {t("report.shareNow")}
          </button>
        </div>
      )}
    </div>
  );
}
