declare const __APP_VERSION__: string; declare const __APP_REPO__: string;

interface ImportMetaEnv {
  /** Google OAuth "Web application" client id (Android sign-in); not a secret. See docs/GEMINI_SETUP.md. */
  readonly VITE_GOOGLE_WEB_CLIENT_ID?: string;
  /** Google OAuth iOS client id. */
  readonly VITE_GOOGLE_IOS_CLIENT_ID?: string;
  /** HTTPS endpoint that receives "Report this lesson" as JSON (POST); empty = reports are shared by hand. Not a secret. */
  readonly VITE_REPORT_URL?: string;
  /** Developer e-mail for reports shared by hand (pre-filled recipient). Not a secret. */
  readonly VITE_REPORT_EMAIL?: string;
}
