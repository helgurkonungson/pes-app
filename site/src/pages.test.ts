// chompbook.online static pages: generated files are up to date, every language has every text,
// and every internal link points to a page or file that exists.
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = join(__dirname, "..");
const PUB = join(ROOT, "public");
const load = async (l: string): Promise<unknown> => (await import(pathToFileURL(join(ROOT, "gen", "i18n", `${l}.mjs`)).href)).default;
const LANGS = ["en", "ru", "uk", "be", "es", "de", "fr", "zh", "hi"];

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? htmlFiles(p) : n.endsWith(".html") ? [p] : [];
  });
}

/** Shape of an object as a sorted list of key paths (arrays: their length counts). */
function shape(o: unknown, path = ""): string[] {
  if (Array.isArray(o)) return [`${path}[${o.length}]`, ...o.flatMap((v, i) => shape(v, `${path}[${i}]`))];
  if (o && typeof o === "object") return Object.keys(o).sort().flatMap((k) => shape((o as Record<string, unknown>)[k], `${path}.${k}`));
  return [path];
}

describe("site pages", () => {
  it("are regenerated from site/gen (run: node site/gen/build.mjs)", () => {
    expect(() => execFileSync("node", [join(ROOT, "gen", "build.mjs"), "--check"], { stdio: "pipe" })).not.toThrow();
  });

  it("have every site text in all nine languages", async () => {
    const en = await load("en");
    for (const l of LANGS) {
      const t = await load(l);
      expect(shape(t), l).toEqual(shape(en));
      const caps = JSON.parse(readFileSync(join(ROOT, "..", "store", "listing", `${l}.json`), "utf8")).captions;
      expect(caps).toHaveLength(6);
      for (let i = 1; i <= 6; i++) expect(existsSync(join(PUB, "img", "shots", l, `${i}.webp`)), `${l}/${i}.webp`).toBe(true);
    }
  });

  it("link only to pages and files that exist", () => {
    const redirects = readFileSync(join(PUB, "_redirects"), "utf8").split("\n").filter((x) => x && !x.startsWith("#")).map((x) => x.split(/\s+/)[0]);
    const broken: string[] = [];
    for (const f of htmlFiles(PUB)) {
      const html = readFileSync(f, "utf8");
      for (const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
        const u = m[1];
        if (u.startsWith("/api/") || redirects.includes(u)) continue;
        const target = u.endsWith("/") ? join(PUB, u, "index.html") : join(PUB, u);
        if (!existsSync(target)) broken.push(`${f.slice(PUB.length)} → ${u}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it("never show a placeholder instead of the publisher's details", () => {
    for (const f of htmlFiles(PUB)) expect(readFileSync(f, "utf8"), f).not.toMatch(/\[(ИНН|АДРЕС|TIN|ADDRESS)\]|undefined/);
  });
});
