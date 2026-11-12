/**
 * Turns files, pasted text and web pages into text sections for the chunker.
 * Heavy parsers (pdf.js, JSZip, foliate-js) are loaded only when needed.
 */
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { buildChunks, type ChunkDraft, sectionsFromPlainText, type TextSection } from "../core/chunker";
import type { SourceKind } from "../core/types";
import { t, type Key } from "../i18n";
import type { FormatErrorCode } from "./formats";

export interface Imported {
  kind: SourceKind;
  title: string;
  origin: string;
  drafts: ChunkDraft[];
  /** Scanned PDF pages whose text was recognised on the device. */
  ocrPages?: number;
}

export type ImportProgress = (message: string, ratio?: number) => void;

/**
 * Android's file chooser filters by MIME type, and FB2 or Kindle files often have none it knows,
 * so application/octet-stream is accepted too; importFile then refuses what it can't read (1.3.0).
 */
export const ACCEPT = [
  ".pdf,.epub,.docx,.odt,.fb2,.zip,.mobi,.azw,.azw3,.txt,.md,.markdown,.html,.htm,.csv,.djvu",
  "application/pdf,application/epub+zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text",
  "application/x-fictionbook+xml,application/x-fictionbook,application/xml,text/xml,application/zip,application/x-zip-compressed",
  "application/x-mobipocket-ebook,application/vnd.amazon.ebook,application/vnd.amazon.mobi8-ebook",
  "text/plain,text/markdown,text/html,text/csv,image/vnd.djvu,image/x-djvu,application/octet-stream",
].join(",");

const TEXT_EXT = new Set(["txt", "md", "markdown", "csv", "text", "log"]);
const MOBI_EXT = new Set(["mobi", "azw", "azw3", "prc"]);

const stripExt = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").trim();

export async function importFile(file: File, onProgress?: ImportProgress): Promise<Imported> {
  const name = file.name || "file";
  const ext = name.toLowerCase().split(".").pop() ?? "";
  let title = stripExt(name.replace(/\.fb2\.zip$/i, ""));
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
  } else if (ext === "djvu" || ext === "djv") {
    throw new Error(t("import.err.djvu"));
  } else {
    // the rest is recognised by content: the name of a downloaded book can't always be trusted
    const head = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
    const book = await sniffedBook(file, ext, head, onProgress);
    if (book) {
      kind = book.kind;
      sections = book.sections;
      if (book.title) title = book.title;
    } else if (TEXT_EXT.has(ext) || !head.includes(0)) {
      sections = sectionsFromPlainText(await file.text());
    } else throw new Error(t("import.err.unsupported"));
  }
  onProgress?.(t("import.splitting"), 1);
  const drafts = buildChunks(sections, title);
  if (!drafts.length) throw new Error(kind === "pdf" ? t("import.err.pdfEmpty") : t("import.err.empty"));
  return { kind, title, origin: name, drafts, ...(ocrPages ? { ocrPages } : {}) };
}

const FORMAT_ERROR: Record<FormatErrorCode, Key> = { fb2: "import.err.fb2", odt: "import.err.odt", mobi: "import.err.mobi", drm: "import.err.drm" };

/** FB2 (also .fb2.zip), ODT and Kindle books (1.3.0); null when the file is none of them. */
async function sniffedBook(file: File, ext: string, head: Uint8Array, onProgress?: ImportProgress): Promise<{ kind: SourceKind; title?: string; sections: TextSection[] } | null> {
  const formats = await import("./formats");
  try {
    if (MOBI_EXT.has(ext) || formats.isMobi(head)) {
      if (!formats.isMobi(head)) throw new formats.FormatError("mobi", "no Kindle header");
      const book = await formats.mobiBook(file, htmlSections, (i, n) => onProgress?.(t("import.chapter", { i, n }), i / n));
      return { kind: "mobi", ...book };
    }
    const isZip = head[0] === 0x50 && head[1] === 0x4b;
    if (isZip && (ext === "zip" || ext === "fb2" || ext === "odt")) {
      const { default: JSZip } = await import("jszip");
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const content = zip.file("content.xml");
      if (ext === "odt" || (content && zip.file("mimetype"))) {
        const xml = await content?.async("string");
        if (!xml) throw new formats.FormatError("odt", "no content.xml");
        return { kind: "odt", sections: formats.odtSections(xml) };
      }
      const fb2 = zip.file(/\.fb2$/i)[0];
      if (!fb2) return null;
      return { kind: "fb2", ...formats.fb2Sections(await fb2.async("uint8array")) };
    }
    const start = new TextDecoder("latin1").decode(head.subarray(0, 1024));
    if (ext === "fb2" || /<FictionBook[\s>]/.test(start)) return { kind: "fb2", ...formats.fb2Sections(new Uint8Array(await file.arrayBuffer())) };
    if (ext === "odt") throw new formats.FormatError("odt", "not a zip");
    return null;
  } catch (e) {
    if (e instanceof formats.FormatError) {
      const { logEvent } = await import("../data/logs");
      void logEvent("error", `Import ${file.name}: ${e.message}`);
      throw new Error(t(FORMAT_ERROR[e.code]));
    }
    throw e;
  }
}

/** Accepted photo types for "Photo of pages" (1.1.0). */
export const ACCEPT_IMAGES = "image/jpeg,image/png,image/webp,image/heic,image/heif";

/**
 * Photos of book pages (1.1.0): the text is recognised on the phone (the same engine as scanned
 * PDFs) and the photos become one source, a part per photo, in the order picked.
 */
export async function importPhotos(files: File[], title: string, onProgress?: ImportProgress): Promise<Imported> {
  const { looksScanned, startOcr, withTimeout, OCR_START_MS, OCR_PAGE_MS } = await import("./ocr");
  onProgress?.(t("import.ocrPrep"), 0);
  const canvas = document.createElement("canvas");
  const starting = startOcr();
  const sections: TextSection[] = [];
  let ocr: Awaited<ReturnType<typeof startOcr>> | null = null;
  try {
    ocr = await withTimeout(starting, OCR_START_MS, "Text recognition start");
    for (let i = 0; i < files.length; i++) {
      onProgress?.(t("import.ocrPhoto", { i: i + 1, n: files.length }), i / files.length);
      const bmp = await createImageBitmap(files[i]);
      // ~2000 px on the long side, as for scanned PDF pages
      const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
      canvas.width = Math.round(bmp.width * scale);
      canvas.height = Math.round(bmp.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) break;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      bmp.close();
      const text = (await withTimeout(ocr.recognize(canvas), OCR_PAGE_MS, `Text recognition of photo ${i + 1}`)).trim();
      if (!looksScanned(text)) sections.push({ label: t("import.photoN", { n: i + 1 }), text: reflowPdfText(text) });
    }
  } catch (e) {
    if (!ocr) void starting.then((late) => late.close()).catch(() => undefined);
    throw new Error(`${t("import.err.photo")} (${e instanceof Error ? e.message : String(e)})`);
  } finally {
    canvas.width = canvas.height = 0;
    await ocr?.close().catch(() => undefined);
  }
  onProgress?.(t("import.splitting"), 1);
  const drafts = buildChunks(sections, title);
  if (!drafts.length) throw new Error(t("import.err.photoEmpty"));
  return { kind: "text", title, origin: "photos", drafts, ocrPages: sections.length };
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
  const { looksScanned, startOcr, withTimeout, OCR_START_MS, OCR_PAGE_MS } = await import("./ocr");
  const scans = pages.map((p, i) => (looksScanned(p) ? i : -1)).filter((i) => i >= 0);
  let ocrPages = 0;
  if (scans.length) {
    onProgress?.(t("import.ocrPrep"), 0);
    let ocr: Awaited<ReturnType<typeof startOcr>> | null = null;
    const canvas = document.createElement("canvas");
    const starting = startOcr();
    try {
      ocr = await withTimeout(starting, OCR_START_MS, "Text recognition start");
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
        const text = (await withTimeout(ocr.recognize(canvas), OCR_PAGE_MS, `Text recognition of page ${i + 1}`)).trim();
        if (!looksScanned(text)) {
          pages[i] = text;
          ocrPages++;
        }
      }
    } catch (e) {
      // an engine that starts after the timeout is shut down at once
      if (!ocr) void starting.then((late) => late.close()).catch(() => undefined);
      // recognition is a bonus: keep the pages that have text (and those already recognised)
      const { logEvent } = await import("../data/logs");
      void logEvent("error", `OCR: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      canvas.width = canvas.height = 0;
      await ocr?.close().catch(() => undefined);
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
