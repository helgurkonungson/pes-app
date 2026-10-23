import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Activity, Bot, Code, Download, Folder, Globe, KeyRound, RefreshCw, ShieldCheck, Target, Trash2, Upload, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useUpdate } from "../app/App";
import { AiError, listModels, type ModelInfo, testKey } from "../ai/client";
import { clearApiKey, getApiKey, maskKey, setApiKey } from "../ai/key";
import { activeProvider, modelOf, pickOpenAiModel, PROVIDERS } from "../ai/providers";
import { useAiState } from "../ai/status";
import { useBackupRestore } from "../components/FilePickers";
import { confirmDialog, ExtLink, Group, MenuRow, MinutesPicker, openExternal, PageTitle, Segmented, SectionLabel, Sheet, toast } from "../components/ui";
import type { AiMode, ProviderId, UiLanguage } from "../core/types";
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
  const [sheet, setSheet] = useState<null | "name" | "goal" | "key" | "model" | "folder">(null);
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
      const list = await testKey(draft.trim(), provider);
      await setApiKey(draft.trim(), provider);
      await updateProfile({ aiBlock: undefined });
      if (provider === "openai" && !profile.providerModels?.openai) await setModel(pickOpenAiModel(list.map((m) => m.id)));
      setKeyVersion((v) => v + 1);
      setSheet(null);
      toast(t("settings.keySaved"));
    } catch (e) {
      setErr(e instanceof AiError ? [aiErrorText(e, t), aiErrorDetail(e, t)].filter(Boolean).join("\n\n") : e instanceof Error && e.message ? e.message : t("settings.keyCheckFailed"));
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
          <span className="label">{t("settings.provider")}</span>
          <Segmented<ProviderId>
            label={t("settings.provider")}
            value={provider}
            cols={3}
            onChange={async (v) => {
              await updateProfile({ provider: v, aiBlock: undefined });
              setKeyVersion((x) => x + 1);
            }}
            options={[
              { id: "anthropic", label: "Claude" },
              { id: "openai", label: "ChatGPT" },
              { id: "yandex", label: "Алиса AI" },
              { id: "qwen", label: "Qwen" },
              { id: "nvidia", label: "NVIDIA" },
            ]}
          />
          {!meta.webSearch && <p className="faint small">{t("settings.noWebSearch")}</p>}
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
          <Group>
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
            {provider === "yandex" && (
              <MenuRow icon={<Folder size={20} />} label={t("settings.folder")} hint={t("settings.folderHint")} value={profile.yandexFolder || t("settings.keyNotSet")} onClick={() => (setDraft(profile.yandexFolder ?? ""), setSheet("folder"))} />
            )}
            <MenuRow icon={<KeyRound size={20} />} label={t("settings.keyFor", { name: meta.name })} value={key ? maskKey(key) : t("settings.keyNotSet")} onClick={() => (setDraft(""), setErr(null), setSheet("key"))} />
            <MenuRow icon={<Bot size={20} />} label={t("settings.model")} value={modelOf(profile).replace(/^claude-/, "") || "—"} onClick={key ? openModels : undefined} />
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

      {sheet === "key" && (
        <Sheet title={t("settings.keyFor", { name: meta.name })} onClose={() => setSheet(null)}>
          <div className="stack-lg">
            <p className="muted small">
              {t("settings.keyHelpAny", { name: meta.name })} <ExtLink href={meta.keyUrl}>{meta.keyUrl.replace(/^https:\/\//, "")}</ExtLink>
            </p>
            <input className="input selectable" aria-label={t("settings.keyFor", { name: meta.name })} placeholder={meta.keyPlaceholder} value={draft} onChange={(e) => setDraft(e.target.value)} autoCapitalize="off" spellCheck={false} autoComplete="off" />
            {err && (
              <div className="error-box" role="alert">
                {err}
              </div>
            )}
            <button className="btn primary block" onClick={saveKey} disabled={busy || draft.trim().length < 20}>
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
