// Store listing texts: checks every store/listing/<lang>.json against the store limits and writes
// store/listing/<lang>.md — the same texts laid out for copy-pasting into Play Console / App Store Connect.
// Usage: node tools/store/listing-md.mjs        (exits 1 and writes nothing if any text breaks a rule)
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const DIR = new URL("../../store/listing/", import.meta.url);

/** Titles fixed by the owner — change them here only together with the decision. */
const FIXED_TITLES = { en: "Chompbook: AI Study Tutor", ru: "Грызи: ИИ-репетитор и тесты" };
/** Hard limits of Google Play (title, short, full) and the App Store (subtitle, promo, keywords). */
const LIMITS = { title: 30, short: 80, full: 4000, subtitle: 30, promo: 170, keywords: 100 };
/** Screenshot captions and the feature-graphic line are drawn big: longer ones still pass, with a warning. */
const SOFT = { caption: 52, feature: 55 };
const KEYS = ["title", "short", "subtitle", "promo", "keywords", "full", "captions", "feature"];
const SCREENS = ["проверка ответа ИИ", "источники", "урок", "тест", "курсы", "главная с серией"];

/** Language name, Play Console locales that get the same text, App Store Connect localizations. */
const META = {
  en: { name: "English", play: ["en-US", "en-GB", "en-AU", "en-IN", "en-CA"], apple: "English (U.S.), English (U.K.), English (Australia), English (Canada)" },
  es: { name: "Español", play: ["es-ES", "es-419", "es-US"], apple: "Spanish (Spain), Spanish (Mexico)" },
  fr: { name: "Français", play: ["fr-FR", "fr-CA"], apple: "French, French (Canada)" },
  de: { name: "Deutsch", play: ["de-DE"], apple: "German" },
  zh: { name: "中文 (简体)", play: ["zh-CN"], apple: "Chinese (Simplified)" },
  "zh-TW": { name: "中文 (繁體，台灣)", play: ["zh-TW", "zh-HK"], apple: "Chinese (Traditional)" },
  hi: { name: "हिन्दी", play: ["hi-IN"], apple: "Hindi" },
  ru: { name: "Русский", play: ["ru-RU"], apple: "Russian" },
  uk: { name: "Українська", play: ["uk"], apple: "Ukrainian" },
  be: { name: "Беларуская", play: ["be"], apple: null },
};

const len = (s) => [...s].length; // characters (code points), as the stores count them
const words = (s) => s.toLowerCase().split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);
const strings = (o) => (typeof o === "string" ? [o] : Array.isArray(o) ? o.flatMap(strings) : Object.values(o ?? {}).flatMap(strings));

const errors = [];
const warnings = [];
const listings = {};

const files = readdirSync(DIR).filter((f) => f.endsWith(".json")).sort();
for (const file of files) {
  const lang = file.slice(0, -5);
  const err = (m) => errors.push(`${file}: ${m}`);
  if (!META[lang]) {
    err(`unknown language — add it to META in tools/store/listing-md.mjs`);
    continue;
  }
  let L;
  try {
    L = JSON.parse(readFileSync(new URL(file, DIR), "utf8"));
  } catch (e) {
    err(`not valid JSON (${e.message})`);
    continue;
  }
  const extra = Object.keys(L).filter((k) => !KEYS.includes(k));
  if (extra.length) err(`unexpected keys: ${extra.join(", ")}`);
  const missing = KEYS.filter((k) => (k === "captions" ? !Array.isArray(L[k]) : typeof L[k] !== "string" || !L[k].trim()));
  if (missing.length) {
    err(`missing or empty: ${missing.join(", ")}`);
    continue;
  }
  for (const [k, max] of Object.entries(LIMITS)) if (len(L[k]) > max) err(`${k} is ${len(L[k])} characters, the limit is ${max}`);
  for (const k of KEYS) for (const s of strings(L[k])) if (s !== s.trim() || / \n|\n | {2}|\n{3,}/.test(s)) err(`${k}: stray spaces or extra blank lines in "${s.slice(0, 40)}…"`);

  // App Store keywords: comma-separated, no spaces around commas, no repeats, nothing already in the title or subtitle
  const kw = L.keywords.split(",");
  if (/\s,|,\s/.test(L.keywords)) err(`keywords: no spaces around commas`);
  if (kw.some((k) => !k.trim())) err(`keywords: empty item`);
  const dup = kw.filter((k, i) => kw.indexOf(k) !== i);
  if (dup.length) err(`keywords repeated: ${dup.join(", ")}`);
  const taken = new Set([...words(L.title), ...words(L.subtitle)]);
  const clash = kw.flatMap(words).filter((w) => taken.has(w));
  if (clash.length) err(`keywords already in the title or subtitle (wasted characters): ${[...new Set(clash)].join(", ")}`);

  if (L.captions.length !== 6) err(`captions: exactly 6 needed (one per screenshot), found ${L.captions.length}`);
  L.captions.forEach((c, i) => {
    if (typeof c !== "string" || !c.trim()) err(`captions[${i}] is empty`);
    else if (len(c) > SOFT.caption) warnings.push(`${file}: caption ${i + 1} is ${len(c)} characters (keep ≤ ~${SOFT.caption})`);
  });
  if (len(L.feature) > SOFT.feature) warnings.push(`${file}: feature line is ${len(L.feature)} characters (keep ≤ ~${SOFT.feature})`);

  if (FIXED_TITLES[lang] && L.title !== FIXED_TITLES[lang]) err(`title must be "${FIXED_TITLES[lang]}" (owner's decision), found "${L.title}"`);
  if (lang === "ru") {
    const yo = strings(L).filter((s) => /[ёЁ]/.test(s));
    if (yo.length) err(`Russian texts never use ё/Ё — write е: ${yo.map((s) => `"…${s.match(/.{0,15}[ёЁ].{0,15}/s)[0]}…"`).join("; ")}`);
  }
  listings[lang] = L;
}
for (const lang of Object.keys(META)) if (!files.includes(`${lang}.json`)) errors.push(`${lang}.json is missing`);

for (const w of warnings) console.warn(`warning: ${w}`);
if (errors.length) {
  console.error(`Store listing check failed:\n${errors.map((e) => `  ✗ ${e}`).join("\n")}\nNothing was written.`);
  process.exit(1);
}

const block = (s) => "```\n" + s + "\n```";
for (const [lang, L] of Object.entries(listings)) {
  const m = META[lang];
  const [first, ...more] = m.play;
  const play = more.length ? `\`${first}\`, и тот же текст — в ${more.map((x) => `\`${x}\``).join(", ")}` : `\`${first}\``;
  const apple = m.apple ?? "— (белорусского в App Store нет; там используется ru)";
  const md = `# ${m.name} — тексты для магазинов

Google Play: язык ${play} · App Store: ${apple}. Источник: \`${lang}.json\` (здесь — та же информация для копирования). Файл создается командой \`node tools/store/listing-md.mjs\` — правьте JSON, не этот файл.

## Google Play
**Название (≤30, ${len(L.title)}):**
${block(L.title)}
**Краткое описание (≤80, ${len(L.short)}):**
${block(L.short)}
**Полное описание (≤4000, ${len(L.full)}):**
${block(L.full)}

## App Store
**Название (≤30):**
${block(L.title)}
**Подзаголовок (≤30, ${len(L.subtitle)}):**
${block(L.subtitle)}
**Рекламный текст (≤170, ${len(L.promo)}):**
${block(L.promo)}
**Ключевые слова (≤100, ${len(L.keywords)}):**
${block(L.keywords)}
**Описание:** то же, что полное описание Google Play.

## Подписи на скриншотах (1–6) и картинке 1024×500
${L.captions.map((c, i) => `${i + 1}. ${c} _(${SCREENS[i]})_`).join("\n")}

Картинка: «${L.feature}»
`;
  writeFileSync(new URL(`${lang}.md`, DIR), md);
}
console.log(`ok: ${Object.keys(listings).length} languages checked, .md files written (${Object.keys(listings).join(", ")})`);
