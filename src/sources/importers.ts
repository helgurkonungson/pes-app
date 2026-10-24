/**
 * Turns files, pasted text and web pages into text sections for the chunker.
 * Heavy parsers (pdf.js, JSZip) are loaded only when needed.
 */
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { buildChunks, type ChunkDraft, sectionsFromPlainText, type TextSection } from "../core/chunker";
import type { SourceKind } from "../core/types";
import { t } from "../i18n";

export interface Imported {
  kind: SourceKind;
  title: string;
  origin: string;
  drafts: ChunkDraft[];
  /** Scanned PDF pages whose text was recognised on the device. */
  ocrPages?: number;
}

export type ImportProgress = (message: string, ratio?: number) => void;

export const ACCEPT = ".pdf,.epub,.docx,.txt,.md,.markdown,.html,.htm,.csv,application/pdf,application/epub+zip,text/plain,text/markdown,text/html,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const stripExt = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").trim();

export async function importFile(file: File, onProgress?: ImportProgress): Promise<Imported> {
  const name = file.name || "file";
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const title = stripExt(name);
  let sections: TextSection[];
  let kind: SourceKind = "text";
  let ocrPages = 0;

  if (ext === "pdf" || file.type === "application/pdf") {
    kind = "pdf";
    const pdf = await pdfSections(file, onProgress);
    sections = pdf.sections;
    ocrPages = pdf.ocrPages;
  } else if (ext === "epub" || file.type === "application/epub+zip") {
    kind = "epub";
    sections = await epubSections(file, onProgress);
  } else if (ext === "docx") {
    kind = "docx";
    sections = await docxSections(file);
  } else if (ext === "html" || ext === "htm" || file.type === "text/html") {
    sections = htmlSections(await file.text());
  } else {
    sections = sectionsFromPlainText(await file.text());
  }
  onProgress?.(t("import.splitting"), 1);
  const drafts = buildChunks(sections, title);
  if (!drafts.length) throw new Error(kind === "pdf" ? t("import.err.pdfEmpty") : t("import.err.empty"));
  return { kind, title, origin: name, drafts, ...(ocrPages ? { ocrPages } : {}) };
}

export function importText(title: string, text: string): Imported {
  const drafts = buildChunks(sectionsFromPlainText(text), title || "Notes");
  if (!drafts.length) throw new Error(t("import.err.textEmpty"));
  return { kind: "text", title: title || "Notes", origin: "pasted", drafts };
}

export async function importUrl(url: string): Promise<Imported> {
  let u: URL;
  try {
    u = new URL(url.trim().match(/^https?:\/\//i) ? url.trim() : `https://${url.trim()}`);
  } catch {
    throw new Error(t("import.err.badUrl"));
  }
  let html: string;
  if (Capacitor.isNativePlatform()) {
    const res = await CapacitorHttp.get({ url: u.toString(), headers: { Accept: "text/html,application/xhtml+xml" }, responseType: "text" });
    if (res.status >= 400) throw new Error(t("import.err.http", { status: res.status }));
    html = typeof res.data === "string" ? res.data : String(res.data ?? "");
  } else {
    try {
      const res = await fetch(u.toString());
      if (!res.ok) throw new Error(String(res.status));
      html = await res.text();
    } catch {
      throw new Error(t("import.err.cors"));
    }
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  const title = doc.querySelector("meta[property='og:title']")?.getAttribute("content") || doc.title || u.hostname;
  const drafts = buildChunks(htmlSections(html), title);
  if (!drafts.length) throw new Error(t("import.err.noArticle"));
  return { kind: "url", title: title.trim(), origin: u.toString(), drafts };
}

// ---------- HTML ----------

const BLOCK_SKIP = "script,style,noscript,nav,footer,header,aside,form,iframe,svg,figure figcaption,.ad,.ads,.advert,[role=navigation],[aria-hidden=true]";

export function htmlSections(html: string): TextSection[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll(BLOCK_SKIP).forEach((n) => n.remove());
  const root = doc.querySelector("article") ?? doc.querySelector("main") ?? doc.body;
  if (!root) return [];
  const sections: TextSection[] = [];
  let cur: TextSection = { text: "" };
  const walker = root.querySelectorAll("h1,h2,h3,h4,p,li,pre,blockquote,td,dd,dt");
  walker.forEach((el) => {
    const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    if (!text) return;
    if (/^H[1-4]$/.test(el.tagName)) {
      if (cur.text.trim() || cur.heading) sections.push(cur);
      cur = { heading: text, text: "" };
    } else {
      cur.text += (el.tagName === "LI" ? "- " : "") + text + "\n\n";
    }
  });
  if (cur.text.trim()) sections.push(cur);
  if (!sections.length) {
    const t = (root.textContent ?? "").replace(/[ \t]+/g, " ").trim();
    return t ? sectionsFromPlainText(t) : [];
  }
  return sections;
}

// ---------- PDF ----------

async function pdfSections(file: File, onProgress?: ImportProgress): Promise<{ sections: TextSection[]; ocrPages: number }> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const worker = await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const data = new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({ data });
  const doc = await task.promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    if (i === 1 || i % 10 === 0) onProgress?.(t("import.page", { i, n: doc.numPages }), i / doc.numPages);
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let text = "";
    let lastY: number | undefined;
    for (const item of content.items as { str?: string; transform?: number[]; hasEOL?: boolean }[]) {
      if (typeof item.str !== "string") continue;
      const y = item.transform?.[5];
      if (lastY !== undefined && y !== undefined && Math.abs(y - lastY) > 2 && !text.endsWith("\n")) text += "\n";
      text += item.str;
      if (item.hasEOL) text += "\n";
      lastY = y;
    }
    page.cleanup();
    pages.push(text);
  }

  // Scanned pages (no text layer) are recognised automatically, on the device.
  const { looksScanned, startOcr } = await import("./ocr");
  const scans = pages.map((p, i) => (looksScanned(p) ? i : -1)).filter((i) => i >= 0);
  let ocrPages = 0;
  if (scans.length) {
    onProgress?.(t("import.ocrPrep"), 0);
    const ocr = await startOcr();
    const canvas = document.createElement("canvas");
    try {
      for (let k = 0; k < scans.length; k++) {
        const i = scans[k];
        onProgress?.(t("import.ocr", { i: k + 1, n: scans.length }), k / scans.length);
        const page = await doc.getPage(i + 1);
        const base = page.getViewport({ scale: 1 });
        // ~2000 px on the long side: sharp enough for small print, light enough for phones
        const scale = Math.min(3, Math.max(1, 2000 / Math.max(base.width, base.height)));
        const viewport = page.getViewport({ scale });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) break;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        page.cleanup();
        const text = (await ocr.recognize(canvas)).trim();
        if (!looksScanned(text)) {
          pages[i] = text;
          ocrPages++;
        }
      }
    } finally {
      canvas.width = canvas.height = 0;
      await ocr.close().catch(() => undefined);
    }
  }
  await task.destroy();
  return { sections: pages.map((text, i) => ({ label: `p. ${i + 1}`, text: reflowPdfText(text) })), ocrPages };
}

/** PDF lines → paragraphs: keep breaks after sentence ends, join the rest. */
function reflowPdfText(text: string): string {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .reduce((acc, line) => {
      if (!acc) return line;
      return /[.!?:;…»"]$/.test(acc) || /^[-•●▪]\s/.test(line) ? `${acc}\n${line}` : `${acc} ${line}`;
    }, "");
}

// ---------- EPUB / DOCX (zip based) ----------

async function epubSections(file: File, onProgress?: ImportProgress): Promise<TextSection[]> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const container = await zip.file("META-INF/container.xml")?.async("string");
  const opfPath = container?.match(/full-path="([^"]+)"/)?.[1];
  if (!opfPath) throw new Error(t("import.err.epub"));
  const opf = new DOMParser().parseFromString((await zip.file(opfPath)?.async("string")) ?? "", "application/xml");
  const base = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";
  const manifest = new Map<string, string>();
  opf.querySelectorAll("manifest > item").forEach((it) => manifest.set(it.getAttribute("id") ?? "", it.getAttribute("href") ?? ""));
  const spine = [...opf.querySelectorAll("spine > itemref")].map((r) => manifest.get(r.getAttribute("idref") ?? "")).filter((h): h is string => !!h);
  const sections: TextSection[] = [];
  for (let i = 0; i < spine.length; i++) {
    onProgress?.(t("import.chapter", { i: i + 1, n: spine.length }), (i + 1) / spine.length);
    const path = decodeURIComponent(base + spine[i]).replace(/\/\.\//g, "/");
    const html = await zip.file(path)?.async("string");
    if (html) sections.push(...htmlSections(html));
  }
  return sections;
}

async function docxSections(file: File): Promise<TextSection[]> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error(t("import.err.docx"));
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const sections: TextSection[] = [];
  let cur: TextSection = { text: "" };
  for (const p of Array.from(doc.getElementsByTagNameNS(W, "p"))) {
    const text = Array.from(p.getElementsByTagNameNS(W, "t"))
      .map((t) => t.textContent ?? "")
      .join("")
      .trim();
    if (!text) continue;
    const style = p.getElementsByTagNameNS(W, "pStyle")[0]?.getAttributeNS(W, "val") ?? "";
    if (/^(Heading|Title|Заголовок)/i.test(style)) {
      if (cur.text.trim() || cur.heading) sections.push(cur);
      cur = { heading: text, text: "" };
    } else cur.text += text + "\n\n";
  }
  if (cur.text.trim()) sections.push(cur);
  return sections;
}
