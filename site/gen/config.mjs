// Everything about the publisher and the stores in one place.
// Change a value here, then run `node site/gen/build.mjs` — every page is regenerated.

export const SITE = "https://chompbook.online";

/** Date shown as "Effective …" on the documents (ISO). Update it when a document changes. */
export const DOCS_DATE = "2026-11-10";

/** The seller / data controller (from the Armenian state register extract, 21.01.2026). */
export const SELLER = {
  en: {
    name: "Oleg Tsarkov",
    kind: "individual entrepreneur registered in the Republic of Armenia",
    address: "12 V. Vagharshyan St., Arabkir, Yerevan 0012, Republic of Armenia",
  },
  ru: {
    name: "Царьков Олег",
    nameShort: "Олег Царьков",
    kind: "индивидуальный предприниматель, зарегистрированный в Республике Армения",
    address: "Республика Армения, 0012, г. Ереван, район Арабкир, ул. В. Вагаршяна, д. 12",
  },
  regNo: "286.1553696",
  regDate: "2026-01-21",
  tin: "20064196", // ՀՎՀՀ — taxpayer identification number
  activity: "62.02.0",
  support: "support@chompbook.online",
  privacy: "privacy@chompbook.online",
};

export const APP_ID = "online.chompbook.app";

/** Yandex Metrica tag — only on Russian-language pages (/ru/…, /cis/…); no Session Replay. Described in the privacy policies. */
export const METRIKA_ID = 114170350;

/** Store links. status: "live" shows a normal button, "soon" a dimmed "coming soon" one; for the APK, "off" hides the GitHub link (the repository is private from 1.1.0). */
export const STORES = {
  play: { status: "live", url: `https://play.google.com/store/apps/details?id=${APP_ID}` },
  appStore: { status: "soon", url: "" },
  ruStore: { status: "soon", url: `https://www.rustore.ru/catalog/app/${APP_ID}` },
  apk: { status: "off", url: "https://github.com/helgurkonungson/pes-app/releases/latest" },
};

/** Site languages: the app's interface languages in the app's order (src/i18n/index.ts), then kk and tr (courses: false = no translated course pages, links go to the English ones). */
export const LANGS = [
  { id: "en", label: "English", locale: "en-GB" },
  { id: "ru", label: "Русский", locale: "ru-RU" },
  { id: "uk", label: "Українська", locale: "uk-UA" },
  { id: "be", label: "Беларуская", locale: "be-BY" },
  { id: "es", label: "Español", locale: "es-ES" },
  { id: "de", label: "Deutsch", locale: "de-DE" },
  { id: "fr", label: "Français", locale: "fr-FR" },
  { id: "zh", label: "中文（简体）", locale: "zh-CN" },
  { id: "hi", label: "हिन्दी", locale: "hi-IN" },
  // kk / tr: the app has the interface (1.2.0) but no translated courses (courses: false = course links go to the English pages); shots = which language's app screens the store/site images use until real ones are captured.
  { id: "kk", label: "Қазақша", locale: "kk-KZ", shots: "ru", courses: false },
  { id: "tr", label: "Türkçe", locale: "tr-TR", shots: "en", courses: false },
];

// Demo video on the home page (en, ru). Empty id hides the block.
export const DEMO_VIDEO = { id: "WrDTraxTYDM" };
