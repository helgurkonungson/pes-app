# PES — Testing & compatibility

Every push to `main` runs the whole pyramid in GitHub Actions (`.github/workflows/android.yml`). The APK is released only after **every** gate passes (ADR-020).

| Layer | Tool | Where | What it covers | Gate |
|---|---|---|---|---|
| Type safety | TypeScript strict | `npm run typecheck` | app + e2e code, typed i18n keys (a missing Russian string fails the build) | blocking |
| Unit | Vitest | `src/**/*.test.ts` | planner, scoring, XP/levels, streaks, badges, session flow, AI-output normalization, chunker, offline lesson engine (sentence split, reading cursor, fill-in-the-gap questions), courses (parse, order, re-import), AI error classification, dates per locale, i18n completeness & plurals, update-safety guards (app id, WebView origin, DB version, no ActionBar theme), spaced repetition (Leitner boxes, due cards, checkpoint selection), reminder planning (rest days, no streak pressure for under-18s), streaks with freezes / rest days / repair and the energy economy, text-to-speech text pieces, error-log redaction, token usage, bilingual release notes, age bands, free-provider key patterns, Mistral/OpenRouter endpoints and free defaults, OpenRouter key check, Gemini key setup against a fake Google (project → API → restricted key → retry check; reuse; error reasons; key in clipboard text) | blocking |
| Integration | Vitest + fake IndexedDB | `src/data/data.test.ts` | real Dexie database: offline lessons end-to-end, AI fallback on “credits ran out”, network errors, course import / re-import keeping progress, backups v1/v2, automatic snapshots & restore, **schema migration v1 → v2 with live data**, due cards in the next lesson's review, intermediate test every 5th lesson, final test before "finished" (sources and courses) | blocking |
| End-to-end | Playwright | `tests/e2e/*.spec.ts` | user journeys on the production build with a mocked Claude API: onboarding & language, lessons without AI, credits/no-internet fallback, AI placement → lesson → grading, course import & update, restart/“update” persistence, snapshot recovery, backup export → wipe → restore, no open question without AI + listen button + error journal, token usage display, energy earned by a lesson + freezes + rest days + winning a streak back, free AI by age (neutral age screen; teen → only Mistral with parent permission; under 13 → none, not asked again; Groq for adults), free Gemini key (consent gate → key page → copied key checked → Gemini active; provider picker groups), **scanned PDF recognised offline** (image-only fixture, no requests leave the app; Chromium + Firefox — skipped in WebKit until the iOS app) | blocking (Chromium, WebKit, Firefox) |
| Accessibility & layout | axe-core + custom checks | `tests/e2e/quality.spec.ts` | WCAG 2.1 A/AA rules on every screen (no serious/critical issues), AA text contrast on solid backgrounds, no horizontal scrolling, 44 px touch targets, Escape/back closes sheets | as above |
| Device smoke | Android emulators | `scripts/android-smoke.sh` (results as GitHub annotations) | real APK: install, cold start time, WebView renders, **no native ActionBar**, onboarding by taps, data survives `adb install -r` (= app update) and force-stop, back button, rotation, no crashes / JS errors in logcat | blocking (launcher disabled, one retry) |

## Compatibility matrix

| Platform | Engine | Automated checks | Devices / sizes |
|---|---|---|---|
| Android 13 (API 33) | Android System WebView (Chromium) | emulator smoke | Pixel 6 |
| Android 14 (API 34) | WebView | emulator smoke | Pixel 6, Nexus 5 (small, 360 dp), Nexus 10 (tablet) |
| Android 16 (API 36) | WebView | emulator smoke | Pixel 6 |
| Android phones/tablets (any version with current WebView) | Chromium | Playwright | Pixel 7 (412 px), Galaxy S9+ (320 px), 360 × 640, Galaxy Tab S4, Pixel 7 landscape |
| iOS / iPadOS (app planned for M2) | WebKit (WKWebView engine) | Playwright | iPhone SE (320 px), iPhone 15 Pro Max, iPad Mini |
| Desktop web preview | Chrome, Firefox, Safari | Playwright | 1280 × 720 |

**Minimum supported:** Android 7.0 (minSdk 24) with an up-to-date Android System WebView (Chrome 94+), which Google Play keeps updated on every phone with Google services. Stock emulator images below API 33 ship older WebViews (API 31: Chrome 91) that real phones replace, so they are not in the matrix. iOS support starts with the iOS app (M2).

## Running locally

```bash
npm run typecheck      # app + e2e types
npm test               # unit + integration (≈2 s)
npm run e2e            # Playwright, Chromium device profiles (builds and serves the app)
npm run e2e:all        # every project — needs `npx playwright install` for WebKit and Firefox
bash scripts/android-smoke.sh PES-x.y.z.apk out/   # with an emulator or phone attached via adb
```

## What still needs a human on a real phone (each release)

1. Install the APK over the previous version → progress, language and skillsets are still there.
2. Top of the screen: no “PES” bar; back button and titles visible below the status bar; bottom tab bar clear of the gesture bar.
3. Keyboard: fields stay visible when typing (name, open answer, pasted text).
4. Files: pick a PDF from Google Drive / Telegram downloads; import the course file from the Files app.
5. Real Claude key: AI lesson and grading; with an empty balance → “credits ran out” banner and lessons continue without AI.
6. Airplane mode → lessons from sources and courses still work.
7. Settings → Install update → a backup appears in Documents/PES.
8. Daily update pop-up: with an older APK installed, the first launch of the day shows “A new version is available”; “Later” → no pop-up on the next launch that day; the next morning it appears again (also when the app was only in the background overnight).
