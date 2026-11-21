/**
 * Everything decided at build time, in one place (ADR-036): `define` constants from
 * vite.config.ts and the VITE_* variables CI passes in (.github/workflows/android.yml).
 * A new store channel (RuStore, iOS) or a hosted service (Chompbook Pro) adds its switches
 * and endpoints here, not in screens. Nothing here is a secret: it all ships in the app.
 */

/** package.json version, e.g. "0.19.1". */
export const APP_VERSION: string = __APP_VERSION__;
/** "owner/repo" on GitHub (source link). */
export const APP_REPO: string = __APP_REPO__;

/** Android application id and Google Play package (ADR-034). Must never change. */
export const APP_ID = "online.chompbook.app";
/** The app's Google Play page. */
export const PLAY_URL = `https://play.google.com/store/apps/details?id=${APP_ID}`;

/**
 * The store this build is for (ADR-041): "play" — Google Play (default); "galaxy" — Samsung Galaxy
 * Store (VITE_STORE=galaxy, the Android `galaxy` flavor); "rustore" — RuStore (VITE_STORE=rustore,
 * the `rustore` flavor, ADR-042). Decides the purchases backend, store links, the rating card,
 * legal documents and store wording.
 */
export type StoreId = "play" | "galaxy" | "rustore";
const STORES: StoreId[] = ["play", "galaxy", "rustore"];
export const STORE: StoreId = STORES.includes(import.meta.env.VITE_STORE as StoreId) ? (import.meta.env.VITE_STORE as StoreId) : "play";
/** The app's RuStore page. */
export const RUSTORE_URL = `https://www.rustore.ru/catalog/app/${APP_ID}`;
/** The app's page in the store this build came from. */
export const STORE_URL: string = STORE === "galaxy" ? `https://galaxystore.samsung.com/detail/${APP_ID}` : STORE === "rustore" ? RUSTORE_URL : PLAY_URL;
/** Our site: privacy policy, OAuth callback pages, report endpoint. */
export const SITE_URL = "https://chompbook.online";


/** The developer's report endpoint (chompbook.online/api/report, ADR-025/033); empty = reports are shared by hand. */
export const REPORT_URL: string = import.meta.env.VITE_REPORT_URL ?? "";
/** Recipient for reports shared by hand; empty = the default support address. */
export const REPORT_EMAIL_OVERRIDE: string = import.meta.env.VITE_REPORT_EMAIL ?? "";

/** RevenueCat public SDK key for Android (Chompbook Pro purchases, ADR-037); public by design. Empty = Pro can't be bought in this build. */
export const REVENUECAT_ANDROID_KEY: string = import.meta.env.VITE_REVENUECAT_ANDROID_KEY ?? "";
/** RevenueCat public SDK key of the Galaxy Store app (ADR-041); public by design. */
export const REVENUECAT_GALAXY_KEY: string = import.meta.env.VITE_REVENUECAT_GALAXY_KEY ?? "";
/** The key for this build's store; empty = Pro can't be bought in this build. */
export const REVENUECAT_KEY: string = STORE === "galaxy" ? REVENUECAT_GALAXY_KEY : REVENUECAT_ANDROID_KEY;
/** Samsung IAP test mode (VITE_GALAXY_BILLING=test): no real charges. Release builds stay in production mode. */
export const GALAXY_BILLING_TEST: boolean = import.meta.env.VITE_GALAXY_BILLING === "test";
/**
 * RuStore build (ADR-042): Pro is sold through RuStore Pay. The flag only says the build was made
 * with the RuStore app id from RuStore Console (VITE_RUSTORE_APP_ID, also written into the Android
 * manifest); empty = Pro can't be bought in this build.
 */
export const RUSTORE_PAY: boolean = STORE === "rustore" && !!import.meta.env.VITE_RUSTORE_APP_ID;
/** Subscription product ids in RuStore Console (the same ids as in Google Play). */
export const RUSTORE_PRODUCTS = ["pro_monthly", "pro_annual"];
/** Chompbook AI server (Pro, ADR-037), OpenAI-compatible. */
export const PRO_API: string = (import.meta.env.VITE_PRO_API || "https://api.chompbook.online/v1").replace(/\/+$/, "");

/** Google OAuth client ids for the one-tap Gemini key (docs/GEMINI_SETUP.md); empty = the flow is off. */
export const GOOGLE_WEB_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID ?? "";
export const GOOGLE_IOS_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID ?? "";
