import { ChartColumn, House, LayoutGrid, Settings } from "lucide-react";
import type { Key } from "../i18n";
import { useT } from "../i18n";
import { type Tab, useNav } from "../nav/store";

const TABS: { id: Tab; label: Key; Icon: typeof House }[] = [
  { id: "home", label: "tab.home", Icon: House },
  { id: "skillsets", label: "tab.skillsets", Icon: LayoutGrid },
  { id: "progress", label: "tab.progress", Icon: ChartColumn },
  { id: "settings", label: "tab.settings", Icon: Settings },
];

export function TabBar() {
  const { tab, setTab } = useNav();
  const t = useT();
  return (
    <nav className="tabbar" aria-label={t("tab.nav")}>
      {TABS.map((x) => (
        <button key={x.id} className={`tab${tab === x.id ? " on" : ""}`} onClick={() => setTab(x.id)} aria-current={tab === x.id ? "page" : undefined}>
          <span className="tab-icon">
            <x.Icon size={22} strokeWidth={2.1} />
          </span>
          {t(x.label)}
        </button>
      ))}
    </nav>
  );
}
