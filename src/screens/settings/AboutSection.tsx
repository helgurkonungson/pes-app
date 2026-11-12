/** Settings → About: version and the store page (updates come from the store), tutorial, reports, error log (ADR-036). */
import { Bug, Flag, GraduationCap, RefreshCw } from "lucide-react";
import { useTutorial } from "../../app/tutorialStore";
import { APP_VERSION, STORE, STORE_URL } from "../../build";
import { Group, MenuRow, openExternal, SectionLabel } from "../../components/ui";
import { useT } from "../../i18n";
import { useNav } from "../../nav/store";

export function AboutSection() {
  const t = useT();

  return (
    <>
      <section className="stack">
        <SectionLabel>{t("settings.about")}</SectionLabel>
        <Group>
          <MenuRow icon={<RefreshCw size={20} />} label={t("settings.version")} hint={t(STORE === "galaxy" ? "settings.updatesGalaxy" : "settings.updatesPlay")} value={`v${APP_VERSION}`} onClick={() => openExternal(STORE_URL)} />
          <MenuRow icon={<GraduationCap size={20} />} label={t("settings.tutorial")} onClick={() => useTutorial.getState().show()} />
          <MenuRow icon={<Flag size={20} />} label={t("settings.reports")} onClick={() => useNav.getState().push({ name: "reports" })} />
          <MenuRow icon={<Bug size={20} />} label={t("settings.logs")} onClick={() => useNav.getState().push({ name: "logs" })} />
        </Group>
      </section>
      <p className="faint tiny center">{t("settings.footer", { v: APP_VERSION })}</p>
    </>
  );
}
