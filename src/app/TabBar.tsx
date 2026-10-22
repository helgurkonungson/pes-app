import { ChartColumn, House, LayoutGrid, Plus, Trophy } from "lucide-react";
import { type Tab, useNav } from "../nav/store";

const TABS: { id: Tab; label: string; Icon: typeof House }[] = [
  { id: "home", label: "Home", Icon: House },
  { id: "skillsets", label: "Skillsets", Icon: LayoutGrid },
  { id: "stats", label: "Statistics", Icon: ChartColumn },
  { id: "rewards", label: "Rewards", Icon: Trophy },
];

export function TabBar() {
  const { tab, setTab, openSheet } = useNav();
  const btn = (t: (typeof TABS)[number]) => (
    <button key={t.id} className={`tab${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)} aria-current={tab === t.id ? "page" : undefined}>
      <t.Icon size={22} strokeWidth={2.2} />
      {t.label}
    </button>
  );
  return (
    <nav className="tabbar" aria-label="Main">
      {btn(TABS[0])}
      {btn(TABS[1])}
      <button className="fab" aria-label="Start a session" onClick={() => openSheet("quickstart")}>
        <Plus size={30} strokeWidth={2.6} />
      </button>
      {btn(TABS[2])}
      {btn(TABS[3])}
    </nav>
  );
}
