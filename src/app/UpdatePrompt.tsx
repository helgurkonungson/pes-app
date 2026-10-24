/** "A new version is available" pop-up, opened by the first update check of the day. */
import { Download } from "lucide-react";
import { Sheet, toast } from "../components/ui";
import { Markdown } from "../components/visuals";
import { notesForLang, notesPreview } from "../core/updateCheck";
import { useLang, useT } from "../i18n";
import { useNav } from "../nav/store";
import { APP_VERSION, installUpdateSafely } from "../update/updater";
import { useUpdate } from "./App";

export function UpdatePrompt() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const info = useUpdate((s) => s.info);
  const open = useUpdate((s) => s.prompt);
  const close = useUpdate((s) => s.closePrompt);
  // never interrupt a lesson: the pop-up waits until the learner leaves it
  const inLesson = useNav((s) => s.stack[s.stack.length - 1]?.name === "session");
  if (!open || !info || inLesson) return null;
  const notes = notesPreview(notesForLang(info.notes, lang));
  return (
    <Sheet title={t("update.popupTitle")} onClose={close}>
      <div className="stack">
        <p className="muted">{t("update.popupText", { v: info.version, current: APP_VERSION })}</p>
        {notes && (
          <section className="update-notes">
            <h3 className="section-label">{t("update.whatsNew")}</h3>
            <Markdown text={notes} />
          </section>
        )}
        <p className="muted small">{t("update.tap")}</p>
        <div className="row">
          <button className="btn dark grow" onClick={close}>
            {t("update.later")}
          </button>
          <button
            className="btn primary grow"
            onClick={() => {
              close();
              installUpdateSafely(info).catch(() => toast(t("update.failed")));
            }}
          >
            <Download size={18} /> {t("update.install")}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
