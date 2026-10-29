/** Settings → Error log: what went wrong on this phone, with a button to send it to the developer (ADR-033). */
import { useLiveQuery } from "dexie-react-hooks";
import { Bug, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { Empty, toast, Toggle, TopBar } from "../components/ui";
import { db } from "../data/db";
import { useProfile } from "../data/hooks";
import { canSendLogs, sendLogsNow, setAutoReports } from "../data/logSend";
import { logText } from "../data/logs";
import { locale, useT } from "../i18n";
import { shareText } from "../native/share";

export function Logs() {
  const t = useT();
  const rows = useLiveQuery(() => db.logs.orderBy("id").reverse().limit(200).toArray(), []);
  const profile = useProfile();
  const [busy, setBusy] = useState(false);

  /** Without an endpoint (or when it can't be reached) the journal goes through the share sheet. */
  const share = async () => {
    if ((await shareText(t("logs.title"), await logText())) === "copied") toast(t("logs.copied"));
  };

  const send = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (canSendLogs() && (await sendLogsNow())) toast(t("logs.sent"));
      else await share();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen with-cta">
      <TopBar title={t("logs.title")} />
      <div className="stack-lg">
        <p className="muted small">{t("logs.hint")}</p>
        {canSendLogs() && profile && (
          <div className="card stack">
            <div className="row-between">
              <span className="bold">{t("logs.auto")}</span>
              <Toggle id="logs-auto" on={!!profile.autoErrorReports} label={t("logs.auto")} onChange={(on) => void setAutoReports(on)} />
            </div>
            <p className="muted small">{t("logs.autoHint")}</p>
          </div>
        )}
        {rows && rows.length === 0 && <Empty icon={<Bug size={34} />} title={t("logs.empty")} />}
        <div className="stack">
          {rows?.map((r) => (
            <div key={r.id} className="list-card log-row">
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="small muted">
                  {new Date(r.at).toLocaleString(locale())} · {r.kind} · v{r.version}
                </div>
                <div className="small selectable log-msg">{r.message}</div>
                {r.detail && <div className="tiny faint selectable log-msg">{r.detail}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
      {rows && rows.length > 0 && (
        <div className="cta-bar">
          <button className="btn dark" onClick={() => db.logs.clear()} aria-label={t("logs.clear")}>
            <Trash2 size={18} /> {t("logs.clear")}
          </button>
          <button className="btn primary" onClick={send} disabled={busy}>
            <Send size={18} /> {t("logs.send")}
          </button>
        </div>
      )}
    </div>
  );
}
