/** Settings → Error log: what went wrong on this phone, with a button to send it to the developer. */
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { useLiveQuery } from "dexie-react-hooks";
import { Bug, Send, Trash2 } from "lucide-react";
import { Empty, toast, TopBar } from "../components/ui";
import { db } from "../data/db";
import { logText } from "../data/logs";
import { locale, useT } from "../i18n";

export function Logs() {
  const t = useT();
  const rows = useLiveQuery(() => db.logs.orderBy("id").reverse().limit(200).toArray(), []);

  const send = async () => {
    const text = await logText();
    try {
      if (Capacitor.isNativePlatform()) await Share.share({ title: t("logs.title"), text, dialogTitle: t("logs.send") });
      else if (navigator.share) await navigator.share({ title: t("logs.title"), text });
      else {
        await navigator.clipboard.writeText(text);
        toast(t("logs.copied"));
      }
    } catch {
      /* share sheet closed */
    }
  };

  return (
    <div className="screen with-cta">
      <TopBar title={t("logs.title")} />
      <div className="stack-lg">
        <p className="muted small">{t("logs.hint")}</p>
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
          <button className="btn primary" onClick={send}>
            <Send size={18} /> {t("logs.send")}
          </button>
        </div>
      )}
    </div>
  );
}
