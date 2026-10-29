#  PES — learn anything in daily portions

PES (Personal Education System) turns your own books, articles and notes — plus the internet — into a daily learning routine sized to the time you have: 5, 15, 30 or 60 minutes, or a custom portion. You can learn several skillsets at once. Each session:

1. **Review** — recap of the last lesson and recall questions (including your recent mistakes)
2. **New theory** — the next part of your sources, explained at your level
3. **Quiz** — multiple-choice questions on today's theory
4. **Open question** — you apply what you learned; AI grades it and shows a model answer

The first session of every skillset is a **placement test** that sets your starting level. Progress, XP, levels, streaks and badges keep you going.

PES uses **your own Claude API key** (stored in the phone's secure storage). All other data stays on your device.

## Install on Android

Chompbook is published on Google Play as `online.chompbook.app`. Test builds: every [Release](https://github.com/helgurkonungson/pes-app/releases/latest) has `PES-x.y.z.apk` (direct install) and `Chompbook-x.y.z-play.aab` (the Google Play upload). Builds don't update themselves — Google Play does (ADR-034).

## Develop

Requirements: Node 22+. For Android builds: JDK 21 + Android SDK (or just push — GitHub Actions builds the APK).

```bash
npm install
npm run dev          # web version in the browser (http://localhost:5173)
npm test             # unit tests (core logic)
npm run build        # type-check + production build into dist/
npx cap sync android # copy the web build into the Android project
cd android && ./gradlew assembleDebug   # local APK (needs Android SDK)
```

### Project layout

| Path | What |
|---|---|
| `src/core/` | Pure logic with tests: session planner, chunker, scoring/XP/levels, streaks, badges, session flow, AI-output normalisation |
| `src/ai/` | Claude client (BYOK), prompts and tool schemas, key storage |
| `src/data/` | Dexie database, repository functions, session preparation |
| `src/sources/` | Importers: PDF (pdf.js), EPUB/Word (JSZip), HTML, text, web pages |
| `src/screens/`, `src/components/` | UI (React) and design system (`src/styles/app.css`); big screens keep their parts in `screens/session/` and `screens/settings/` |
| `src/build.ts` | Build-time values in one place: version, app id, Play URL, endpoints, self-update flag (ADR-036) |
| `src/native/` | Thin wrappers over Capacitor plugins: share, haptics, reminders, speech, keep-awake, Google sign-in |
| `src/update/` | Self-update from GitHub Releases (only builds with `VITE_SELF_UPDATE=1`) |
| `src/pro/` | Chompbook Pro purchases (RevenueCat over Google Play Billing, ADR-037) |
| `api/` | Chompbook AI server: Cloudflare Worker + D1 (Pro entitlement, daily allowance, OpenRouter); setup in `docs/PRO_SETUP.md` |
| `android/` | Capacitor Android project |
| `.github/workflows/android.yml` | CI: tests → build → APK → Release on new version |
| `docs/` | Brief, architecture and ADRs |
| `tools/` | Icon generator, release-notes helper, one-time GitHub setup script |

### Releasing

1. Bump `version` in `package.json` and add a section to `CHANGELOG.md`.
2. Push to `main`. CI builds the APK and publishes Release `vX.Y.Z`; installed apps offer the update.

Release signing uses four repository secrets: `PES_KEYSTORE_BASE64`, `PES_KEYSTORE_PASSWORD`, `PES_KEY_ALIAS`, `PES_KEY_PASSWORD`. Without them CI still builds a test APK (signed with a throwaway debug key, downloadable from the run's artifacts) but publishes no release.

## License

Private project by Oleg Tsarkov. All rights reserved for now.
