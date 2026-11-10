declare const __APP_VERSION__: string; declare const __APP_REPO__: string; declare const __SELF_UPDATE__: boolean;

interface ImportMetaEnv {
  /** Google OAuth "Web application" client id (Android sign-in); not a secret. See docs/GEMINI_SETUP.md. */
  readonly VITE_GOOGLE_WEB_CLIENT_ID?: string;
  /** Google OAuth iOS client id. */
  readonly VITE_GOOGLE_IOS_CLIENT_ID?: string;
  /** HTTPS endpoint that receives "Report this lesson" as JSON (POST); empty = reports are shared by hand. Not a secret. */
  readonly VITE_REPORT_URL?: string;
  /** Developer e-mail for reports shared by hand (pre-filled recipient). Not a secret. */
  readonly VITE_REPORT_EMAIL?: string;
  /** RevenueCat public SDK key for Android (Pro purchases, ADR-037); public by design. Empty = Pro can't be bought in this build. */
  readonly VITE_REVENUECAT_ANDROID_KEY?: string;
  /** Store of this build (ADR-041): "galaxy" = Samsung Galaxy Store; anything else = Google Play. */
  readonly VITE_STORE?: string;
  /** RevenueCat public SDK key of the Galaxy Store app; public by design. */
  readonly VITE_REVENUECAT_GALAXY_KEY?: string;
  /** "test" = Samsung IAP test mode (no real charges); otherwise production. */
  readonly VITE_GALAXY_BILLING?: string;
  /** Chompbook AI server (Pro). Default https://api.chompbook.online/v1. */
  readonly VITE_PRO_API?: string;
}
