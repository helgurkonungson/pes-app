/**
 * The Settings tab (ADR-036): a page of independent sections, each with its own state and sheets
 * in `./settings/`. A new area (Chompbook Pro, an iOS-only row) is a new section or a row inside
 * one, so changes don't collide in one big component.
 */
import { PageTitle } from "../components/ui";
import { useProfile } from "../data/hooks";
import { useT } from "../i18n";
import { AboutSection } from "./settings/AboutSection";
import { AiSection } from "./settings/AiSection";
import { DataSection } from "./settings/DataSection";
import { ProfileSection } from "./settings/ProfileSection";

export function Settings() {
  const t = useT();
  const profile = useProfile();
  if (!profile) return <div className="screen with-tabbar" />;
  return (
    <div className="screen with-tabbar">
      <PageTitle>{t("tab.settings")}</PageTitle>
      <div className="stack-lg">
        <ProfileSection profile={profile} />
        <AiSection profile={profile} />
        <DataSection />
        <AboutSection />
      </div>
    </div>
  );
}
