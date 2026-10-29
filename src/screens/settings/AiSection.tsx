/**
 * Settings → AI (ADR-036): lesson mode, provider, server/folder/key/model and their sheets, the
 * free-AI sheet, this month's usage and the AI status. A new AI option (e.g. Chompbook AI with Pro)
 * plugs in here: a row in the provider picker and its own rows below.
 */
import { Activity, BarChart3, Bot, Check, ChevronLeft, ChevronRight, Folder, KeyRound, Server, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { AiError, listModels, type ModelInfo, testKey } from "../../ai/client";
import { freeProvider } from "../../ai/freeProviders";
import { clearApiKey, getApiKey, maskKey, setApiKey } from "../../ai/key";
import { activeProvider, modelOf, normalizeBaseUrl, pickDefaultModel, PROVIDER_IDS, PROVIDERS } from "../../ai/providers";
import { useAiState } from "../../ai/status";
import { formatTokens, monthKey } from "../../ai/usage";
import { FreeAiCard, FreeAiSheet } from "../../components/FreeAi";
import { ExtLink, Group, MenuRow, Segmented, SectionLabel, Sheet, toast } from "../../components/ui";
import type { AiMode, Profile, ProviderId } from "../../core/types";
import { updateProfile } from "../../data/db";
import { locale, useT } from "../../i18n";
import { useSettingsIntent } from "../../nav/intent";
import { aiErrorDetail, aiErrorText, providerName } from "../aiText";

type AiSheet = null | "key" | "model" | "folder" | "provider" | "server";

export function AiSection({ profile }: { profile: Profile }) {
  const t = useT();
  const [key, setKey] = useState<string | null>(null);
  const [keyVersion, setKeyVersion] = useState(0);
  const ai = useAiState(keyVersion);
  /** Free AI sheet: a provider to open directly, "gemini-direct", or "" for the list; null = closed. */
  const [freeSheet, setFreeSheet] = useState<ProviderId | "gemini-direct" | "" | null>(null);
  const [providerView, setProviderView] = useState<"top" | "other">("top");
  const [sheet, setSheet] = useState<AiSheet>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [models, setModels] = useState<ModelInfo[] | null>(null);

  const provider = activeProvider(profile);
  const meta = PROVIDERS[provider];
  const keyChanged = () => setKeyVersion((v) => v + 1);
  useEffect(() => {
    getApiKey(provider).then(setKey);
  }, [keyVersion, provider]);

  // the tutorial's "My own key" opens Settings at the AI provider picker
  const providerIntent = useSettingsIntent((s) => s.provider);
  useEffect(() => {
    if (!providerIntent) return;
    useSettingsIntent.getState().clear();
    document.getElementById("settings-ai")?.scrollIntoView({ block: "start" });
    setProviderView("top");
    setSheet("provider");
  }, [providerIntent]);

  const setModel = (id: string) => updateProfile(provider === "anthropic" ? { model: id } : { providerModels: { ...profile.providerModels, [provider]: id } });

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
      keyChanged();
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
      keyChanged();
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

  const chooseProvider = async (id: ProviderId) => {
    await updateProfile({ provider: id, aiBlock: undefined });
    keyChanged();
    setSheet(null);
  };

  const aiStatusText =
    ai === "ok" ? t("settings.ai.ok") : ai === "off" ? t("settings.ai.off") : ai === "credits" ? t("settings.ai.credits") : ai === "auth" ? t("settings.ai.auth") : ai === "no-key" ? t("settings.ai.noKey") : "…";
  const keyLabel = meta.keyOptional ? t("settings.keyOptional") : t("settings.keyFor", { name: providerName(provider, t) });
  const errorBox = err && (
    <div className="error-box" role="alert">
      {err}
    </div>
  );

  return (
    <>
      <section className="stack" id="settings-ai">
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
        {!key && !meta.keyOptional && <FreeAiCard onClick={() => setFreeSheet("")} />}
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
          <MenuRow icon={<KeyRound size={20} />} label={keyLabel} value={key ? maskKey(key) : t("settings.keyNotSet")} onClick={() => (setDraft(""), setErr(null), setSheet("key"))} />
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

      {freeSheet !== null && (
        <FreeAiSheet
          initial={freeSheet === "gemini-direct" ? "gemini" : freeSheet && freeProvider(freeSheet) && freeSheet !== "gemini" ? freeSheet : undefined}
          onClose={() => setFreeSheet(null)}
          onDone={() => {
            setFreeSheet(null);
            keyChanged();
          }}
        />
      )}

      {sheet === "key" && (
        <Sheet title={keyLabel} onClose={() => setSheet(null)}>
          <div className="stack-lg">
            {meta.keyOptional ? (
              <p className="muted small">{t("settings.keyOptionalHelp")}</p>
            ) : (
              <p className="muted small">
                {t("settings.keyHelpAny", { name: providerName(provider, t) })} <ExtLink href={meta.keyUrl}>{meta.keyUrl.replace(/^https:\/\//, "")}</ExtLink>
              </p>
            )}
            {freeProvider(provider) && (
              <button className="btn dark block" onClick={() => (setSheet(null), setFreeSheet(provider === "gemini" ? "gemini-direct" : provider))}>
                <Sparkles size={20} /> {t("free.getFree", { name: providerName(provider, t) })}
              </button>
            )}
            <input className="input selectable" aria-label={keyLabel} placeholder={meta.keyOptional ? t("settings.keyOptionalPh") : meta.keyPlaceholder} value={draft} onChange={(e) => setDraft(e.target.value)} autoCapitalize="off" spellCheck={false} autoComplete="off" />
            {errorBox}
            <button className="btn primary block" onClick={saveKey} disabled={busy || draft.trim().length < (meta.keyOptional ? 1 : 20)}>
              {busy ? t("common.checking") : t("settings.keyVerify")}
            </button>
            {key && (
              <button
                className="btn danger block"
                onClick={async () => {
                  await clearApiKey(provider);
                  keyChanged();
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
                      return setFreeSheet("gemini-direct");
                    }
                    await chooseProvider(o.id === "builtin" ? "gemini" : "custom");
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
                <button key={id} role="radio" aria-checked={id === provider} className={`list-card inner${id === provider ? " selected" : ""}`} onClick={() => chooseProvider(id)}>
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
            {errorBox}
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
            {errorBox}
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
    </>
  );
}
