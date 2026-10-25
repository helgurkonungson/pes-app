import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Activity, BarChart3, Bell, Bot, Bug, Check, ChevronLeft, ChevronRight, Code, Download, Folder, Globe, Server, Sparkles, KeyRound, RefreshCw, ShieldCheck, Target, Trash2, Upload, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useUpdate } from "../app/App";
import { AiError, listModels, type ModelInfo, testKey } from "../ai/client";
import { clearApiKey, getApiKey, maskKey, setApiKey } from "../ai/key";
import { GeminiSetupSheet } from "../components/GeminiSetup";
import { googleSignInAvailable } from "../native/googleAuth";
import { activeProvider, modelOf, normalizeBaseUrl, pickDefaultModel, PROVIDER_IDS, PROVIDERS } from "../ai/providers";
import { useAiState } from "../ai/status";
import { useBackupRestore } from "../components/FilePickers";
import { confirmDialog, ExtLink, Group, MenuRow, MinutesPicker, openExternal, PageTitle, Segmented, SectionLabel, Sheet, toast, Toggle } from "../components/ui";
import { formatTokens, monthKey } from "../ai/usage";
import { DEFAULT_REMINDER_TIME } from "../core/reminders";
import { setReminder } from "../native/reminders";
import type { AiMode, ProviderId, UiLanguage } from "../core/types";
import type { T } from "../i18n";
import { localDay } from "../core/dates";
import { updateProfile } from "../data/db";
import { useProfile } from "../data/hooks";
import { exportBackup, wipeAll } from "../data/repo";
import { clearSnapshots } from "../data/safety";
import { locale, useT } from "../i18n";
import { useNav } from "../nav/store";
import { APP_REPO, APP_VERSION, checkForUpdate, installUpdateSafely } from "../update/updater";
import { aiErrorDetail, aiErrorText } from "./Session";

export function Settings() {
  const t = useT();
  const profile = useProfile();
  const update = useUpdate();
  const reset = useNav((s) => s.reset);
  const [key, setKey] = useState<string | null>(null);
  const [keyVersion, setKeyVersion] = useState(0);
  const ai = useAiState(keyVersion);
  const [geminiSheet, setGeminiSheet] = useState(false);
  const [providerView, setProviderView] = useState<"top" | "other">("top");
  const [sheet, setSheet] = useState<null | "name" | "goal" | "key" | "model" | "folder" | "provider" | "server" | "reminder">(null);
  const [notifBlocked, setNotifBlocked] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkNote, setCheckNote] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [models, setModels] = useState<ModelInfo[] | null>(null);
  const restore = useBackupRestore(() => reset());

  const provider = activeProvider(profile);
  const meta = PROVIDERS[provider];
  useEffect(() => {
    getApiKey(provider).then(setKey);
  }, [keyVersion, provider]);

  if (!profile) return <div className="screen with-tabbar" />;

  const setModel = (id: string) =>
    updateProfile(provider === "anthropic" ? { model: id } : { providerModels: { ...profile.providerModels, [provider]: id } });

  const saveKey = async () => {
    setBusy(true);
    setErr(null);
    try {
      if (provider === "yandex" && !profile.yandexFolder?.trim()) throw new Error(t("settings.folderFirst"));
      if (provider === "custom" && !profile.customBaseUrl?.trim()) throw new Error(t("settings.serverFirst"));
      const list = await testKey(draft.trim(), provider);
      await setApiKey(draft.trim(), provider);
      await updateProfile({ aiBlock: undefined });
      if (provider !== "anthropic" && !profile.providerModels?.[provider]) {
        const auto = pickDefaultModel(provider, list.map((m) => m.id));
        if (auto) await setModel(auto);
      }
      setKeyVersion((v) => v + 1);
      setSheet(null);
      toast(t("settings.keySaved"));
    } catch (e) {
      setErr(e instanceof AiError ? [aiErrorText(e, t), aiErrorDetail(e, t)].filter(Boolean).join("\n\n") : e instanceof Error && e.message ? e.message : t("settings.keyCheckFailed"));
    } finally {
      setBusy(false);
    }
  };

  const saveServer = async () => {
    setBusy(true);
    setErr(null);
    try {
      const url = normalizeBaseUrl(draft);
      await updateProfile({ customBaseUrl: url, aiBlock: undefined });
      const list = await listModels(key ?? "", "custom");
      if (!profile.providerModels?.custom && list[0]) await setModel(list[0].id);
      setKeyVersion((v) => v + 1);
      setSheet(null);
      toast(t("settings.serverOk", { n: list.length }));
    } catch (e) {
      setErr(e instanceof AiError ? [aiErrorText(e, t), aiErrorDetail(e, t), t("settings.serverTroubleshoot")].filter(Boolean).join("\n\n") : t("settings.serverTroubleshoot"));
    } finally {
      setBusy(false);
    }
  };

  const openModels = async () => {
    setSheet("model");
    setErr(null);
    setModels(null);
    try {
      setModels(await listModels());
    } catch (e) {
      setErr(aiErrorText(e, t));
    }
  };

  const doExport = async () => {
    try {
      const json = JSON.stringify(await exportBackup());
      const name = `pes-backup-${localDay()}.json`;
      if (Capacitor.isNativePlatform()) {
        const res = await Filesystem.writeFile({ path: name, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 });
        await Share.share({ title: t("settings.backupShareTitle"), files: [res.uri] });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
        a.download = name;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch (e) {
      if (!String(e).toLowerCase().includes("cancel")) toast(t("settings.exportFailed"));
    }
  };

  // the result is shown right in the row (a toast alone is easy to miss)
  const doCheck = async () => {
    setChecking(true);
    setCheckNote(null);
    const time = new Date().toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
    try {
      const info = await checkForUpdate();
      update.set(info);
      const note = info ? t("settings.updateAvailable", { v: info.version }) : t("settings.latestAt", { time });
      setCheckNote(note);
      toast(note);
    } catch {
      setCheckNote(t("settings.githubFailed"));
      toast(t("settings.githubFailed"));
    } finally {
      setChecking(false);
    }
  };

  const doWipe = async () => {
    if (await confirmDialog(t("settings.wipeConfirm"), { text: t("settings.wipeText"), ok: t("settings.wipeOk"), danger: true })) {
      await clearSnapshots();
      await wipeAll();
      reset();
    }
  };

  const aiStatusText =
    ai === "ok" ? t("settings.ai.ok") : ai === "off" ? t("settings.ai.off") : ai === "credits" ? t("settings.ai.credits") : ai === "auth" ? t("settings.ai.auth") : ai === "no-key" ? t("settings.ai.noKey") : "…";

  return (
    <div className="screen with-tabbar">
      <PageTitle>{t("tab.settings")}</PageTitle>
      <div className="stack-lg">
        <section className="stack">
          <SectionLabel>{t("settings.profile")}</SectionLabel>
          <Group>
            <MenuRow icon={<User size={20} />} label={t("settings.name")} value={profile.name} onClick={() => (setDraft(profile.name), setSheet("name"))} />
            <MenuRow icon={<Target size={20} />} label={t("settings.goal")} value={t("portion.min", { n: profile.dailyGoal })} onClick={() => setSheet("goal")} />
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
            <Globe size={14} style={{ verticalAlign: -2 }} /> {t("settings.language")}
          </SectionLabel>
          <Segmented<UiLanguage>
            label={t("settings.language")}
            value={profile.uiLanguage ?? "system"}
            onChange={(v) => updateProfile({ uiLanguage: v })}
            options={[
              { id: "system", label: t("settings.langSystem") },
              { id: "ru", label: "Русский" },
              { id: "en", label: "English" },
            ]}
          />
        </section>

        <section className="stack">
          <SectionLabel>{t("settings.ai")}</SectionLabel>
          <Segmented<AiMode>
            label={t("settings.aiMode")}
            value={profile.aiMode ?? "auto"}
            onChange={(v) => updateProfile({ aiMode: v })}
            options={[
              { id: "auto", label: t("settings.aiAuto") },
              { id: "offline", label: t("settings.aiOffline") },
            ]}
          />
          <p className="faint small">{(profile.aiMode ?? "auto") === "auto" ? t("settings.aiAutoHint") : t("settings.aiOfflineHint")}</p>
          {!(provider === "gemini" && key) && (
            <button className="free-ai" onClick={() => setGeminiSheet(true)}>
              <Sparkles size={24} aria-hidden />
              <span className="grow">
                <b>{t("gemini.cta")}</b>
                <span>{t(googleSignInAvailable() ? "gemini.ctaHint" : "gemini.ctaHintManual")}</span>
              </span>
            </button>
          )}
          <Group>
            <MenuRow icon={<Sparkles size={20} />} label={t("settings.provider")} value={providerName(provider, t)} onClick={() => (setProviderView("top"), setSheet("provider"))} />
            {provider === "custom" && (
              <MenuRow
                icon={<Server size={20} />}
                label={t("settings.server")}
                hint={t("settings.serverHint")}
                value={profile.customBaseUrl ? normalizeBaseUrl(profile.customBaseUrl).replace(/^https?:\/\//, "") : t("settings.keyNotSet")}
                onClick={() => (setDraft(profile.customBaseUrl ?? ""), setErr(null), setSheet("server"))}
              />
            )}
            {provider === "yandex" && (
              <MenuRow icon={<Folder size={20} />} label={t("settings.folder")} hint={t("settings.folderHint")} value={profile.yandexFolder || t("settings.keyNotSet")} onClick={() => (setDraft(profile.yandexFolder ?? ""), setSheet("folder"))} />
            )}
            <MenuRow
              icon={<KeyRound size={20} />}
              label={meta.keyOptional ? t("settings.keyOptional") : t("settings.keyFor", { name: providerName(provider, t) })}
              value={key ? maskKey(key) : t("settings.keyNotSet")}
              onClick={() => (setDraft(""), setErr(null), setSheet("key"))}
            />
            <MenuRow icon={<Bot size={20} />} label={t("settings.model")} value={modelOf(profile).replace(/^claude-/, "") || "—"} onClick={key || (meta.keyOptional && profile.customBaseUrl) ? openModels : undefined} />
          </Group>
          {provider === "qwen" && (
            <Segmented<"intl" | "cn">
              label={t("settings.qwenRegion")}
              value={profile.qwenRegion ?? "intl"}
              onChange={(v) => updateProfile({ qwenRegion: v })}
              options={[
                { id: "intl", label: t("settings.qwenIntl") },
                { id: "cn", label: t("settings.qwenCn") },
              ]}
            />
          )}
          {!meta.webSearch && <p className="faint small">{t("settings.noWebSearch")}</p>}
          <Group>
            <MenuRow
              icon={<BarChart3 size={20} />}
              label={t("usage.month")}
              value={(() => {
                const u = profile.usage?.[monthKey()];
                return u ? `${formatTokens(u.input + u.output, locale())} · ${t("usage.requests", { n: u.requests })}` : "0";
              })()}
            />
            <MenuRow
              icon={<Activity size={20} />}
              label={t("settings.aiStatus")}
              hint={aiStatusText}
              value={ai === "credits" || ai === "auth" ? t("settings.retryAi") : undefined}
              onClick={
                ai === "credits" || ai === "auth"
                  ? async () => {
                      await updateProfile({ aiBlock: undefined });
                      toast(t("settings.aiRetrying"));
                    }
                  : undefined
              }
            />
          </Group>
        </section>

        <section className="stack">
          <SectionLabel>{t("settings.data")}</SectionLabel>
          <Group>
            <MenuRow icon={<Download size={20} />} label={t("settings.export")} hint={t("settings.exportHint")} onClick={doExport} />
            <MenuRow icon={<Upload size={20} />} label={t("settings.restore")} onClick={restore.open} />
            <MenuRow icon={<ShieldCheck size={20} />} label={t("settings.autoBackup")} hint={t("settings.autoBackupHint")} />
            <MenuRow icon={<Trash2 size={20} />} label={t("settings.wipe")} onClick={doWipe} danger />
          </Group>
          {restore.input}
        </section>

        <section className="stack">
          <SectionLabel>{t("settings.about")}</SectionLabel>
          <Group>
            <MenuRow icon={<RefreshCw size={20} className={checking ? "spin" : undefined} />} label={t("settings.checkUpdates")} hint={checking ? t("settings.checkingUpdates") : (checkNote ?? undefined)} value={`v${APP_VERSION}`} onClick={checking ? undefined : doCheck} />
            {update.info && <MenuRow icon={<Download size={20} />} label={t("settings.install", { v: update.info.version })} hint={t("settings.installHint")} onClick={() => installUpdateSafely(update.info!)} />}
            <MenuRow icon={<Bug size={20} />} label={t("settings.logs")} onClick={() => useNav.getState().push({ name: "logs" })} />
            <MenuRow icon={<Code size={20} />} label={t("settings.source")} value={APP_REPO.split("/")[1]} onClick={() => openExternal(`https://github.com/${APP_REPO}`)} />
          </Group>
        </section>
        <p className="faint tiny center">{t("settings.footer", { v: APP_VERSION })}</p>
      </div>

      {sheet === "name" && (
        <Sheet title={t("settings.name")} onClose={() => setSheet(null)}>
          <div className="stack-lg">
            <input className="input" aria-label={t("settings.name")} value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus maxLength={40} />
            <button
              className="btn primary block"
              disabled={!draft.trim()}
              onClick={async () => {
                await updateProfile({ name: draft.trim() });
                setSheet(null);
              }}
            >
              {t("common.save")}
            </button>
          </div>
        </Sheet>
      )}

      {sheet === "goal" && (
        <Sheet title={t("settings.goal")} onClose={() => setSheet(null)}>
          <div className="stack-lg">
            <MinutesPicker value={profile.dailyGoal} onChange={(m) => updateProfile({ dailyGoal: m })} label={t("settings.goal")} />
            <button className="btn primary block" onClick={() => setSheet(null)}>
              {t("common.done")}
            </button>
          </div>
        </Sheet>
      )}

      {sheet === "reminder" && (
        <Sheet title={t("settings.reminder")} onClose={() => setSheet(null)}>
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
            {notifBlocked && <p className="small" role="alert">{t("settings.reminderDenied")}</p>}
            <button className="btn primary block" onClick={() => setSheet(null)}>
              {t("common.done")}
            </button>
          </div>
        </Sheet>
      )}

      {geminiSheet && (
        <GeminiSetupSheet
          onClose={() => setGeminiSheet(false)}
          onDone={() => {
            setGeminiSheet(false);
            setKeyVersion((v) => v + 1);
          }}
        />
      )}
      {sheet === "key" && (
        <Sheet title={meta.keyOptional ? t("settings.keyOptional") : t("settings.keyFor", { name: providerName(provider, t) })} onClose={() => setSheet(null)}>
          <div className="stack-lg">
            {meta.keyOptional ? (
              <p className="muted small">{t("settings.keyOptionalHelp")}</p>
            ) : (
              <p className="muted small">
                {t("settings.keyHelpAny", { name: providerName(provider, t) })} <ExtLink href={meta.keyUrl}>{meta.keyUrl.replace(/^https:\/\//, "")}</ExtLink>
              </p>
            )}
            <input className="input selectable" aria-label={meta.keyOptional ? t("settings.keyOptional") : t("settings.keyFor", { name: providerName(provider, t) })} placeholder={meta.keyOptional ? t("settings.keyOptionalPh") : meta.keyPlaceholder} value={draft} onChange={(e) => setDraft(e.target.value)} autoCapitalize="off" spellCheck={false} autoComplete="off" />
            {err && (
              <div className="error-box" role="alert">
                {err}
              </div>
            )}
            <button className="btn primary block" onClick={saveKey} disabled={busy || draft.trim().length < (meta.keyOptional ? 1 : 20)}>
              {busy ? t("common.checking") : t("settings.keyVerify")}
            </button>
            {key && (
              <button
                className="btn danger block"
                onClick={async () => {
                  await clearApiKey(provider);
                  setKeyVersion((v) => v + 1);
                  setSheet(null);
                }}
              >
                {t("settings.keyRemove")}
              </button>
            )}
          </div>
        </Sheet>
      )}

      {sheet === "provider" && (
        <Sheet title={t("settings.provider")} onClose={() => setSheet(null)}>
          {providerView === "top" ? (
            <div className="stack" role="radiogroup" aria-label={t("settings.provider")}>
              {(
                [
                  { id: "builtin", name: t("provider.builtin"), hint: t("provider.builtinHint"), on: provider === "gemini" },
                  { id: "custom", name: providerName("custom", t), hint: t("settings.customVendor"), on: provider === "custom" },
                  { id: "other", name: t("provider.other"), hint: t("provider.otherHint"), on: provider !== "gemini" && provider !== "custom" },
                ] as const
              ).map((o) => (
                <button
                  key={o.id}
                  role="radio"
                  aria-checked={o.on}
                  className={`list-card inner${o.on ? " selected" : ""}`}
                  onClick={async () => {
                    if (o.id === "other") return setProviderView("other");
                    if (o.id === "builtin" && !(await getApiKey("gemini"))) {
                      setSheet(null);
                      return setGeminiSheet(true);
                    }
                    await updateProfile({ provider: o.id === "builtin" ? "gemini" : "custom", aiBlock: undefined });
                    setKeyVersion((x) => x + 1);
                    setSheet(null);
                  }}
                >
                  <span className="grow">
                    <span className="bold block">{o.name}</span>
                    <span className="small muted block">{o.hint}</span>
                  </span>
                  {o.id === "other" ? <ChevronRight size={20} className="muted" aria-hidden /> : o.on && <Check size={20} className="accent" />}
                </button>
              ))}
            </div>
          ) : (
            <div className="stack" role="radiogroup" aria-label={t("provider.other")}>
              <button className="btn ghost small" style={{ alignSelf: "flex-start" }} onClick={() => setProviderView("top")}>
                <ChevronLeft size={18} /> {t("common.back")}
              </button>
              {PROVIDER_IDS.filter((id) => id !== "custom").map((id) => (
                <button
                  key={id}
                  role="radio"
                  aria-checked={id === provider}
                  className={`list-card inner${id === provider ? " selected" : ""}`}
                  onClick={async () => {
                    await updateProfile({ provider: id, aiBlock: undefined });
                    setKeyVersion((x) => x + 1);
                    setSheet(null);
                  }}
                >
                  <span className="grow">
                    <span className="bold block">{id === "gemini" ? t("provider.geminiOwn") : providerName(id, t)}</span>
                    <span className="small muted block">{PROVIDERS[id].vendor}</span>
                  </span>
                  {id === provider && <Check size={20} className="accent" />}
                </button>
              ))}
            </div>
          )}
        </Sheet>
      )}

      {sheet === "server" && (
        <Sheet title={t("settings.server")} onClose={() => setSheet(null)}>
          <div className="stack-lg">
            <p className="muted small">{t("settings.serverHelp")}</p>
            <input
              className="input selectable"
              inputMode="url"
              aria-label={t("settings.server")}
              placeholder="http://192.168.1.10:11434/v1"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoCapitalize="off"
              spellCheck={false}
              autoComplete="off"
            />
            {err && (
              <div className="error-box" role="alert">
                {err}
              </div>
            )}
            <button className="btn primary block" onClick={saveServer} disabled={busy || !draft.trim()}>
              {busy ? t("common.checking") : t("settings.serverCheck")}
            </button>
          </div>
        </Sheet>
      )}

      {sheet === "folder" && (
        <Sheet title={t("settings.folder")} onClose={() => setSheet(null)}>
          <div className="stack-lg">
            <p className="muted small">{t("settings.folderHelp")}</p>
            <input className="input selectable" aria-label={t("settings.folder")} placeholder="b1g…" value={draft} onChange={(e) => setDraft(e.target.value)} autoCapitalize="off" spellCheck={false} autoComplete="off" />
            <button
              className="btn primary block"
              disabled={!draft.trim()}
              onClick={async () => {
                await updateProfile({ yandexFolder: draft.trim(), aiBlock: undefined });
                setSheet(null);
              }}
            >
              {t("common.save")}
            </button>
          </div>
        </Sheet>
      )}

      {sheet === "model" && (
        <Sheet title={t("settings.model")} onClose={() => setSheet(null)}>
          <div className="stack">
            <p className="muted small" style={{ marginBottom: 8 }}>
              {provider === "anthropic" ? t("settings.modelHelp") : t("settings.modelHelpAny")}
            </p>
            {err && (
              <div className="error-box" role="alert">
                {err}
              </div>
            )}
            {!models && !err && <p className="muted pulse">{t("settings.modelsLoading")}</p>}
            {provider !== "anthropic" && (
              <form
                className="row"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const v = (new FormData(e.currentTarget).get("model") as string | null)?.trim();
                  if (!v) return;
                  await setModel(v);
                  setSheet(null);
                  toast(t("settings.modelUsing", { name: v }));
                }}
              >
                <input name="model" className="input selectable grow" aria-label={t("settings.modelManual")} placeholder={t("settings.modelManual")} autoCapitalize="off" spellCheck={false} autoComplete="off" />
                <button className="btn dark sm" type="submit">
                  {t("settings.modelUse")}
                </button>
              </form>
            )}
            {models?.map((m) => (
              <button
                key={m.id}
                className={`list-card inner${m.id === modelOf(profile) ? " selected" : ""}`}
                aria-pressed={m.id === modelOf(profile)}
                onClick={async () => {
                  await setModel(m.id);
                  setSheet(null);
                  toast(t("settings.modelUsing", { name: m.display_name }));
                }}
              >
                <Bot size={20} className="accent" />
                <span className="grow">
                  <span className="bold block">{m.display_name}</span>
                  <span className="small muted block">{m.id}</span>
                </span>
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

/** Display name of a provider (brands stay as is; Alice AI and Custom API are translated). */
export function providerName(id: ProviderId, t: T): string {
  if (id === "yandex") return t("provider.yandex");
  if (id === "custom") return t("provider.custom");
  return PROVIDERS[id].name;
}
