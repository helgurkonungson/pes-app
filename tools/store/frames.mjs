// Store screenshots with captions + the Google Play feature graphic and 512 px icon, in every language.
// Usage: node tools/store/frames.mjs <rawDir from capture.mjs> <outDir> [langs]
// Captions and feature-graphic text come from store/listing/<lang>.json.
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";

const raw = process.argv[2];
const out = process.argv[3] ?? "store-assets";
const LANGS = (process.argv[4] ?? "en,es,de,fr,zh,hi,ru,uk,be").split(",");
const ROOT = new URL("../../", import.meta.url);
const SCREENS = ["1-home", "2-sources", "3-lesson", "4-quiz", "5-courses", "6-progress"];
// target sizes required by the stores
const FRAMES = {
  "google-play/phone": { w: 1080, h: 1920, src: "phone" },
  "google-play/tablet-10in": { w: 1600, h: 2560, src: "tablet" },
  "app-store/iphone-6.9in": { w: 1320, h: 2868, src: "phone" },
  "app-store/ipad-13in": { w: 2064, h: 2752, src: "tablet" },
};

const font = (f) => `data:font/woff2;base64,${readFileSync(new URL(`node_modules/@fontsource-variable/plus-jakarta-sans/files/${f}`, ROOT)).toString("base64")}`;
const FONT_CSS = ["latin", "latin-ext", "cyrillic-ext"]
  .map((s) => `@font-face{font-family:PJS;font-weight:200 800;src:url(${font(`plus-jakarta-sans-${s}-wght-normal.woff2`)}) format("woff2")}`)
  .join("");
const STACK = `PJS, "Noto Sans", "Noto Sans CJK SC", "Noto Sans Devanagari", sans-serif`;
const ICON = `data:image/svg+xml;base64,${readFileSync(new URL("public/icon.svg", ROOT)).toString("base64")}`;
const img = (p) => `data:image/png;base64,${readFileSync(p).toString("base64")}`;

function frameHtml({ w, h }, caption, shot, k) {
  const pad = Math.round(w * 0.075);
  const capSize = Math.round(w * (caption.length > 28 ? 0.062 : 0.072));
  const glow = ["#ffc53a", "#ffb02e", "#ffd25e"][k % 3];
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
  *{margin:0;box-sizing:border-box}
  body{width:${w}px;height:${h}px;overflow:hidden;font-family:${STACK};background:#141517;
    background:radial-gradient(120% 60% at 50% 0%, ${glow}33 0%, #141517 60%), #141517;display:flex;flex-direction:column;align-items:center}
  h1{color:#fff;font-size:${capSize}px;line-height:1.12;font-weight:800;letter-spacing:-.02em;text-align:center;padding:${Math.round(h * 0.06)}px ${pad}px ${Math.round(h * 0.035)}px;max-width:${w}px}
  h1 b{color:#ffc53a}
  .dev{flex:1;width:${w - pad * 2}px;border-radius:${Math.round(w * 0.06)}px ${Math.round(w * 0.06)}px 0 0;border:${Math.round(w * 0.012)}px solid #2c2d31;border-bottom:0;overflow:hidden;box-shadow:0 0 ${Math.round(w * 0.08)}px #0008;background:#141517}
  .dev img{width:100%;display:block}
  </style></head><body><h1>${caption}</h1><div class="dev"><img src="${shot}"></div></body></html>`;
}

function featureHtml(L, shot) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
  *{margin:0;box-sizing:border-box}
  body{width:1024px;height:500px;overflow:hidden;font-family:${STACK};background:linear-gradient(135deg,#ffd25e 0%,#ffc53a 45%,#f5a623 100%);position:relative}
  .txt{position:absolute;left:64px;top:0;bottom:0;width:560px;display:flex;flex-direction:column;justify-content:center;gap:22px}
  .brand{display:flex;align-items:center;gap:18px;font-size:46px;font-weight:800;color:#231a00;letter-spacing:-.02em}
  .brand img{width:88px;height:88px;border-radius:22px;box-shadow:0 8px 24px #0003}
  p{font-size:${L.feature.length > 30 ? 34 : 40}px;line-height:1.15;font-weight:750;color:#231a00;letter-spacing:-.01em}
  .ph{position:absolute;right:70px;top:46px;width:270px;border-radius:34px;border:9px solid #141517;overflow:hidden;transform:rotate(6deg);box-shadow:0 24px 60px #0005;background:#141517}
  .ph img{width:100%;display:block}
  </style></head><body><div class="txt"><div class="brand"><img src="${ICON}">${L.brandName}</div><p>${L.feature}</p></div><div class="ph"><img src="${shot}"></div></body></html>`;
}

const browser = await chromium.launch();
const page = await browser.newPage();
for (const lang of LANGS) {
  const L = JSON.parse(readFileSync(new URL(`store/listing/${lang}.json`, ROOT), "utf8"));
  L.brandName = lang === "ru" ? "Грызи" : "Chompbook";
  for (const [name, f] of Object.entries(FRAMES)) {
    const dir = `${out}/${name}/${lang}`;
    mkdirSync(dir, { recursive: true });
    await page.setViewportSize({ width: f.w, height: f.h });
    for (const [k, s] of SCREENS.entries()) {
      await page.setContent(frameHtml(f, L.captions[k], img(`${raw}/${f.src}/${lang}/${s}.png`), k), { waitUntil: "load" });
      await page.screenshot({ path: `${dir}/${k + 1}.png` });
    }
  }
  mkdirSync(`${out}/google-play/feature-graphic`, { recursive: true });
  await page.setViewportSize({ width: 1024, height: 500 });
  await page.setContent(featureHtml(L, img(`${raw}/phone/${lang}/3-lesson.png`)), { waitUntil: "load" });
  await page.screenshot({ path: `${out}/google-play/feature-graphic/${lang}.png` });
  console.log("ok", lang);
}
// 512 px icon for Google Play (no transparency)
await page.setViewportSize({ width: 512, height: 512 });
await page.setContent(`<body style="margin:0;background:#ffc53a"><img src="${ICON}" style="width:512px;height:512px;display:block"></body>`, { waitUntil: "load" });
await page.screenshot({ path: `${out}/google-play/icon-512.png` });
await browser.close();
