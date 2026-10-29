# Working rules for Claude in this repo

This is PES, Oleg's mobile learning app. The full process (phases, communication, Definition of Done) lives in the **PES project on claude.ai**: `app/PLAYBOOK.md` and the running state in `app/STATE.md`. Read both at the start of a session.

## Essentials
- Stack: React 19 + TypeScript + Vite, Capacitor 8 (Android now, iOS later), Dexie (IndexedDB), Claude API with the user's own key. Decisions: `docs/ARCHITECTURE.md` (ADRs).
- Pure logic goes in `src/core/` and gets unit tests (`npm test`). UI never computes XP, streaks, plans or scores itself.
- Module boundaries (ADR-036): build-time values only via `src/build.ts`; Capacitor plugins only via `src/native/`; AI error/provider wording in `src/screens/aiText.ts`; big screens keep their parts in a folder (`screens/session/`, `screens/settings/` — one section per area). Screens don't import other screens.
- Data schema changes: add a new `this.version(n)` in `src/data/db.ts` with an upgrade; never edit an existing version. Never lose the user's history.
- AI output is untrusted: always pass it through `src/core/normalize.ts`.
- No developer secrets in the repo or app. The user's key lives only in secure storage.
- Design: colours, radii and spacing only via tokens in `src/styles/app.css`; dark and light themes (ADR-022: accent text via `--accent-ink`, fills via `--accent`), sun-yellow accent `#ffc53a` (brand «Солнце», same as the icon; orange `--warn`, blue `--info`); 360 px min width; safe-area variables.
- Every UI string goes through `t()` / `useT()` from `src/i18n`; add the key to **all nine** dictionaries (en, ru, uk, be, es, de, fr, zh, hi — ADR-024). Plurals need every form `Intl.PluralRules` has for the language (ru/uk/be: one/few/many/other; es/fr: one/many/other); `npm test` checks it.
- AI-generated screens keep the "Report this lesson" flag (store rules, ADR-025); a new flow after onboarding must not break the first-run tutorial (ADR-026) or the emulator smoke test (`scripts/android-smoke.sh`).
- Android release builds are shrunk by R8: a new Capacitor plugin package needs a keep rule in `android/app/proguard-rules.pro`; Android images are WebP.
- Lessons must keep working without AI (ADR-006): never make a screen depend on AI being available; courses never call AI.
- Never break update safety (ADR-009, ADR-034): don't change the app id (`online.chompbook.app`, Google Play), the upload/signing key, the WebView origin or existing Dexie versions. Store builds never update themselves (`VITE_SELF_UPDATE` stays off).
- Tests: `npm run typecheck && npm test && npm run e2e` before every release (see `docs/TESTING.md`). New logic → unit test; new screen or flow → Playwright test.
- Before a release: bump `package.json` version, add a `CHANGELOG.md` section. Pushing a new version to `main` publishes the APK after the CI gates pass.
- Oleg's private course files (e.g. the CDO test course) never go into this public repo.
- My workspace can't reach Google's Android build servers: APKs come from GitHub Actions.
- Commit messages end with the attribution lines the session asks for.
