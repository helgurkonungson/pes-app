/**
 * Book formats beyond PDF/EPUB/DOCX (1.3.0): FictionBook (FB2, also zipped), OpenDocument text
 * (ODT) and DRM-free Kindle books (MOBI, AZW, AZW3). They all end up as text sections for the
 * chunker. Errors carry a code; importers.ts turns it into the user's language.
 */
import type { TextSection } from "../core/chunker";

export type FormatErrorCode = "fb2" | "odt" | "mobi" | "drm";

export class FormatError extends Error {
  constructor(readonly code: FormatErrorCode, detail?: string) {
    super(detail ? `${code}: ${detail}` : code);
    this.name = "FormatError";
  }
}

export interface Book {
  title?: string;
  sections: TextSection[];
}

const squash = (s: string) => s.replace(/\s+/g, " ").trim();

// ---------- FB2 ----------

/** The encoding named in the XML declaration (FB2 books are often windows-1251), else UTF-8. */
export function decodeXmlBytes(bytes: Uint8Array): string {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return new TextDecoder("utf-8").decode(bytes.subarray(3));
  if ((bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff)) return new TextDecoder(bytes[0] === 0xff ? "utf-16le" : "utf-16be").decode(bytes);
  const head = String.fromCharCode(...bytes.subarray(0, 200));
  const label = head.match(/^<\?xml[^>]*encoding\s*=\s*["']([\w.:-]+)["']/i)?.[1] ?? "utf-8";
  try {
    return new TextDecoder(label).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

/** Named HTML entities that FB2 files written by hand use although XML doesn't define them. */
const ENTITIES: Record<string, string> = { nbsp: " ", mdash: "—", ndash: "–", laquo: "«", raquo: "»", hellip: "…", copy: "©", shy: "", bdquo: "„", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’", middot: "·", deg: "°", times: "×" };
const XML_ENTITIES = new Set(["amp", "lt", "gt", "quot", "apos"]);

/** Common faults of hand-made FB2 files: HTML entities, bare "&", undeclared prefixes like l:href. */
function repairXml(xml: string): string {
  const declared = new Set([...xml.matchAll(/xmlns:([\w-]+)\s*=/g)].map((m) => m[1]));
  const used = new Set([...xml.matchAll(/[\s<]([A-Za-z][\w-]*):[\w-]+(?=[\s=>/])/g)].map((m) => m[1]));
  const missing = [...used].filter((p) => p !== "xml" && p !== "xmlns" && !declared.has(p));
  const withNs = missing.length ? xml.replace(/<FictionBook\b/, `<FictionBook ${missing.map((p) => `xmlns:${p}="urn:chompbook:${p}"`).join(" ")}`) : xml;
  return withNs
    .replace(/&([a-z]+);/gi, (m, name: string) => (XML_ENTITIES.has(name) ? m : (ENTITIES[name] ?? m)))
    .replace(/&(?!(?:#\d+|#x[0-9a-f]+|amp|lt|gt|quot|apos);)/gi, "&amp;");
}

function parseXml(xml: string): Document | null {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  return doc.getElementsByTagName("parsererror").length ? null : doc;
}

const local = (el: Element) => el.localName.toLowerCase();
const childElements = (el: Element) => Array.from(el.children);

/** Text of an FB2 element; footnote references ("[1]") are dropped. */
function fb2Text(el: Element): string {
  let out = "";
  el.childNodes.forEach((n) => {
    if (n.nodeType === 3) out += n.nodeValue ?? "";
    else if (n.nodeType === 1) {
      const e = n as Element;
      const type = e.getAttribute("type") ?? e.getAttributeNS("http://www.w3.org/1999/xlink", "type") ?? "";
      if (local(e) === "a" && type === "note") return;
      out += fb2Text(e);
    }
  });
  return out;
}

export function fb2Sections(bytes: Uint8Array): Book {
  const xml = decodeXmlBytes(bytes);
  const doc = parseXml(xml) ?? parseXml(repairXml(xml));
  if (!doc || local(doc.documentElement) !== "fictionbook") throw new FormatError("fb2");
  const all = (name: string) => Array.from(doc.getElementsByTagNameNS("*", name));
  const titleInfo = all("title-info")[0];
  const bookTitle = titleInfo ? childElements(titleInfo).find((e) => local(e) === "book-title") : undefined;

  const sections: TextSection[] = [];
  let cur: TextSection = { text: "" };
  const flush = () => {
    if (cur.text.trim() || (cur.heading && sections.length === 0)) sections.push(cur);
  };
  const line = (s: string) => {
    const text = squash(s);
    if (text) cur.text += text + "\n\n";
  };
  const walk = (el: Element) => {
    for (const child of childElements(el)) {
      switch (local(child)) {
        case "title": {
          const heading = childElements(child).map((p) => squash(fb2Text(p))).filter(Boolean).join(". ") || squash(fb2Text(child));
          if (!heading) break;
          flush();
          cur = { heading, text: "" };
          break;
        }
        case "p":
        case "subtitle":
        case "text-author":
          line(fb2Text(child));
          break;
        case "v":
          // poem lines stay lines
          cur.text += squash(fb2Text(child)) + "\n";
          break;
        case "stanza":
          walk(child);
          cur.text += "\n";
          break;
        case "tr":
          line(childElements(child).map((td) => squash(fb2Text(td))).join(" | "));
          break;
        case "section":
        case "poem":
        case "cite":
        case "epigraph":
        case "table":
          walk(child);
          break;
        default:
          break; // image, empty-line, binary…
      }
    }
  };
  for (const body of all("body")) {
    const name = body.getAttribute("name") ?? "";
    if (/^(notes|comments|footnotes)$/i.test(name)) continue;
    walk(body);
  }
  flush();
  const nonEmpty = sections.filter((s) => s.text.trim());
  return { title: bookTitle ? squash(bookTitle.textContent ?? "") || undefined : undefined, sections: nonEmpty };
}

// ---------- ODT ----------

const ODT_TEXT = "urn:oasis:names:tc:opendocument:xmlns:text:1.0";

function odtText(el: Element): string {
  let out = "";
  el.childNodes.forEach((n) => {
    if (n.nodeType === 3) out += n.nodeValue ?? "";
    else if (n.nodeType === 1) {
      const e = n as Element;
      if (e.namespaceURI === ODT_TEXT) {
        if (e.localName === "s") {
          out += " ".repeat(Math.max(1, Number(e.getAttributeNS(ODT_TEXT, "c")) || 1));
          return;
        }
        if (e.localName === "tab" || e.localName === "line-break") {
          out += " ";
          return;
        }
        // footnotes and their citations would break the sentence
        if (e.localName === "note" || e.localName === "tracked-changes") return;
      }
      out += odtText(e);
    }
  });
  return out;
}

/** content.xml of an .odt → sections, with text:h headings. */
export function odtSections(contentXml: string): TextSection[] {
  const doc = parseXml(contentXml);
  if (!doc) throw new FormatError("odt");
  const sections: TextSection[] = [];
  let cur: TextSection = { text: "" };
  for (const el of Array.from(doc.getElementsByTagNameNS(ODT_TEXT, "*"))) {
    if (el.localName !== "p" && el.localName !== "h") continue;
    // paragraphs inside notes or inside another paragraph are skipped (already counted or footnotes)
    let up = el.parentElement;
    let nested = false;
    while (up) {
      if (up.namespaceURI === ODT_TEXT && (up.localName === "p" || up.localName === "h" || up.localName === "note")) nested = true;
      up = up.parentElement;
    }
    if (nested) continue;
    const text = squash(odtText(el));
    if (!text) continue;
    if (el.localName === "h") {
      if (cur.text.trim() || cur.heading) sections.push(cur);
      cur = { heading: text, text: "" };
    } else cur.text += text + "\n\n";
  }
  if (cur.text.trim()) sections.push(cur);
  return sections;
}

// ---------- MOBI / AZW / AZW3 ----------

/** True for a Palm database holding a Kindle book. */
export function isMobi(head: Uint8Array): boolean {
  return head.length >= 68 && String.fromCharCode(...head.subarray(60, 68)) === "BOOKMOBI";
}

/** The PalmDOC "encryption" field of record 0: 0 = none, 1/2 = DRM. */
export function mobiEncryption(bytes: Uint8Array): number {
  if (bytes.length < 86) return 0;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const record0 = view.getUint32(78);
  return record0 + 14 <= bytes.length ? view.getUint16(record0 + 12) : 0;
}

/**
 * Kindle books are read with foliate-js (MIT), which handles PalmDOC and HUFF/CDIC compression,
 * old MOBI and KF8 (AZW3, also inside "combo" files). Each part becomes HTML for htmlSections.
 */
export async function mobiBook(file: Blob, htmlSections: (html: string) => TextSection[], onPart?: (i: number, n: number) => void): Promise<Book> {
  const bytes = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
  if (!isMobi(bytes)) throw new FormatError("mobi", "not a Kindle book");
  if (mobiEncryption(bytes)) throw new FormatError("drm");
  const { MOBI } = await import("foliate-js/mobi.js");
  const reader = new MOBI({ unzlib: async () => { throw new Error("fonts are not needed"); } });
  let book: Awaited<ReturnType<typeof reader.open>>;
  try {
    book = await reader.open(file);
  } catch (e) {
    if (reader.headers?.palmdoc?.encryption) throw new FormatError("drm");
    throw new FormatError("mobi", e instanceof Error ? e.message : String(e));
  }
  const serializer = new XMLSerializer();
  const sections: TextSection[] = [];
  for (let i = 0; i < book.sections.length; i++) {
    onPart?.(i + 1, book.sections.length);
    try {
      const doc = await book.sections[i].createDocument();
      sections.push(...htmlSections(serializer.serializeToString(doc)));
    } catch {
      // a damaged part is skipped; the rest of the book is still useful
    }
  }
  const title = typeof book.metadata?.title === "string" ? squash(book.metadata.title) : "";
  return { title: title || undefined, sections };
}
