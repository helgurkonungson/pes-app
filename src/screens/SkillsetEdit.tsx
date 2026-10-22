import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { MinutesPicker, toast, Toggle, TopBar } from "../components/ui";
import type { LessonLanguage } from "../core/types";
import { db, getProfile } from "../data/db";
import { createSkillset, updateSkillset } from "../data/repo";
import { useNav } from "../nav/store";

const HUES = [174, 200, 222, 262, 300, 340, 18, 40, 140];
const LANGS: { id: LessonLanguage; label: string }[] = [
  { id: "English", label: "English" },
  { id: "Russian", label: "Русский" },
  { id: "Source", label: "Same as sources" },
];

export function SkillsetEdit({ id }: { id?: string }) {
  const existing = useLiveQuery(() => (id ? db.skillsets.get(id) : undefined), [id]);
  const { pop, replace } = useNav();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [minutes, setMinutes] = useState(15);
  const [hue, setHue] = useState(HUES[0]);
  const [useInternet, setUseInternet] = useState(true);
  const [language, setLanguage] = useState<LessonLanguage>("English");
  const [loaded, setLoaded] = useState(!id);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (existing && !loaded) {
      setName(existing.name);
      setGoal(existing.goal);
      setMinutes(existing.minutes);
      setHue(existing.hue);
      setUseInternet(existing.useInternet);
      setLanguage(existing.language);
      setLoaded(true);
    }
  }, [existing, loaded]);

  useEffect(() => {
    if (!id) getProfile().then((p) => setMinutes(p.dailyGoal || 15));
  }, [id]);

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      if (id) {
        await updateSkillset(id, { name: name.trim(), goal: goal.trim(), minutes, hue, useInternet, language });
        toast("Saved");
        pop();
      } else {
        const s = await createSkillset({ name, goal, minutes, hue, useInternet, language });
        replace({ name: "skillset", id: s.id });
        useNav.getState().push({ name: "sources", id: s.id });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen with-cta">
      <TopBar title={id ? "Edit skillset" : "New skillset"} />
      <div className="stack-lg">
        <div className="field">
          <label htmlFor="sk-name">Skillset or profession</label>
          <input id="sk-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chief Data Officer" maxLength={60} />
        </div>
        <div className="field">
          <label htmlFor="sk-goal">Your goal</label>
          <textarea
            id="sk-goal"
            className="textarea"
            style={{ minHeight: 96 }}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What do you want to be able to do? e.g. Lead a data office: governance, data products, ROI of ML."
          />
        </div>
        <div className="field">
          <label>Default portion</label>
          <MinutesPicker value={minutes} onChange={setMinutes} />
        </div>
        <div className="field">
          <label>Lesson language</label>
          <div className="chips">
            {LANGS.map((l) => (
              <button key={l.id} className={`chip${language === l.id ? " on" : ""}`} onClick={() => setLanguage(l.id)}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div className="card tight row-between">
          <div>
            <div className="bold">Use the internet</div>
            <div className="small muted">Add fresh facts and examples from the web to each lesson</div>
          </div>
          <Toggle on={useInternet} onChange={setUseInternet} label="Use the internet" />
        </div>
        <div className="field">
          <label>Color</label>
          <div className="hues">
            {HUES.map((h) => (
              <button key={h} aria-label={`Color ${h}`} className={`hue${hue === h ? " on" : ""}`} style={{ background: `linear-gradient(140deg, hsl(${h} 58% 52%), hsl(${(h + 28) % 360} 46% 30%))` }} onClick={() => setHue(h)} />
            ))}
          </div>
        </div>
      </div>
      <div className="cta-bar">
        <button className="btn primary" onClick={save} disabled={!name.trim() || busy}>
          {id ? "Save" : "Create and add sources"}
        </button>
      </div>
    </div>
  );
}
