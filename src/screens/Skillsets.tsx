import { Clock, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { HeroBg } from "../components/visuals";
import { useSkillsetSummaries } from "../data/hooks";
import { useNav } from "../nav/store";

type Filter = "all" | "progress" | "new";

export function Skillsets() {
  const list = useSkillsetSummaries();
  const push = useNav((s) => s.push);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const shown = useMemo(() => {
    let l = list ?? [];
    if (filter === "progress") l = l.filter((x) => x.s.placement);
    if (filter === "new") l = l.filter((x) => !x.s.placement);
    const q = query.trim().toLowerCase();
    if (q) l = l.filter((x) => x.s.name.toLowerCase().includes(q) || x.s.goal.toLowerCase().includes(q));
    return l;
  }, [list, filter, query]);

  return (
    <div className="screen with-tabbar">
      <div className="topbar">
        <h1 style={{ textAlign: "left", fontSize: 26, fontWeight: 700 }}>Skillsets</h1>
        <button className="round-btn" aria-label="Search" onClick={() => setSearching((v) => !v)}>
          <Search size={20} />
        </button>
      </div>
      <div className="stack-lg">
        {searching && <input className="input" autoFocus placeholder="Search skillsets" value={query} onChange={(e) => setQuery(e.target.value)} />}
        <div className="chips">
          {(
            [
              ["all", "All"],
              ["progress", "In progress"],
              ["new", "Not started"],
            ] as [Filter, string][]
          ).map(([id, label]) => (
            <button key={id} className={`chip${filter === id ? " on" : ""}`} onClick={() => setFilter(id)}>
              {label}
            </button>
          ))}
        </div>
        <div className="grid-2">
          {shown.map((x) => (
            <button key={x.s.id} className="tile" onClick={() => push({ name: "skillset", id: x.s.id })}>
              <HeroBg hue={x.s.hue} name={x.s.name} />
              <h3>{x.s.name}</h3>
              <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                <span className="pill">
                  <Clock size={12} /> {x.s.minutes} min
                </span>
                <span className="pill dark">{x.s.placement ? `${Math.round(x.coverage * 100)}%` : "New"}</span>
              </div>
            </button>
          ))}
          <button className="tile add" onClick={() => push({ name: "skillsetEdit" })}>
            <Plus size={30} />
            <span className="bold">New skillset</span>
          </button>
        </div>
      </div>
    </div>
  );
}
