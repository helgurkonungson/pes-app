import { useLiveQuery } from "dexie-react-hooks";
import { FileText, Globe, Link as LinkIcon, Trash2, Type, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { confirmDialog, Empty, Sheet, toast, TopBar } from "../components/ui";
import type { Source } from "../core/types";
import { db } from "../data/db";
import { addSource, deleteSource } from "../data/repo";
import { ACCEPT, importFile, importText, importUrl, type Imported } from "../sources/importers";

const KIND_LABEL: Record<Source["kind"], string> = { pdf: "PDF", epub: "EPUB", docx: "Word", text: "Text", url: "Web page" };

export function Sources({ id }: { id: string }) {
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
    toast(`Added “${imp.title}” · ${imp.drafts.length} part${imp.drafts.length === 1 ? "" : "s"}`);
  };

  const run = async (label: string, job: () => Promise<void>) => {
    setBusy(label);
    setError(null);
    try {
      await job();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(null);
    }
  };

  const onFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const list = [...files];
    run("Reading file…", async () => {
      for (const f of list) {
        await save(await importFile(f, (m) => setBusy(`${f.name}: ${m}`)));
      }
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  const remove = async (s: Source) => {
    if (await confirmDialog(`Remove “${s.title}”?`, { text: "Lessons already done stay in your history.", ok: "Remove", danger: true })) {
      await deleteSource(s);
    }
  };

  return (
    <div className="screen">
      <TopBar title={skillset ? `Sources` : ""} />
      <div className="stack-lg">
        <p className="muted small">
          Add what you want to learn from{skillset ? ` for ${skillset.name}` : ""}. Lessons follow your sources in the order you add them. Files from Google Drive, Dropbox or OneDrive can be picked from the file chooser.
        </p>

        <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <button className="card tight stack center" onClick={() => fileRef.current?.click()} disabled={!!busy} style={{ alignItems: "center", gap: 8 }}>
            <div className="icon-dot accent">
              <Upload size={20} />
            </div>
            <span className="small bold">Files</span>
          </button>
          <button className="card tight stack" onClick={() => setSheet("text")} disabled={!!busy} style={{ alignItems: "center", gap: 8 }}>
            <div className="icon-dot">
              <Type size={20} />
            </div>
            <span className="small bold">Paste text</span>
          </button>
          <button className="card tight stack" onClick={() => setSheet("url")} disabled={!!busy} style={{ alignItems: "center", gap: 8 }}>
            <div className="icon-dot">
              <LinkIcon size={20} />
            </div>
            <span className="small bold">Web link</span>
          </button>
        </div>
        <input ref={fileRef} type="file" accept={ACCEPT} multiple hidden onChange={(e) => onFiles(e.target.files)} />
        <p className="faint tiny center">PDF · EPUB · Word · TXT · Markdown · HTML</p>

        {busy && (
          <div className="banner">
            <div className="icon-dot accent pulse">
              <FileText size={20} />
            </div>
            <span className="small">{busy}</span>
          </div>
        )}
        {error && <div className="error-box">{error}</div>}

        {sources && sources.length === 0 && !busy && (
          <Empty icon={<FileText size={34} />} title="No sources yet" text="You can also start without sources — lessons will then follow a general curriculum for your goal, using the internet if it's on." />
        )}

        <div className="stack">
          {sources?.map((s) => (
            <div key={s.id} className="list-card">
              <div className="icon-dot">{s.kind === "url" ? <Globe size={20} /> : <FileText size={20} />}</div>
              <div className="grow">
                <div className="bold ellipsis">{s.title}</div>
                <div className="small muted">
                  {KIND_LABEL[s.kind]} · {s.words.toLocaleString()} words · {s.chunks} part{s.chunks === 1 ? "" : "s"}
                </div>
              </div>
              <button className="round-btn" aria-label={`Remove ${s.title}`} onClick={() => remove(s)} style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {sheet === "text" && (
        <Sheet title="Paste text" onClose={() => setSheet(null)}>
          <div className="stack-lg">
            <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea className="textarea" style={{ minHeight: 200 }} placeholder="Paste an article, notes or a chapter…" value={text} onChange={(e) => setText(e.target.value)} />
            <button
              className="btn primary block"
              disabled={!text.trim()}
              onClick={() => {
                setSheet(null);
                run("Adding text…", async () => {
                  await save(importText(title.trim() || "Notes", text));
                  setTitle("");
                  setText("");
                });
              }}
            >
              Add text
            </button>
          </div>
        </Sheet>
      )}

      {sheet === "url" && (
        <Sheet title="Add a web page" onClose={() => setSheet(null)}>
          <div className="stack-lg">
            <input className="input selectable" inputMode="url" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} autoCapitalize="off" spellCheck={false} />
            <button
              className="btn primary block"
              disabled={!url.trim()}
              onClick={() => {
                setSheet(null);
                run("Downloading page…", async () => {
                  await save(await importUrl(url));
                  setUrl("");
                });
              }}
            >
              Add page
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
