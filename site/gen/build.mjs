#!/usr/bin/env node
// Builds the static pages of chompbook.online into site/public (no dependencies).
//   node site/gen/build.mjs          — write the pages
//   node site/gen/build.mjs --check  — fail if the committed pages differ from the sources (used by the test)
// Sources: config.mjs (publisher, stores), i18n/<lang>.mjs (site texts), docs/*.mjs (documents),
// store/listing/<lang>.json (screenshot captions — the same as in the stores).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE, DOCS_DATE, SELLER, STORES, LANGS } from "./config.mjs";
import { I } from "./icons.mjs";
import * as EN from "./docs/en.mjs";
import * as RU from "./docs/ru.mjs";
import * as CIS from "./docs/cis.mjs";
import SUMMARIES from "./docs/summaries.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const PUB = join(here, "..", "public");
const REPO = join(here, "..", "..");
const CHECK = process.argv.includes("--check");

const T = {};
for (const l of LANGS) T[l.id] = (await import(`./i18n/${l.id}.mjs`)).default;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pre = (lang) => (lang === "en" ? "" : `/${lang}`);
const DOC_IDS = ["privacy", "terms", "support", "delete-data"];
const FULL = { en: EN, ru: RU };
const docKey = { privacy: "privacy", terms: "terms", support: "support", "delete-data": "deleteData" };
const LOCALE = Object.fromEntries(LANGS.map((l) => [l.id, l.locale]));
const fmtDate = (lang, iso) => new Intl.DateTimeFormat(LOCALE[lang], { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso + "T12:00:00Z"));

/** path of the same page in each language (null = page doesn't exist in that language) */
const alt = (fn) => Object.fromEntries(LANGS.map((l) => [l.id, fn(l.id)]));

// ---------------------------------------------------------------- shell

function head({ lang, title, desc, path, alternates, og }) {
  const links = alternates
    ? Object.entries(alternates).filter(([, p]) => p).map(([l, p]) => `<link rel="alternate" hreflang="${l}" href="${SITE}${p}">`).join("\n") +
      (alternates.en ? `\n<link rel="alternate" hreflang="x-default" href="${SITE}${alternates.en}">` : "")
    : "";
  return `<!doctype html>
<html lang="${lang}" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${path}">
${links}
<meta name="theme-color" content="#141517" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#f5f4f0" media="(prefers-color-scheme: light)">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Chompbook">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}${path}">
<meta property="og:image" content="${SITE}/img/og/${og || lang}.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/img/icon-64.png" sizes="64x64" type="image/png">
<link rel="apple-touch-icon" href="/img/icon-180.png">
<link rel="preload" href="/fonts/plus-jakarta-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css">
<script>document.documentElement.classList.remove("no-js")</script>
</head>`;
}

function header(lang, alternates, homeHref) {
  const t = T[lang];
  const p = pre(lang);
  const items = LANGS.map((l) => {
    const href = (alternates && alternates[l.id]) || `${pre(l.id)}/`;
    return `<li><a href="${href}" hreflang="${l.id}" lang="${l.id}" data-lang="${l.id}"${l.id === lang ? ' aria-current="true"' : ""}>${l.label}<span>${l.id}</span></a></li>`;
  }).join("");
  const cur = LANGS.find((l) => l.id === lang);
  return `<header class="top"><div class="wrap">
<a class="brand" href="${homeHref || p + "/"}"><img src="/img/icon-64.png" alt="" width="34" height="34">${t.brand}${lang === "ru" ? " <small>Chompbook</small>" : ""}</a>
<nav class="nav" aria-label="Main">
<a href="${p}/#how">${t.nav.how}</a><a href="${p}/#features">${t.nav.features}</a><a href="${p}/#pro">${t.nav.pro}</a><a href="${p}/#faq">${t.nav.faq}</a><a href="${p}/docs/">${t.nav.docs}</a>
</nav>
<details class="lang-pick"><summary aria-label="${esc(t.langLabel)}">${I.globe}${cur.label}</summary><ul>${items}</ul></details>
</div></header>`;
}

function footer(lang) {
  const t = T[lang];
  const p = pre(lang);
  const dn = t.docs.names;
  const s = lang === "ru" ? SELLER.ru : SELLER.en;
  return `<footer class="foot"><div class="wrap">
<div class="cols">
<div>
<a class="brand" href="${p}/"><img src="/img/icon-64.png" alt="" width="34" height="34">${t.brand}</a>
<p>${esc(t.foot.tagline)}</p>
<p>${t.foot.contact}: <a href="mailto:${SELLER.support}">${SELLER.support}</a></p>
<p class="seller">${t.foot.seller}: ${esc(s.nameShort || s.name)} · ${t.foot.reg} ${SELLER.regNo} · ${t.foot.tin} ${SELLER.tin}<br>${esc(s.address)}</p>
</div>
<div><h4>${t.foot.docs}</h4><ul>
<li><a href="${docHref(lang, "privacy")}">${dn.privacy[0]}</a></li>
<li><a href="${docHref(lang, "terms")}">${dn.terms[0]}</a></li>
<li><a href="${docHref(lang, "delete-data")}">${dn["delete-data"][0]}</a></li>
<li><a href="/cis/">${dn.cis[0]}</a></li>
</ul></div>
<div><h4>${t.foot.app}</h4><ul>
<li><a href="${docHref(lang, "support")}">${dn.support[0]}</a></li>
<li><a href="${p}/#faq">${t.nav.faq}</a></li>
<li><a href="${STORES.apk.url}">${t.store.apk}</a></li>
<li><a href="${p}/docs/">${t.nav.docs}</a></li>
</ul></div>
</div>
<p class="seller">© 2026 ${esc(s.nameShort || s.name)}</p>
</div></footer>`;
}

// Typography: a line never ends with a short preposition, conjunction or article — it moves to the next
// line together with the following word (non-breaking space). Also no line starts with a dash.
const SHORT = {
  ru: "а|в|во|и|к|ко|о|об|обо|от|ото|с|со|у|по|до|из|за|на|над|под|при|про|для|без|не|ни|но|да|или|что|как|из-за|чем",
  uk: "а|в|у|і|й|з|зі|із|о|об|від|по|до|за|на|над|під|при|про|для|без|не|ні|але|та|чи|що|як",
  be: "а|в|ва|у|і|й|з|са|ад|аб|па|да|за|на|над|пад|пры|пра|для|без|не|ні|але|ці|што|як",
  en: "a|an|the|of|to|in|on|at|by|for|and|or|but|with|from|into",
  es: "a|al|de|del|el|la|las|los|un|una|y|o|en|con|por|para|que|sin",
  de: "a|an|am|auf|aus|bei|das|dem|den|der|des|die|ein|eine|einen|im|in|mit|und|oder|von|vor|zu|zum|zur|für",
  fr: "a|à|au|aux|de|des|du|en|et|la|le|les|ou|par|sur|un|une",
};
function typo(lang, html) {
  const list = SHORT[lang];
  if (!list) return html;
  const re = new RegExp(`(^|[\\s\u00a0(«„"“—–-])(${list}) +(?=[^\\s<])`, "giu");
  // only text between tags, never inside <script>, <style>, <code> or tag attributes
  return html.replace(/(<(script|style|code)\b[\s\S]*?<\/\2>)|(<[^>]+>)|([^<]+)/g, (m, block, _t, tag, text) => {
    if (block || tag) return m;
    let out = text.replace(re, (_, pre, w) => `${pre}${w}\u00a0`);
    out = out.replace(re, (_, pre, w) => `${pre}${w}\u00a0`); // second pass for "и в", "не на" …
    return out.replace(/ ([—–]) /g, "\u00a0$1 ");
  });
}

const page = (o) => typo(o.lang, `${head(o)}
<body${o.bodyClass ? ` class="${o.bodyClass}"` : ""}>
<a class="skip" href="#main">${T[o.lang].skip}</a>
${header(o.lang, o.alternates, o.homeHref)}
<main id="main">
${o.body}
</main>
${footer(o.lang)}
<script src="/site.js" defer></script>
</body>
</html>
`);

const docHref = (lang, id) => `${pre(lang)}/${id}/`;

// ---------------------------------------------------------------- landing

function storeButtons(lang) {
  const t = T[lang].store;
  const b = (key, name, icon) => {
    const s = STORES[key];
    const live = s.status === "live" && s.url;
    const sub = live ? t.getOn : t.soon;
    const tag = live ? `a href="${s.url}" rel="noopener"` : `span aria-disabled="true"`;
    const end = live ? "a" : "span";
    return `<${tag} class="btn store${live ? "" : " soon"}">${icon}<span class="two"><small>${esc(sub)}</small>${name}</span></${end}>`;
  };
  return `<div class="stores">
${b("play", "Google Play", I.play)}
${b("appStore", "App Store", I.phone)}
${lang === "ru" || lang === "be" || lang === "uk" ? b("ruStore", "RuStore", I.bag) : ""}
</div>`;
}

/** Labels of the open-question screen, taken from the app's own dictionaries so the demo matches the app. */
function appLabels(lang) {
  const src = readFileSync(join(REPO, "src", "i18n", `${lang}.ts`), "utf8");
  const get = (k) => {
    const m = src.match(new RegExp(`"${k.replace(".", "\\.")}":\\s*"((?:[^"\\\\]|\\\\.)*)"`));
    if (!m) throw new Error(`missing ${k} in src/i18n/${lang}.ts`);
    return JSON.parse(`"${m[1]}"`);
  };
  return { kicker: get("open.kicker"), check: get("open.checkAi"), score: get("open.aiScore"), worked: get("open.worked"), improve: get("open.improve") };
}

function aiSection(lang) {
  const t = T[lang].ai;
  const L = appLabels(lang);
  return `
<section id="ai" class="ai-sec"><div class="wrap ai-grid">
<div class="reveal">
<span class="kicker">${esc(t.kicker)}</span>
<h2>${esc(t.h2)}</h2>
<p class="ai-p">${esc(t.p)}</p>
<ul class="ai-points">${t.points.map((x, i) => `<li><span class="num">${i + 1}</span><span>${esc(x)}</span></li>`).join("")}</ul>
</div>
<div class="demo reveal" style="--d:.12s" data-demo>
<div class="demo-card">
<div class="demo-kicker">${I.pen}${esc(L.kicker)}</div>
<p class="demo-q">${esc(t.q)}</p>
<div class="demo-answer"><span class="typed" data-text="${esc(t.a)}">${esc(t.a)}</span><i class="caret"></i></div>
<div class="demo-btn"><span>${I.sparkle}${esc(L.check)}</span><i class="shimmer"></i></div>
</div>
<div class="demo-result">
<div class="score"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="33" class="track"/><circle cx="40" cy="40" r="33" class="val"/></svg><b data-score="8">8</b></div>
<div class="score-label">${esc(L.score)}</div>
</div>
<div class="fb good">${I.check}<div><b>${esc(L.worked)}</b><p>${esc(t.worked)}</p></div></div>
<div class="fb warn">${I.target}<div><b>${esc(L.improve)}</b><p>${esc(t.improve)}</p></div></div>
</div>
</div></section>`;
}

function captions(lang) {
  const f = join(REPO, "store", "listing", `${lang}.json`);
  return JSON.parse(readFileSync(f, "utf8")).captions;
}

function landing(lang) {
  const t = T[lang];
  const p = pre(lang);
  const caps = captions(lang);
  const h1 = esc(t.hero.h1).replace(/\{(.+?)\}/, (_, w) =>
    `<span class="hl">${w}<svg viewBox="0 0 300 20" preserveAspectRatio="none"><path d="M4 14 C 60 4, 120 4, 170 10 S 260 16, 296 6"/></svg></span>`);
  const featIcons = [I.book, I.target, I.repeat, I.sound, I.sparkle, I.wifiOff];
  const courseIcons = [[I.brain, "var(--accent-soft)", "var(--accent-ink)"], [I.chip, "var(--info-soft)", "var(--info)"], [I.table, "rgba(110,231,168,.14)", "var(--good)"], [I.coin, "rgba(255,162,92,.15)", "var(--warn)"], [I.scale, "rgba(255,143,163,.15)", "var(--worm)"]];
  const shot = (n, cls = "") => `<img${cls ? ` class="${cls}"` : ""} src="/img/shots/${lang}/${n}.webp" alt="" width="600" height="1150" decoding="async">`;
  const ld = {
    "@context": "https://schema.org", "@type": "MobileApplication", name: "Chompbook", alternateName: "Грызи",
    operatingSystem: "Android", applicationCategory: "EducationalApplication", inLanguage: LANGS.map((l) => l.id),
    description: t.desc, url: `${SITE}${p}/`, image: `${SITE}/img/icon-192.png`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: { "@type": "Person", name: SELLER.en.name },
  };
  return `
<section class="hero"><div class="wrap">
<div>
<span class="eyebrow"><i></i>${esc(t.hero.eyebrow)}</span>
<h1>${h1}</h1>
<p class="lead">${esc(t.hero.lead)}</p>
${storeButtons(lang)}
<p class="apk">${esc(t.hero.apk)} <a href="${STORES.apk.url}" rel="noopener">${esc(t.hero.apkLink)}</a></p>
<ul class="ticks">${t.hero.ticks.map((x) => `<li>${I.check}${esc(x)}</li>`).join("")}</ul>
</div>
<div class="stage" aria-hidden="true">
<div class="phone back"><div class="screen">${shot(5, "on")}</div></div>
<div class="phone"><div class="screen" data-rotate>${shot(1, "on")}${shot(3)}${shot(4)}${shot(6)}</div></div>
<div class="chip c1"><span class="ic">${I.bolt}</span><span>${esc(t.chips.xp)}<small>${esc(t.chips.xpSub)}</small></span></div>
<div class="chip c2"><span class="ic">${I.flame}</span><span>${esc(t.chips.streak)}<small>${esc(t.chips.streakSub)}</small></span></div>
<div class="chip c3"><span class="ic">${I.check}</span><span>${esc(t.chips.ok)}<small>${esc(t.chips.okSub)}</small></span></div>
</div>
</div></section>
${aiSection(lang)}
<section id="how"><div class="wrap">
<div class="sec-head reveal"><span class="kicker">${esc(t.how.kicker)}</span><h2>${esc(t.how.h2)}</h2><p>${esc(t.how.p)}</p></div>
<div class="steps">
${t.how.steps.map((s, i) => `<div class="step reveal" style="--d:${i * 0.12}s"><div class="n">${i + 1}</div><h3>${esc(s.t)}</h3><p>${esc(s.p)}</p>${
    i === 1 ? `<div class="minutes" data-minutes><span>5</span><span class="on">15</span><span>30</span><span>60</span></div>` : `<div class="bar"><i style="--w:${i === 0 ? 38 : 100}%"></i></div>`}</div>`).join("\n")}
</div>
</div></section>

<section id="features"><div class="wrap">
<div class="sec-head reveal"><span class="kicker">${esc(t.features.kicker)}</span><h2>${esc(t.features.h2)}</h2><p>${esc(t.features.p)}</p></div>
<div class="features">
${t.features.items.map((f, i) => `<div class="feat reveal" style="--d:${(i % 3) * 0.1}s"><div class="ic">${featIcons[i]}</div><h3>${esc(f.t)}</h3><p>${esc(f.p)}</p></div>`).join("\n")}
</div>
</div></section>

<section id="screens" class="gallery"><div class="wrap">
<div class="sec-head reveal"><span class="kicker">${esc(t.gallery.kicker)}</span><h2>${esc(t.gallery.h2)}</h2></div>
<div class="shots" data-shots tabindex="0">
${caps.map((c, i) => `<figure class="shot reveal" style="--d:${i * 0.07}s"><div class="frame"><img src="/img/shots/${lang}/${i + 1}.webp" alt="${esc(c)}" width="600" height="1140" loading="lazy" decoding="async"></div><figcaption>${esc(c)}</figcaption></figure>`).join("\n")}
</div>
</div></section>

<section id="courses"><div class="wrap">
<div class="sec-head reveal"><span class="kicker">${esc(t.courses.kicker)}</span><h2>${esc(t.courses.h2)}</h2><p>${esc(t.courses.p)}</p></div>
<div class="courses">
${t.courses.items.map((c, i) => `<div class="course reveal" style="--d:${i * 0.08}s"><div class="ic" style="background:${courseIcons[i][1]};color:${courseIcons[i][2]}">${courseIcons[i][0]}</div><h3>${esc(c.t)}</h3><p>${esc(c.p)}</p></div>`).join("\n")}
</div>
</div></section>

<section id="pro"><div class="wrap split">
<div class="panel reveal"><span class="shield">${I.shield}</span><span class="kicker">${esc(t.privacy.kicker)}</span><h3>${esc(t.privacy.h)}</h3><p>${esc(t.privacy.p)}</p>
<ul>${t.privacy.items.map((x) => `<li>${I.check}<span>${esc(x)}</span></li>`).join("")}</ul>
<p style="margin:18px 0 0"><a href="${docHref(lang, "privacy")}">${esc(t.docs.names.privacy[0])} →</a></p></div>
<div class="panel pro reveal" style="--d:.12s"><span class="kicker">${esc(t.pro.kicker)}</span><h3>${esc(t.pro.h)}</h3><p>${esc(t.pro.p)}</p>
<ul>${t.pro.items.map((x) => `<li>${I.check}<span>${esc(x)}</span></li>`).join("")}</ul>
<span class="price">${esc(t.pro.price)}</span></div>
</div></section>

<section id="languages"><div class="wrap">
<div class="sec-head center reveal"><span class="kicker">${esc(t.langs.kicker)}</span><h2>${esc(t.langs.h2)}</h2></div>
<div class="langs reveal">${LANGS.map((l) => `<a href="${pre(l.id)}/" hreflang="${l.id}" lang="${l.id}" data-lang="${l.id}"${l.id === lang ? ' aria-current="true"' : ""}>${l.label}</a>`).join("")}</div>
</div></section>

<section id="faq"><div class="wrap">
<div class="sec-head center reveal"><span class="kicker">${esc(t.faq.kicker)}</span><h2>${esc(t.faq.h2)}</h2></div>
<div class="faq">
${t.faq.items.map((f, i) => `<details class="reveal" style="--d:${i * 0.06}s"${i === 0 ? " open" : ""}><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("\n")}
</div>
</div></section>

<section><div class="wrap">
<div class="cta reveal"><img src="/img/icon-192.png" alt="" width="84" height="84"><h2>${esc(t.cta.h2)}</h2><p class="muted">${esc(t.cta.p)}</p>${storeButtons(lang)}</div>
</div></section>
<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

// ---------------------------------------------------------------- documents

let hid = 0;
function withToc(html, contentsLabel) {
  const slugs = new Set();
  const toc = [];
  const body = html.replace(/<h2>(.*?)<\/h2>/g, (_, h) => {
    let id = h.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 48) || `s${++hid}`;
    while (slugs.has(id)) id += "-2";
    slugs.add(id);
    toc.push(`<li><a href="#${id}">${h}</a></li>`);
    return `<h2 id="${id}">${h}</h2>`;
  });
  if (toc.length < 3) return `<div class="doc-layout" style="grid-template-columns:1fr"><article class="doc">${body}</article></div>`;
  return `<div class="doc-layout"><nav class="toc" aria-label="${esc(contentsLabel)}"><b>${esc(contentsLabel)}</b><ol>${toc.join("")}</ol></nav><article class="doc">${body}</article></div>`;
}

function docPage(lang, id, { title, html, crumbHref, crumbLabel, alternates, extraMeta = "", desc, path }) {
  const t = T[lang];
  const body = `<div class="wrap">
<div class="doc-hero">
<div class="crumbs"><a href="${pre(lang)}/">${esc(t.docs.home)}</a> / <a href="${crumbHref}">${esc(crumbLabel)}</a></div>
<h1>${esc(title)}</h1>
<p class="meta">${esc(t.docs.effective)} ${fmtDate(lang, DOCS_DATE)}${extraMeta}</p>
</div>
${withToc(html, t.docs.contents)}
</div>`;
  return page({ lang, title: `${title} — ${t.brand}`, desc: desc || title, path: path || alternates?.[lang] || `${pre(lang)}/${id}/`, alternates, body });
}

function langSwitch(lang, alternates) {
  const t = T[lang];
  const other = LANGS.filter((l) => l.id !== lang && alternates[l.id]);
  return ` · ${esc(t.docs.otherLangs)}: ${other.map((l) => `<a href="${alternates[l.id]}" lang="${l.id}" hreflang="${l.id}">${l.label}</a>`).join(", ")}`;
}

function docsHub(lang) {
  const t = T[lang];
  const p = pre(lang);
  const icons = { privacy: I.lock, terms: I.doc, support: I.help, "delete-data": I.trash, cis: I.building };
  const tile = (href, key) => `<a class="doc-tile reveal" href="${href}"><span class="ic">${icons[key]}</span><b>${esc(t.docs.names[key][0])}</b><span>${esc(t.docs.names[key][1])}</span></a>`;
  const body = `<div class="wrap">
<div class="doc-hero"><div class="crumbs"><a href="${p}/">${esc(t.docs.home)}</a></div><h1>${esc(t.docs.hubTitle)}</h1><p class="meta">${esc(t.docs.hubLead)}</p></div>
<h2 class="group-title">${esc(t.docs.intlTitle)}</h2><p class="group-sub">${esc(t.docs.intlSub)}</p>
<div class="doc-grid">${DOC_IDS.map((id) => tile(docHref(lang, id), id)).join("")}</div>
<h2 class="group-title">${esc(t.docs.cisTitle)}</h2><p class="group-sub">${esc(t.docs.cisSub)}</p>
<div class="doc-grid">${tile("/cis/", "cis")}</div>
</div>`;
  return page({ lang, title: `${t.docs.hubTitle} — ${t.brand}`, desc: t.docs.hubLead, path: `${p}/docs/`, alternates: alt((l) => `${pre(l)}/docs/`), body });
}

function intlDoc(lang, id) {
  const t = T[lang];
  const alternates = alt((l) => docHref(l, id));
  const name = t.docs.names[id];
  if (FULL[lang]) {
    const d = FULL[lang][docKey[id]];
    return docPage(lang, id, { title: d.title, html: d.body, crumbHref: `${pre(lang)}/docs/`, crumbLabel: t.docs.hubTitle, alternates, extraMeta: langSwitch(lang, alternates), desc: name[1] });
  }
  const items = SUMMARIES[lang][id];
  const html = `<h2>${esc(t.docs.summary)}</h2>
<div class="note"><p>${esc(t.docs.binding)}</p></div>
<ul class="summary">${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
<p><a class="btn primary" href="${docHref("en", id)}" hreflang="en">${esc(t.docs.readFull)} →</a></p>
<h2>${esc(t.docs.sellerTitle)}</h2>
<div class="card"><dl><dt>${esc(t.foot.seller)}</dt><dd>${esc(SELLER.en.name)}, ${esc(SELLER.en.kind)}</dd><dt>${esc(t.foot.reg)}</dt><dd>${SELLER.regNo}</dd><dt>${esc(t.foot.tin)}</dt><dd>${SELLER.tin}</dd><dt>${esc(t.foot.contact)}</dt><dd><a href="mailto:${SELLER.support}">${SELLER.support}</a></dd></dl></div>`;
  return docPage(lang, id, { title: name[0], html, crumbHref: `${pre(lang)}/docs/`, crumbLabel: t.docs.hubTitle, alternates, extraMeta: langSwitch(lang, alternates), desc: name[1] });
}

function cisPage(id) {
  const lang = "ru";
  const d = CIS[id === "" ? "hub" : id];
  const path = `/cis/${id ? id + "/" : ""}`;
  if (id === "") {
    const icons = { privacy: I.lock, terms: I.doc, offer: I.card, consent: I.pen };
    const tiles = ["terms", "offer", "privacy", "consent"].map((k) => `<a class="doc-tile reveal" href="/cis/${k}/"><span class="ic">${icons[k]}</span><b>${esc(CIS[k].title)}</b></a>`).join("");
    const body = `<div class="wrap">
<div class="doc-hero"><div class="crumbs"><a href="/ru/">Главная</a> / <a href="/ru/docs/">Документы</a></div><h1>${esc(d.title)}</h1><p class="meta">Действуют с ${fmtDate(lang, DOCS_DATE)}</p></div>
<div class="doc-grid">${tiles}</div>
<article class="doc">${d.body}</article>
</div>`;
    return page({ lang, title: `${d.title} — Грызи`, desc: "Пользовательское соглашение, оферта, политика обработки персональных данных и согласие для версии Грызи из RuStore.", path, body });
  }
  return docPage(lang, id, { title: d.title, html: d.body, crumbHref: "/cis/", crumbLabel: "Документы для RuStore", alternates: null, path, desc: `${d.title} — Грызи (Chompbook), версия из RuStore` });
}

function notFound() {
  const lang = "en";
  const rows = LANGS.map((l) => `<p lang="${l.id}" data-nf="${l.id}"${l.id === "en" ? "" : " hidden"}><b>${esc(T[l.id].notFound.h)}</b><br>${esc(T[l.id].notFound.p)} <a href="${pre(l.id)}/">${esc(T[l.id].notFound.btn)} →</a></p>`).join("\n");
  const body = `<div class="wrap" style="text-align:center;padding:80px 16px">
<img src="/img/icon-192.png" alt="" width="110" height="110" style="margin:0 auto 24px;border-radius:28px;animation:wiggle 3s infinite">
<h1 style="font-size:64px;margin:0;letter-spacing:-.04em">404</h1>
${rows}
<script>(function(){var l=(navigator.language||"en").slice(0,2);var e=document.querySelector('[data-nf="'+l+'"]');if(e&&l!=="en"){e.hidden=false;document.querySelector('[data-nf="en"]').hidden=true;}})()</script>
</div>`;
  return page({ lang, title: "Not found — Chompbook", desc: "Page not found", path: "/404.html", alternates: null, body });
}

// ---------------------------------------------------------------- write

const out = new Map();
const put = (rel, html) => out.set(rel, html);

for (const l of LANGS) {
  const lang = l.id;
  const p = pre(lang);
  put(`${p.slice(1)}/index.html`.replace(/^\//, ""), page({ lang, title: T[lang].title, desc: T[lang].desc, path: `${p}/`, alternates: alt((x) => `${pre(x)}/`), body: landing(lang), bodyClass: lang === "en" ? "root" : "" }));
  put(`${p ? p.slice(1) + "/" : ""}docs/index.html`, docsHub(lang));
  for (const id of DOC_IDS) put(`${p ? p.slice(1) + "/" : ""}${id}/index.html`, intlDoc(lang, id));
}
for (const id of ["", "terms", "offer", "privacy", "consent"]) put(`cis/${id ? id + "/" : ""}index.html`, cisPage(id));
put("404.html", notFound());

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...out.keys()].filter((k) => k !== "404.html").map((k) => `<url><loc>${SITE}/${k.replace(/index\.html$/, "")}</loc><lastmod>${DOCS_DATE}</lastmod></url>`).join("\n")}
</urlset>
`;
put("sitemap.xml", sitemap);
put("robots.txt", `User-agent: *\nAllow: /\nDisallow: /oauth/\nSitemap: ${SITE}/sitemap.xml\n`);

let changed = 0;
for (const [rel, html] of out) {
  const f = join(PUB, rel);
  const prev = existsSync(f) ? readFileSync(f, "utf8") : null;
  if (prev === html) continue;
  changed++;
  if (CHECK) { console.error(`out of date: site/public/${rel}`); continue; }
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, html);
}
if (CHECK && changed) { console.error(`\n${changed} page(s) differ — run: node site/gen/build.mjs`); process.exit(1); }
console.log(CHECK ? `site pages are up to date (${out.size})` : `wrote ${changed} of ${out.size} files to site/public`);
