/**
 * "Send the error report" (1.0): right on a screen that shows an error, so the learner doesn't have
 * to find Settings → Error log. The error on screen is written to the journal first, then the
 * journal goes to the developer (or through the share sheet when the endpoint can't be reached).
 */
import { Send } from "lucide-react";
import { useState } from "react";
import { canSendLogs, sendLogsNow } from "../data/logSend";
import { logEvent, logText } from "../data/logs";
import { useT } from "../i18n";
import { shareText } from "../native/share";
import { toast } from "./ui";

/** Sends the journal; shared by this button and Settings → Error log. */
export async function sendJournal(t: ReturnType<typeof useT>): Promise<void> {
  if (canSendLogs() && (await sendLogsNow())) {
    toast(t("logs.sent"));
    return;
  }
  if ((await shareText(t("logs.title"), await logText())) === "copied") toast(t("logs.copied"));
}

export function SendLogButton({ what, detail, className = "btn dark block" }: { what: string; detail?: string; className?: string }) {
  const t = useT();
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const send = async () => {
    if (state !== "idle") return;
    setState("busy");
    try {
      await logEvent("error", `Shown to the learner: ${what}`, detail);
      await sendJournal(t);
      setState("done");
    } catch {
      setState("idle");
    }
  };
  return (
    <button className={className} onClick={() => void send()} disabled={state !== "idle"}>
      <Send size={18} /> {state === "done" ? t("logs.sentShort") : t("logs.sendError")}
    </button>
  );
}
