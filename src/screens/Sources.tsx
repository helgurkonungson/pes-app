import { useLiveQuery } from "dexie-react-hooks";
import { FileText, Globe, Link as LinkIcon, Trash2, Type, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { confirmDialog, Empty, Sheet, toast, TopBar } from "../components/ui";
import type { Source } from "../core/types";
import { db } from "../data/db";
import { addSource, deleteSource } from "../data/repo";
import { writeSnapshot } from "../data/safety";
import { type Key, useT } from "../i18n";
import { ACCEPT, importFile, importText, importUrl, type Imported } from "../sources/importers";

const KIND_LABEL: Record<Source["kind"], Key> = { pdf: "sources.kind.pdf", epub: "sources.kind.epub", docx: "sources.kind.docx", text: "sources.kind.text", url: "sources.kind.url" };

export function Sources({ id }: { id: string }) {
  const t = useT();
  const skillset = useLiveQuery(() => db.skillsets.get(id), [id]);
  const sources = useLiveQuery(() => db.sources.where("skillsetId").equals(id).sortBy("addedAt"), [id]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | "text" | "url">(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");

  const save = async (imp: Imported) => {
    await addSource(id, imp.kind, imp.title, imp.origin, imp.drafts);
    toast(t("sources.added", { title: imp.title, n: imp.drafts.length }));
    writeSnapshot();
  };

  const run = async (label: string, job: () => Promise<void>) => {
    setBusy(label);
    setError(null);
    try {
      await job();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("sources.err"));
    } finally {
      setBusy(null);
    }
  };

  const onFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const list = [...files];
    run(t("sources.reading"), async () => {
      for (const f of list) {
        await save(await importFile(f, (m) => setBusy(`${f.name}: ${m}`)));
      }
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  const remove = async (s: Source) => {
    if (await confirmDialog(t("sources.removeConfirm", { title: s.title }), { text: t("sources.removeText"), ok: t("common.remove"), danger: true })) {
      await deleteSource(s);
    }
  };

  return (
    <div className="screen">
      <TopBar title={t("sources.title")} />
      <div className="stack-lg">
        <p className="muted small">{skillset ? t("sources.intro", { name: skillset.name }) : ""}</p>

        <div className="grid-3">
          <button className="action-tile center-col" onClick={() => fileRef.current?.click()} disabled={!!busy}>
            <span className="icon-dot accent">
              <Upload size={20} />
            </span>
            <span className="small bold">{t("sources.files")}</span>
          </button>
          <button className="action-tile center-col" onClick={() => setSheet("text")} disabled={!!busy}>
            <span className="icon-dot">
              <Type size={20} />
            </span>
            <span className="small bold">{t("sources.paste")}</span>
          </button>
          <button className="action-tile center-col" onClick={() => setSheet("url")} disabled={!!busy}>
            <span className="icon-dot">
              <LinkIcon size={20} />
            </span>
            <span className="small bold">{t("sources.link")}</span>
          </button>
        </div>
        <input ref={fileRef} type="file" accept={ACCEPT} multiple hidden data-testid="source-file" onChange={(e) => onFiles(e.target.files)} />
        <p className="faint tiny center">{t("sources.formats")}</p>

        {busy && (
          <div className="banner" role="status">
            <span className="icon-dot accent pulse">
              <FileText size={20} />
            </span>
            <span className="small">{busy}</span>
          </div>
        )}
        {error && (
          <div className="error-box" role="alert">
            {error}
          </div>
        )}

        {sources && sources.length === 0 && !busy && <Empty icon={<FileText size={34} />} title={t("sources.empty.title")} text={t("sources.empty.text")} />}

        <div className="stack">
          {sources?.map((s) => (
            <div key={s.id} className="list-card">
              <span className="icon-dot">{s.kind === "url" ? <Globe size={20} /> : <FileText size={20} />}</span>
              <div className="grow">
                <div className="bold ellipsis">{s.title}</div>
                <div className="small muted">
                  {t(KIND_LABEL[s.kind])} · {t("sources.words", { n: s.words })} · {t("sources.parts", { n: s.chunks })}
                </div>
              </div>
              <button className="round-btn subtle" aria-label={t("sources.removeAria", { title: s.title })} onClick={() => remove(s)}>
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {sheet === "text" && (
        <Sheet title={t("sources.paste")} onClose={() => setSheet(null)}>
          <div className="stack-lg">
            <input className="input" placeholder={t("sources.textTitle")} aria-label={t("sources.textTitle")} value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea className="textarea" style={{ minHeight: 200 }} placeholder={t("sources.textPh")} aria-label={t("sources.paste")} value={text} onChange={(e) => setText(e.target.value)} />
            <button
              className="btn primary block"
              disabled={!text.trim()}
              onClick={() => {
                setSheet(null);
                run(t("sources.adding"), async () => {
                  await save(importText(title.trim() || t("sources.notes"), text));
                  setTitle("");
                  setText("");
                });
              }}
            >
              {t("sources.addText")}
            </button>
          </div>
        </Sheet>
      )}

      {sheet === "url" && (
        <Sheet title={t("sources.addPage")} onClose={() => setSheet(null)}>
          <div className="stack-lg">
            <input className="input selectable" inputMode="url" placeholder="https://…" aria-label={t("sources.link")} value={url} onChange={(e) => setUrl(e.target.value)} autoCapitalize="off" spellCheck={false} />
            <button
              className="btn primary block"
              disabled={!url.trim()}
              onClick={() => {
                setSheet(null);
                run(t("sources.downloading"), async () => {
                  await save(await importUrl(url));
                  setUrl("");
                });
              }}
            >
              {t("sources.addPageBtn")}
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
