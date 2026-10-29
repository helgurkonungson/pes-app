/** Settings → About: version and updates (GitHub builds) or the Play page (store builds), tutorial, reports, error log, source (ADR-036). */
import { Bug, Code, Download, Flag, GraduationCap, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useUpdate } from "../../app/App";
import { useTutorial } from "../../app/tutorialStore";
import { APP_REPO, APP_VERSION, PLAY_URL } from "../../build";
import { Group, MenuRow, openExternal, SectionLabel, toast } from "../../components/ui";
import { locale, useT } from "../../i18n";
import { useNav } from "../../nav/store";
import { checkForUpdate, installUpdateSafely, selfUpdateBuild } from "../../update/updater";

export function AboutSection() {
  const t = useT();
  const update = useUpdate();
  const [checking, setChecking] = useState(false);
  const [checkNote, setCheckNote] = useState<string | null>(null);
  const selfUpdate = selfUpdateBuild();

  // the result is shown right in the row (a toast alone is easy to miss)
  const doCheck = async () => {
    setChecking(true);
    setCheckNote(null);
    const time = new Date().toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
    try {
      const info = await checkForUpdate();
      update.set(info);
      const note = info ? t("settings.updateAvailable", { v: info.version }) : t("settings.latestAt", { time });
      setCheckNote(note);
      toast(note);
    } catch {
      setCheckNote(t("settings.githubFailed"));
      toast(t("settings.githubFailed"));
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <section className="stack">
        <SectionLabel>{t("settings.about")}</SectionLabel>
        <Group>
          {selfUpdate ? (
            <MenuRow icon={<RefreshCw size={20} className={checking ? "spin" : undefined} />} label={t("settings.checkUpdates")} hint={checking ? t("settings.checkingUpdates") : (checkNote ?? undefined)} value={`v${APP_VERSION}`} onClick={checking ? undefined : doCheck} />
          ) : (
            <MenuRow icon={<RefreshCw size={20} />} label={t("settings.version")} hint={t("settings.updatesPlay")} value={`v${APP_VERSION}`} onClick={() => openExternal(PLAY_URL)} />
          )}
          {selfUpdate && update.info && <MenuRow icon={<Download size={20} />} label={t("settings.install", { v: update.info.version })} hint={t("settings.installHint")} onClick={() => installUpdateSafely(update.info!)} />}
          <MenuRow icon={<GraduationCap size={20} />} label={t("settings.tutorial")} onClick={() => useTutorial.getState().show()} />
          <MenuRow icon={<Flag size={20} />} label={t("settings.reports")} onClick={() => useNav.getState().push({ name: "reports" })} />
          <MenuRow icon={<Bug size={20} />} label={t("settings.logs")} onClick={() => useNav.getState().push({ name: "logs" })} />
          <MenuRow icon={<Code size={20} />} label={t("settings.source")} value={APP_REPO.split("/")[1]} onClick={() => openExternal(`https://github.com/${APP_REPO}`)} />
        </Group>
      </section>
      <p className="faint tiny center">{t("settings.footer", { v: APP_VERSION })}</p>
    </>
  );
}
