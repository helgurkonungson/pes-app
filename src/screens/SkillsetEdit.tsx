import { useLiveQuery } from "dexie-react-hooks";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { LessonLanguageField } from "../components/LanguagePicker";
import { confirmDialog, MinutesPicker, toast, Toggle, TopBar } from "../components/ui";
import { LESSON_LANG_OF } from "../core/languages";
import type { LessonLanguage } from "../core/types";
import { db, getProfile } from "../data/db";
import { createSkillset, deleteSkillset, updateSkillset } from "../data/repo";
import { useLang, useT } from "../i18n";
import { useNav } from "../nav/store";

const HUES = [174, 200, 222, 262, 300, 340, 18, 40, 140];

export function SkillsetEdit({ id }: { id?: string }) {
  const t = useT();
  const uiLang = useLang((s) => s.lang);
  const existing = useLiveQuery(() => (id ? db.skillsets.get(id) : undefined), [id]);
  const { pop, replace, reset } = useNav();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [minutes, setMinutes] = useState(15);
  const [hue, setHue] = useState(HUES[0]);
  const [useInternet, setUseInternet] = useState(true);
  const [language, setLanguage] = useState<LessonLanguage>(LESSON_LANG_OF[uiLang]);
  const [loaded, setLoaded] = useState(!id);
  const [busy, setBusy] = useState(false);
  const isCourse = !!existing?.courseId;

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
        await updateSkillset(id, isCourse ? { name: name.trim(), goal: goal.trim(), hue } : { name: name.trim(), goal: goal.trim(), minutes, hue, useInternet, language });
        toast(t("common.saved"));
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

  const remove = async () => {
    if (!existing) return;
    if (await confirmDialog(t("edit.deleteConfirm", { name: existing.name }), { text: t("edit.deleteText"), ok: t("common.delete"), danger: true })) {
      await deleteSkillset(existing.id);
      reset();
      useNav.getState().setTab("skillsets");
      toast(t("edit.deleted"));
    }
  };

  return (
    <div className="screen with-cta">
      <TopBar title={id ? t("edit.titleEdit") : t("edit.titleNew")} />
      <div className="stack-lg">
        <div className="field">
          <label htmlFor="sk-name">{t("edit.name")}</label>
          <input id="sk-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("edit.namePh")} maxLength={60} />
        </div>
        <div className="field">
          <label htmlFor="sk-goal">{t("edit.goal")}</label>
          <textarea id="sk-goal" className="textarea" style={{ minHeight: 96 }} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder={t("edit.goalPh")} />
          <p className="faint small">{t("edit.goalHint")}</p>
        </div>
        {!isCourse && (
          <>
            <div className="field">
              <span className="label" id="portion-l">
                {t("edit.portion")}
              </span>
              <MinutesPicker value={minutes} onChange={setMinutes} label={t("edit.portion")} />
            </div>
            <div className="field">
              <span className="label">{t("edit.language")}</span>
              <LessonLanguageField value={language} onChange={setLanguage} />
            </div>
            <div className="card tight row-between">
              <label htmlFor="sk-net" className="grow">
                <span className="bold block">{t("skillset.internet")}</span>
                <span className="small muted block">{t("edit.internetHint")}</span>
              </label>
              <Toggle id="sk-net" on={useInternet} onChange={setUseInternet} label={t("skillset.internet")} />
            </div>
          </>
        )}
        <div className="field">
          <span className="label">{t("edit.color")}</span>
          <div className="hues" role="radiogroup" aria-label={t("edit.color")}>
            {HUES.map((h, i) => (
              <button
                key={h}
                role="radio"
                aria-checked={hue === h}
                aria-label={t("edit.colorN", { n: i + 1 })}
                className={`hue${hue === h ? " on" : ""}`}
                style={{ background: `linear-gradient(140deg, hsl(${h} 58% 52%), hsl(${(h + 28) % 360} 46% 30%))` }}
                onClick={() => setHue(h)}
              />
            ))}
          </div>
        </div>
        {id && existing && (
          <button className="btn danger block" onClick={remove} style={{ marginTop: 12 }}>
            <Trash2 size={18} /> {t("edit.delete")}
          </button>
        )}
      </div>
      <div className="cta-bar">
        <button className="btn primary" onClick={save} disabled={!name.trim() || busy}>
          {id ? t("common.save") : t("edit.create")}
        </button>
      </div>
    </div>
  );
}
