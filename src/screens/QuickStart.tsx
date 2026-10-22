import { Play, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { MinutesPicker, Sheet } from "../components/ui";
import { HeroBg } from "../components/visuals";
import { useSkillsetSummaries } from "../data/hooks";
import { useNav } from "../nav/store";

/** The central "+" button: pick a skillset and a portion, then go. */
export function QuickStart() {
  const list = useSkillsetSummaries();
  const { closeSheet, push } = useNav();
  const [selected, setSelected] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(15);

  useEffect(() => {
    if (list?.length && !selected) {
      // suggest the skillset studied least recently
      const pick = [...list].sort((a, b) => a.s.minutesSpent - b.s.minutesSpent)[0];
      setSelected(pick.s.id);
      setMinutes(pick.s.minutes);
    }
  }, [list, selected]);

  const current = list?.find((x) => x.s.id === selected);

  return (
    <Sheet title="Start a session" onClose={closeSheet}>
      {list && list.length === 0 ? (
        <div className="stack-lg">
          <p className="muted">Create a skillset first — then you can start sessions from here.</p>
          <button className="btn primary block" onClick={() => push({ name: "skillsetEdit" })}>
            <Plus size={20} /> New skillset
          </button>
        </div>
      ) : (
        <div className="stack-lg">
          <div className="stack">
            {list?.map((x) => (
              <button
                key={x.s.id}
                className="list-card inner"
                style={{ outline: selected === x.s.id ? "2px solid var(--accent)" : "none" }}
                onClick={() => {
                  setSelected(x.s.id);
                  setMinutes(x.s.minutes);
                }}
              >
                <div className="icon-dot" style={{ position: "relative", overflow: "hidden", color: "#fff", fontWeight: 700 }}>
                  <HeroBg hue={x.s.hue} name={x.s.name} />
                  <span style={{ position: "relative" }}>{x.s.name[0]?.toUpperCase()}</span>
                </div>
                <div className="grow">
                  <div className="bold ellipsis">{x.s.name}</div>
                  <div className="small muted">{x.nextLabel}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="field">
            <label>Portion</label>
            <MinutesPicker key={selected ?? "none"} value={minutes} onChange={setMinutes} />
          </div>
          <button className="btn primary block" disabled={!current} onClick={() => current && push({ name: "session", skillsetId: current.s.id, minutes })}>
            <Play size={20} fill="currentColor" /> {current?.s.placement ? `Start · ${minutes} min` : "Start placement test"}
          </button>
        </div>
      )}
    </Sheet>
  );
}
