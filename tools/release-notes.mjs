// Prints the CHANGELOG.md section for a version: node tools/release-notes.mjs 0.1.0
import { readFileSync } from "node:fs";

const version = process.argv[2];
const text = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");
const lines = text.split("\n");
const start = lines.findIndex((l) => l.startsWith(`## ${version}`) || l.startsWith(`## [${version}]`));
if (start === -1) {
  console.log(`PES ${version}`);
} else {
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith("## "));
  console.log((end === -1 ? rest : rest.slice(0, end)).join("\n").trim());
}
