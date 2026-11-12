// @vitest-environment jsdom
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { decodeXmlBytes, fb2Sections, FormatError, isMobi, mobiBook, mobiEncryption, odtSections } from "./formats";
import { htmlSections, importFile } from "./importers";

const utf8 = (s: string): Uint8Array<ArrayBuffer> => new TextEncoder().encode(s);

/** windows-1251 bytes for ASCII + Russian letters (А…я → 0xC0…0xFF). */
function cp1251(s: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from([...s], (ch) => {
    const c = ch.codePointAt(0)!;
    if (c < 0x80) return c;
    if (c >= 0x410 && c <= 0x44f) return 0xc0 + (c - 0x410);
    throw new Error(`no cp1251 for ${ch}`);
  });
}

const FB2 = (enc: string, extra = "") => `<?xml version="1.0" encoding="${enc}"?>
<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0" xmlns:l="http://www.w3.org/1999/xlink">
  <description><title-info><book-title>Тестовая книга</book-title></title-info></description>
  <body>
    <title><p>Автор</p><p>Тестовая книга</p></title>
    <section>
      <title><p>Глава 1</p></title>
      <p>Первый абзац<a l:href="#n1" type="note">[1]</a> главы.</p>
      <p>Второй абзац${extra}.</p>
      <section><title><p>Раздел 1.1</p></title><p>Текст раздела.</p>
        <poem><stanza><v>Строка один</v><v>Строка два</v></stanza></poem>
      </section>
    </section>
  </body>
  <body name="notes"><section id="n1"><p>Сноска, которой не место в уроке.</p></section></body>
</FictionBook>`;

describe("FB2", () => {
  it("reads chapters, nested sections and poems, skipping notes", () => {
    const book = fb2Sections(utf8(FB2("UTF-8")));
    expect(book.title).toBe("Тестовая книга");
    expect(book.sections.map((s) => s.heading)).toEqual(["Глава 1", "Раздел 1.1"]);
    expect(book.sections[0].text).toContain("Первый абзац главы.");
    expect(book.sections[1].text).toContain("Строка один\nСтрока два");
    expect(JSON.stringify(book)).not.toContain("Сноска");
  });
  it("decodes windows-1251 books", () => {
    const bytes = cp1251(FB2("windows-1251"));
    expect(decodeXmlBytes(bytes)).toContain("Глава 1");
    expect(fb2Sections(bytes).sections[0].heading).toBe("Глава 1");
  });
  it("repairs stray ampersands and HTML entities", () => {
    const book = fb2Sections(utf8(FB2("UTF-8", " &mdash; Tom & Jerry&nbsp;show")));
    expect(book.sections[0].text).toContain("Второй абзац — Tom & Jerry show.");
  });
  it("declares namespace prefixes a hand-made book forgot", () => {
    const xml = FB2("UTF-8").replace(' xmlns:l="http://www.w3.org/1999/xlink"', "");
    expect(fb2Sections(utf8(xml)).sections[0].text).toContain("Первый абзац главы.");
  });
  it("refuses a file that isn't FictionBook", () => {
    expect(() => fb2Sections(utf8("<html><body>no</body></html>"))).toThrow(FormatError);
  });
});

const ODT = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">
  <office:body><office:text>
    <text:h text:outline-level="1">Introduction</text:h>
    <text:p>First<text:s/>line<text:tab/>with a <text:span>span</text:span><text:note><text:note-body><text:p>footnote</text:p></text:note-body></text:note>.</text:p>
    <text:list><text:list-item><text:p>List item</text:p></text:list-item></text:list>
    <text:h text:outline-level="2">Details</text:h>
    <text:p>More text.</text:p>
  </office:text></office:body>
</office:document-content>`;

describe("ODT", () => {
  it("reads headings and paragraphs without footnotes", () => {
    const sections = odtSections(ODT);
    expect(sections.map((s) => s.heading)).toEqual(["Introduction", "Details"]);
    expect(sections[0].text).toBe("First line with a span.\n\nList item\n\n");
  });
});

/** A minimal Palm database with a MOBI 6 header and one text record. */
function mobiFile(html: string, { compression = 1, encryption = 0 } = {}): Uint8Array<ArrayBuffer> {
  const text = utf8(html);
  const title = utf8("Kindle Test");
  const header = new Uint8Array(16 + 232);
  const h = new DataView(header.buffer);
  h.setUint16(0, compression);
  h.setUint32(4, text.length);
  h.setUint16(8, 1); // text records
  h.setUint16(10, 4096);
  h.setUint16(12, encryption);
  header.set(utf8("MOBI"), 16);
  h.setUint32(20, 232); // header length
  h.setUint32(24, 2); // book
  h.setUint32(28, 65001); // UTF-8
  h.setUint32(36, 6); // version
  h.setUint32(84, header.length); // title right after the header
  h.setUint32(88, title.length);
  h.setUint32(108, 2); // first resource record
  h.setUint32(112, 0xffffffff);
  h.setUint32(128, 0); // no EXTH
  h.setUint32(240, 0); // no trailing entries
  h.setUint32(244, 0xffffffff); // no index
  const record0 = new Uint8Array(header.length + title.length);
  record0.set(header);
  record0.set(title, header.length);
  const eof = Uint8Array.from([0xe9, 0x8e, 0x0d, 0x0a]);
  const records = [record0, text, eof];
  const start = 78 + records.length * 8 + 2;
  const out = new Uint8Array(start + records.reduce((n, r) => n + r.length, 0));
  const v = new DataView(out.buffer);
  out.set(utf8("Kindle Test"), 0);
  out.set(utf8("BOOKMOBI"), 60);
  v.setUint16(76, records.length);
  let at = start;
  records.forEach((r, i) => {
    v.setUint32(78 + i * 8, at);
    out.set(r, at);
    at += r.length;
  });
  return out;
}

const KINDLE_HTML = "<html><head><guide></guide></head><body><h2>Chapter One</h2><p>Kindle text, plain and simple.</p><mbp:pagebreak/><h2>Chapter Two</h2><p>The second part.</p></body></html>";

describe("MOBI", () => {
  it("recognises the Palm header and the DRM flag", () => {
    expect(isMobi(mobiFile("x"))).toBe(true);
    expect(isMobi(utf8("%PDF-1.7 ".repeat(10)))).toBe(false);
    expect(mobiEncryption(mobiFile("x"))).toBe(0);
    expect(mobiEncryption(mobiFile("x", { encryption: 2 }))).toBe(2);
  });
  it("reads an uncompressed MOBI 6 book", async () => {
    const book = await mobiBook(new Blob([mobiFile(KINDLE_HTML)]), htmlSections);
    expect(book.title).toBe("Kindle Test");
    expect(book.sections.map((s) => s.heading)).toEqual(["Chapter One", "Chapter Two"]);
    expect(book.sections[0].text).toContain("Kindle text, plain and simple.");
  });
  it("reads PalmDOC-compressed text", async () => {
    // ASCII 0x09–0x7f are PalmDOC literals, so plain ASCII is a valid compressed stream
    const book = await mobiBook(new Blob([mobiFile(KINDLE_HTML, { compression: 2 })]), htmlSections);
    expect(book.sections[1].text).toContain("The second part.");
  });
  it("refuses copy-protected books", async () => {
    await expect(mobiBook(new Blob([mobiFile(KINDLE_HTML, { encryption: 2 })]), htmlSections)).rejects.toMatchObject({ code: "drm" });
  });
});

describe("importFile with the new formats", () => {
  it("imports FB2, zipped FB2, ODT and MOBI, titled from the book", async () => {
    const fb2 = await importFile(new File([utf8(FB2("UTF-8"))], "kniga.fb2"));
    expect(fb2).toMatchObject({ kind: "fb2", title: "Тестовая книга" });
    const zip = new JSZip();
    zip.file("kniga.fb2", cp1251(FB2("windows-1251")));
    const zipped = await importFile(new File([await zip.generateAsync({ type: "blob" })], "kniga.fb2.zip"));
    expect(zipped.kind).toBe("fb2");
    expect(zipped.drafts.length).toBeGreaterThan(0);
    const odt = new JSZip();
    odt.file("mimetype", "application/vnd.oasis.opendocument.text");
    odt.file("content.xml", ODT);
    expect((await importFile(new File([await odt.generateAsync({ type: "blob" })], "notes.odt"))).kind).toBe("odt");
    const mobi = await importFile(new File([mobiFile(KINDLE_HTML)], "book.azw3"));
    expect(mobi).toMatchObject({ kind: "mobi", title: "Kindle Test" });
  });
  it("explains DjVu, DRM and unknown binary files instead of importing junk", async () => {
    await expect(importFile(new File([utf8("AT&TFORM")], "scan.djvu"))).rejects.toThrow(/DjVu/);
    await expect(importFile(new File([mobiFile(KINDLE_HTML, { encryption: 1 })], "bought.azw"))).rejects.toThrow(/DRM/);
    await expect(importFile(new File([Uint8Array.from([0x7f, 0x45, 0x4c, 0x46, 0, 0, 0, 1])], "program.bin"))).rejects.toThrow(/isn't supported/);
  });
  it("still reads plain text with an unusual extension", async () => {
    const r = await importFile(new File([utf8("Just some notes about learning. ".repeat(20))], "notes.log"));
    expect(r.kind).toBe("text");
  });
});
