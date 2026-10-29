/** Settings → Profile (name, language, daily goal, rest days, reminder) and Theme, with their sheets (ADR-036). */
import { Capacitor } from "@capacitor/core";
import { Bell, Moon, SunMoon, Target, User } from "lucide-react";
import { useState } from "react";
import { UiLanguageRow } from "../../components/LanguagePicker";
import { Group, MenuRow, MinutesPicker, Segmented, SectionLabel, Sheet, Toggle } from "../../components/ui";
import { weekdayShort } from "../../core/dates";
import { DEFAULT_REMINDER_TIME } from "../../core/reminders";
import { MAX_REST_DAYS } from "../../core/streak";
import type { Profile } from "../../core/types";
import { updateProfile } from "../../data/db";
import { setRestDays } from "../../data/repo";
import { locale, useT } from "../../i18n";
import { scheduleReminders, setReminder } from "../../native/reminders";

type ProfileSheet = null | "name" | "goal" | "rest" | "reminder";

export function ProfileSection({ profile }: { profile: Profile }) {
  const t = useT();
  const [sheet, setSheet] = useState<ProfileSheet>(null);
  const [draft, setDraft] = useState("");
  const [notifBlocked, setNotifBlocked] = useState(false);
  const close = () => setSheet(null);

  return (
    <>
      <section className="stack">
        <SectionLabel>{t("settings.profile")}</SectionLabel>
        <Group>
          <MenuRow icon={<User size={20} />} label={t("settings.name")} value={profile.name} onClick={() => (setDraft(profile.name), setSheet("name"))} />
          <UiLanguageRow value={profile.uiLanguage ?? "system"} onChange={(v) => updateProfile({ uiLanguage: v })} />
          <MenuRow icon={<Target size={20} />} label={t("settings.goal")} value={t("portion.min", { n: profile.dailyGoal })} onClick={() => setSheet("goal")} />
          <MenuRow
            icon={<Moon size={20} />}
            label={t("settings.restDays")}
            hint={t("settings.restDaysHint")}
            value={profile.restDays?.length ? profile.restDays.map((d) => weekdayShort(d, locale())).join(", ") : t("settings.restDaysNone")}
            onClick={() => setSheet("rest")}
          />
          {Capacitor.isNativePlatform() && (
            <MenuRow
              icon={<Bell size={20} />}
              label={t("settings.reminder")}
              hint={t("settings.reminderHint")}
              value={profile.reminder?.on ? profile.reminder.time : t("settings.reminderOff")}
              onClick={() => setSheet("reminder")}
            />
          )}
        </Group>
      </section>

      <section className="stack">
        <SectionLabel>
          <SunMoon size={14} style={{ verticalAlign: -2 }} /> {t("settings.theme")}
        </SectionLabel>
        <Segmented<"system" | "light" | "dark">
          label={t("settings.theme")}
          value={profile.theme ?? "system"}
          onChange={(v) => updateProfile({ theme: v })}
          options={[
            { id: "system", label: t("settings.themeSystem") },
            { id: "light", label: t("settings.themeLight") },
            { id: "dark", label: t("settings.themeDark") },
          ]}
        />
      </section>

      {sheet === "name" && (
        <Sheet title={t("settings.name")} onClose={close}>
          <div className="stack-lg">
            <input className="input" aria-label={t("settings.name")} value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus maxLength={40} />
            <button
              className="btn primary block"
              disabled={!draft.trim()}
              onClick={async () => {
                await updateProfile({ name: draft.trim() });
                close();
              }}
            >
              {t("common.save")}
            </button>
          </div>
        </Sheet>
      )}

      {sheet === "goal" && (
        <Sheet title={t("settings.goal")} onClose={close}>
          <div className="stack-lg">
            <MinutesPicker value={profile.dailyGoal} onChange={(m) => updateProfile({ dailyGoal: m })} label={t("settings.goal")} />
            <button className="btn primary block" onClick={close}>
              {t("common.done")}
            </button>
          </div>
        </Sheet>
      )}

      {sheet === "rest" && (
        <Sheet title={t("settings.restDays")} onClose={close}>
          <div className="stack-lg">
            <div className="weekday-pick" role="group" aria-label={t("settings.restDays")}>
              {Array.from({ length: 7 }, (_, i) => {
                const days = profile.restDays ?? [];
                const on = days.includes(i);
                return (
                  <button
                    key={i}
                    className={on ? "on" : ""}
                    aria-pressed={on}
                    disabled={!on && days.length >= MAX_REST_DAYS}
                    onClick={async () => {
                      await setRestDays(on ? days.filter((d) => d !== i) : [...days, i]);
                      void scheduleReminders();
                    }}
                  >
                    {weekdayShort(i, locale())}
                  </button>
                );
              })}
            </div>
            <p className="faint small">{t("settings.restDaysHint")}</p>
            <button className="btn primary block" onClick={close}>
              {t("common.done")}
            </button>
          </div>
        </Sheet>
      )}

      {sheet === "reminder" && (
        <Sheet title={t("settings.reminder")} onClose={close}>
          <div className="stack-lg">
            <div className="row-between">
              <span className="bold">{t("settings.reminder")}</span>
              <Toggle
                on={!!profile.reminder?.on}
                label={t("settings.reminder")}
                onChange={async (on) => {
                  const ok = await setReminder(on);
                  setNotifBlocked(on && !ok);
                }}
              />
            </div>
            <label className="stack" style={{ gap: 6 }}>
              <span className="small muted">{t("settings.reminderTime")}</span>
              <input
                className="input"
                type="time"
                value={profile.reminder?.time ?? DEFAULT_REMINDER_TIME}
                onChange={(e) => e.target.value && setReminder(profile.reminder?.on ?? true, e.target.value).then((ok) => setNotifBlocked(!ok))}
              />
            </label>
            <p className="faint small">{t("settings.reminderHint")}</p>
            {notifBlocked && (
              <p className="small" role="alert">
                {t("settings.reminderDenied")}
              </p>
            )}
            <button className="btn primary block" onClick={close}>
              {t("common.done")}
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}
