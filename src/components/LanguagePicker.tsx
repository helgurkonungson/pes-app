/** Language lists (interface and lesson language) in a bottom sheet — nine languages don't fit a segmented control. */
import { Check, ChevronDown, Globe } from "lucide-react";
import { useState } from "react";
import { LESSON_LANGUAGES, uiLangOfLesson } from "../core/languages";
import type { LessonLanguage, UiLanguage } from "../core/types";
import { type Lang, LANGS, useT } from "../i18n";
import { MenuRow, Sheet } from "./ui";

const nativeName = (id: Lang) => LANGS.find((l) => l.id === id)?.label ?? id;

function ChoiceSheet<V extends string>({ title, value, options, onPick, onClose }: { title: string; value: V; options: { id: V; label: string; hint?: string }[]; onPick: (v: V) => void; onClose: () => void }) {
  return (
    <Sheet title={title} onClose={onClose}>
      <div className="choice-list" role="radiogroup" aria-label={title}>
        {options.map((o) => (
          <button
            key={o.id}
            role="radio"
            aria-checked={o.id === value}
            className={`choice${o.id === value ? " on" : ""}`}
            onClick={() => {
              onPick(o.id);
              onClose();
            }}
          >
            <span className="grow">
              <span className="block bold">{o.label}</span>
              {o.hint && <span className="block small muted">{o.hint}</span>}
            </span>
            {o.id === value && <Check size={20} aria-hidden />}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

/** Compact "🌐 English ▾" button for the first screen. */
export function LanguageButton({ value, onChange }: { value: Lang; onChange: (l: Lang) => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn dark small lang-btn" onClick={() => setOpen(true)} aria-label={`${t("settings.language")}: ${nativeName(value)}`} aria-haspopup="dialog">
        <Globe size={16} /> {nativeName(value)} <ChevronDown size={16} />
      </button>
      {open && <ChoiceSheet title={t("settings.language")} value={value} options={LANGS.map((l) => ({ id: l.id, label: l.label }))} onPick={onChange} onClose={() => setOpen(false)} />}
    </>
  );
}

/** Settings row: interface language, "System" first. */
export function UiLanguageRow({ value, onChange }: { value: UiLanguage; onChange: (v: UiLanguage) => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const options: { id: UiLanguage; label: string }[] = [{ id: "system", label: t("settings.langSystem") }, ...LANGS.map((l) => ({ id: l.id as UiLanguage, label: l.label }))];
  return (
    <>
      <MenuRow icon={<Globe size={20} />} label={t("settings.language")} value={options.find((o) => o.id === value)?.label} onClick={() => setOpen(true)} />
      {open && <ChoiceSheet title={t("settings.language")} value={value} options={options} onPick={onChange} onClose={() => setOpen(false)} />}
    </>
  );
}

/** Field for a skillset's lesson language. */
export function LessonLanguageField({ value, onChange }: { value: LessonLanguage; onChange: (v: LessonLanguage) => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const label = (l: LessonLanguage) => {
    const ui = uiLangOfLesson(l);
    return ui ? nativeName(ui) : t("edit.langSource");
  };
  const options = LESSON_LANGUAGES.map((l) => ({ id: l, label: label(l), hint: l === "Source" ? t("edit.langSourceHint") : undefined }));
  return (
    <>
      <button className="input select-btn" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={`${t("edit.language")}: ${label(value)}`}>
        <span className="grow">{label(value)}</span>
        <ChevronDown size={18} aria-hidden />
      </button>
      {open && <ChoiceSheet title={t("edit.language")} value={value} options={options} onPick={onChange} onClose={() => setOpen(false)} />}
    </>
  );
}

