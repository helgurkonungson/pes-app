import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Bot, Code, Download, KeyRound, RefreshCw, Target, Trash2, Upload, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useUpdate } from "../app/App";
import { AiError, listModels, type ModelInfo, testKey } from "../ai/client";
import { clearApiKey, getApiKey, maskKey, setApiKey } from "../ai/key";
import { confirmDialog, MenuRow, MinutesPicker, Sheet, toast, TopBar } from "../components/ui";
import { localDay } from "../core/dates";
import { updateProfile } from "../data/db";
import { useProfile } from "../data/hooks";
import { exportBackup, importBackup, wipeAll } from "../data/repo";
import { useNav } from "../nav/store";
import { APP_REPO, APP_VERSION, checkForUpdate, installUpdate } from "../update/updater";

export function Settings() {
  const profile = useProfile();
  const update = useUpdate();
  const reset = useNav((s) => s.reset);
  const [key, setKey] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | "name" | "goal" | "key" | "model">(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [models, setModels] = useState<ModelInfo[] | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getApiKey().then(setKey);
  }, []);

  if (!profile) return <div className="screen" />;

  const saveKey = async () => {
    setBusy(true);
    setErr(null);
    try {
      await testKey(draft.trim());
      await setApiKey(draft.trim());
      setKey(draft.trim());
      setSheet(null);
      toast("Key saved");
    } catch (e) {
      setErr(e instanceof AiError ? e.message : "Couldn't verify the key.");
    } finally {
      setBusy(false);
    }
  };

  const openModels = async () => {
    setSheet("model");
    setErr(null);
    try {
      const list = await listModels();
      setModels(list);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't load models.");
    }
  };

  const doExport = async () => {
    try {
      const json = JSON.stringify(await exportBackup());
      const name = `pes-backup-${localDay()}.json`;
      if (Capacitor.isNativePlatform()) {
        const res = await Filesystem.writeFile({ path: name, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 });
        await Share.share({ title: "PES backup", files: [res.uri] });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
        a.download = name;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch (e) {
      if (!String(e).includes("cancel")) toast("Export failed");
    }
  };

  const doImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (await confirmDialog("Replace all data with this backup?", { text: "Everything currently in the app will be overwritten.", ok: "Restore", danger: true })) {
        await importBackup(data);
        toast("Backup restored");
        reset();
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "That file couldn't be read");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };

  const doCheck = async () => {
    setBusy(true);
    try {
      const info = await checkForUpdate();
      update.set(info);
      toast(info ? `Version ${info.version} is available` : "You have the latest version");
    } catch {
      toast("Couldn't reach GitHub");
    } finally {
      setBusy(false);
    }
  };

  const doWipe = async () => {
    if (await confirmDialog("Delete all data?", { text: "Skillsets, sources, lessons, XP and badges will be removed from this phone. Your API key stays.", ok: "Delete everything", danger: true })) {
      await wipeAll();
      reset();
    }
  };

  return (
    <div className="screen">
      <TopBar title="Settings" />
      <div className="stack">
        <div className="card" style={{ paddingTop: 6, paddingBottom: 6 }}>
          <MenuRow icon={<User size={20} className="accent" />} label="Name" value={profile.name} onClick={() => (setDraft(profile.name), setSheet("name"))} />
          <MenuRow icon={<Target size={20} className="accent" />} label="Daily goal" value={`${profile.dailyGoal} min`} onClick={() => setSheet("goal")} />
        </div>

        <div className="card" style={{ paddingTop: 6, paddingBottom: 6 }}>
          <MenuRow icon={<KeyRound size={20} className="accent" />} label="Claude API key" value={maskKey(key)} onClick={() => (setDraft(""), setErr(null), setSheet("key"))} />
          <MenuRow icon={<Bot size={20} className="accent" />} label="Model" value={profile.model.replace(/^claude-/, "")} onClick={openModels} />
        </div>

        <div className="card" style={{ paddingTop: 6, paddingBottom: 6 }}>
          <MenuRow icon={<RefreshCw size={20} className="accent" />} label="Check for updates" value={`v${APP_VERSION}`} onClick={busy ? undefined : doCheck} />
          {update.info && <MenuRow icon={<Download size={20} className="accent" />} label={`Install ${update.info.version}`} onClick={() => installUpdate(update.info!)} />}
          <MenuRow icon={<Code size={20} className="accent" />} label="Source code" value={APP_REPO.split("/")[1]} onClick={() => window.open(`https://github.com/${APP_REPO}`, "_blank")} />
        </div>

        <div className="card" style={{ paddingTop: 6, paddingBottom: 6 }}>
          <MenuRow icon={<Download size={20} className="accent" />} label="Export backup" onClick={doExport} />
          <MenuRow icon={<Upload size={20} className="accent" />} label="Restore backup" onClick={() => importRef.current?.click()} />
          <MenuRow icon={<Trash2 size={20} style={{ color: "var(--bad)" }} />} label="Delete all data" onClick={doWipe} />
        </div>
        <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={(e) => doImport(e.target.files?.[0])} />
        <p className="faint tiny center" style={{ marginTop: 8 }}>
          PES v{APP_VERSION} · your data stays on this phone
        </p>
      </div>

      {sheet === "name" && (
        <Sheet title="Your name" onClose={() => setSheet(null)}>
          <div className="stack-lg">
            <input className="input" value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
            <button
              className="btn primary block"
              disabled={!draft.trim()}
              onClick={async () => {
                await updateProfile({ name: draft.trim() });
                setSheet(null);
              }}
            >
              Save
            </button>
          </div>
        </Sheet>
      )}

      {sheet === "goal" && (
        <Sheet title="Daily goal" onClose={() => setSheet(null)}>
          <div className="stack-lg">
            <MinutesPicker value={profile.dailyGoal} onChange={(m) => updateProfile({ dailyGoal: m })} />
            <button className="btn primary block" onClick={() => setSheet(null)}>
              Done
            </button>
          </div>
        </Sheet>
      )}

      {sheet === "key" && (
        <Sheet title="Claude API key" onClose={() => setSheet(null)}>
          <div className="stack-lg">
            <p className="muted small">
              Stored in your phone's secure storage and sent only to Anthropic. Create or manage keys at{" "}
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">
                console.anthropic.com
              </a>
              .
            </p>
            <input className="input selectable" placeholder="sk-ant-…" value={draft} onChange={(e) => setDraft(e.target.value)} autoCapitalize="off" spellCheck={false} autoComplete="off" />
            {err && <div className="error-box">{err}</div>}
            <button className="btn primary block" onClick={saveKey} disabled={busy || draft.trim().length < 20}>
              {busy ? "Checking…" : "Verify and save"}
            </button>
            {key && (
              <button
                className="btn danger block"
                onClick={async () => {
                  await clearApiKey();
                  setKey(null);
                  setSheet(null);
                }}
              >
                Remove key
              </button>
            )}
          </div>
        </Sheet>
      )}

      {sheet === "model" && (
        <Sheet title="Model" onClose={() => setSheet(null)}>
          <div className="stack">
            <p className="muted small" style={{ marginBottom: 8 }}>
              Sonnet is a good balance of quality, speed and cost for lessons. Opus writes deeper lessons at a higher price; Haiku is cheapest.
            </p>
            {err && <div className="error-box">{err}</div>}
            {!models && !err && <p className="muted pulse">Loading models…</p>}
            {models?.map((m) => (
              <button
                key={m.id}
                className="list-card inner"
                style={{ outline: m.id === profile.model ? "2px solid var(--accent)" : "none" }}
                onClick={async () => {
                  await updateProfile({ model: m.id });
                  setSheet(null);
                  toast(`Using ${m.display_name}`);
                }}
              >
                <Bot size={20} className="accent" />
                <div className="grow">
                  <div className="bold">{m.display_name}</div>
                  <div className="small muted">{m.id}</div>
                </div>
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}
