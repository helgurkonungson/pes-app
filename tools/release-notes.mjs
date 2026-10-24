// Prints the release notes for a version: node tools/release-notes.mjs 0.9.0
// Russian section from CHANGELOG.ru.md, English from CHANGELOG.md, each behind a
// <!--lang:xx--> marker, so the app's update pop-up shows the notes in the UI language
// (src/core/updateCheck.ts → notesForLang). GitHub hides the markers.
import { existsSync, readFileSync } from "node:fs";

const version = process.argv[2];

function section(file) {
  const url = new URL(`../${file}`, import.meta.url);
  if (!existsSync(url)) return "";
  const lines = readFileSync(url, "utf8").split("\n");
  const start = lines.findIndex((l) => l.startsWith(`## ${version}`) || l.startsWith(`## [${version}]`));
  if (start === -1) return "";
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith("## "));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();
}

const ru = section("CHANGELOG.ru.md");
const en = section("CHANGELOG.md") || `Chompbook ${version}`;
console.log(ru ? `<!--lang:ru-->\n${ru}\n\n---\n\n<!--lang:en-->\n${en}` : en);
