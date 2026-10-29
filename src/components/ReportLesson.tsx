/**
 * "Report this lesson" — a small flag in the lesson's top bar (and in a saved lesson's top bar).
 * Required by Google Play's AI-generated content policy and App Store guideline 1.2: learners can
 * flag offensive or wrong AI content without leaving the app. One tap opens a short sheet; the
 * lesson underneath keeps its place, so the flag never gets in the way of studying.
 */
import { Flag } from "lucide-react";
import { useState } from "react";
import { activeProvider, modelOf } from "../ai/providers";
import type { Page } from "../core/flow";
import { nowIso } from "../core/ids";
import { buildReport, COMMENT_MAX, REPORT_REASONS } from "../core/report";
import type { LessonReport, ReportReason, Session } from "../core/types";
import { getProfile } from "../data/db";
import { shareReports, submitReport } from "../data/reports";
import { type Key, useT } from "../i18n";
import { Sheet, toast } from "./ui";
import { APP_VERSION } from "../build";

export function ReportButton({ session, page, text, className }: { session: Session; page?: Page; text?: string; className?: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={`round-btn ghost report-btn${className ? ` ${className}` : ""}`} aria-label={t("report.button")} title={t("report.button")} onClick={() => setOpen(true)} aria-haspopup="dialog">
        <Flag size={18} />
      </button>
      {open && <ReportSheet session={session} page={page} text={text} onClose={() => setOpen(false)} />}
    </>
  );
}

function ReportSheet({ session, page, text, onClose }: { session: Session; page?: Page; text?: string; onClose: () => void }) {
  const t = useT();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [report, setReport] = useState<LessonReport[] | null>(null);

  const send = async () => {
    if (!reason) return;
    setBusy(true);
    try {
      const profile = await getProfile();
      const r = buildReport({ session, page, text, reason, comment, provider: activeProvider(profile), model: modelOf(profile), version: APP_VERSION, at: nowIso() });
      const { id, sent } = await submitReport(r);
      if (sent) {
        toast(t("report.thanks"));
        onClose();
      } else {
        setReport([{ ...r, id }]);
        setSavedId(id);
      }
    } catch {
      toast(t("report.failed"));
    } finally {
      setBusy(false);
    }
  };

  if (savedId !== null && report) {
    return (
      <Sheet title={t("report.saved")} onClose={onClose}>
        <div className="stack-lg">
          <p className="muted">{t("report.savedText")}</p>
          <div className="row">
            <button className="btn dark grow" onClick={onClose}>
              {t("report.later")}
            </button>
            <button
              className="btn primary grow"
              onClick={async () => {
                await shareReports(report, t("report.shareTitle"));
                onClose();
              }}
            >
              {t("report.shareNow")}
            </button>
          </div>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet title={t("report.title")} onClose={onClose}>
      <div className="stack-lg">
        <p className="muted small">{t("report.lead")}</p>
        <div className="choice-list" role="radiogroup" aria-label={t("report.reason")}>
          {REPORT_REASONS.map((r) => (
            <button key={r} role="radio" aria-checked={reason === r} className={`choice${reason === r ? " on" : ""}`} onClick={() => setReason(r)}>
              <span className="radio-dot" aria-hidden />
              <span className="grow">{t(`report.reason.${r}` as Key)}</span>
            </button>
          ))}
        </div>
        <div className="field">
          <label htmlFor="report-comment">{t("report.comment")}</label>
          <textarea id="report-comment" className="textarea short" value={comment} maxLength={COMMENT_MAX} onChange={(e) => setComment(e.target.value)} placeholder={t("report.commentPh")} />
        </div>
        <p className="faint small">{t("report.attach")}</p>
        <div className="row">
          <button className="btn dark grow" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </button>
          <button className="btn primary grow" onClick={send} disabled={!reason || busy}>
            <Flag size={18} /> {t("report.send")}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
