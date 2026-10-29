/**
 * Everything decided at build time, in one place (ADR-036): `define` constants from
 * vite.config.ts and the VITE_* variables CI passes in (.github/workflows/android.yml).
 * A new store channel (RuStore, iOS) or a hosted service (Chompbook Pro) adds its switches
 * and endpoints here, not in screens. Nothing here is a secret: it all ships in the app.
 */

/** package.json version, e.g. "0.19.1". */
export const APP_VERSION: string = __APP_VERSION__;
/** "owner/repo" on GitHub (source link, releases for the self-updater). */
export const APP_REPO: string = __APP_REPO__;

/** Android application id and Google Play package (ADR-034). Must never change. */
export const APP_ID = "online.chompbook.app";
/** The app's Google Play page. */
export const PLAY_URL = `https://play.google.com/store/apps/details?id=${APP_ID}`;
/** Our site: privacy policy, OAuth callback pages, report endpoint. */
export const SITE_URL = "https://chompbook.online";

/**
 * Builds installed outside the stores update themselves from GitHub Releases
 * (VITE_SELF_UPDATE=1 at build time). Store builds never do (store rules, ADR-034).
 */
export const SELF_UPDATE_BUILD: boolean = __SELF_UPDATE__;

/** The developer's report endpoint (chompbook.online/api/report, ADR-025/033); empty = reports are shared by hand. */
export const REPORT_URL: string = import.meta.env.VITE_REPORT_URL ?? "";
/** Recipient for reports shared by hand; empty = the default support address. */
export const REPORT_EMAIL_OVERRIDE: string = import.meta.env.VITE_REPORT_EMAIL ?? "";

/** Google OAuth client ids for the one-tap Gemini key (docs/GEMINI_SETUP.md); empty = the flow is off. */
export const GOOGLE_WEB_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID ?? "";
export const GOOGLE_IOS_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID ?? "";
