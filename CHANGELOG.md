# Changelog

All notable changes to PES. Versions follow semver; every new version on `main` becomes a GitHub Release with an APK.

## 0.2.0 — 2026-10-23

Works without AI, speaks Russian, never loses progress — and a redesigned interface.

- **Fixed:** the native “PES” bar no longer covers the top of the screen (and the back button under it) on Android.
- **Interface language:** Russian and English, following the phone by default; switch on the first screen or in Settings. Dates, plurals and numbers follow the language.
- **Lessons without AI:** when there is no key, no internet or the AI credits ran out, lessons are built on the phone from your own sources — read the next portion, fill-in-the-gap questions from the text, and a self-check of the open question against key ideas. The app detects “credit balance too low”, switches automatically and retries AI later. Settings → Lesson mode → “Always without AI” never calls AI.
- **Course files:** import a ready-made course (`.pes.json`) — lessons with theory, quiz, recall questions and model answers that need no AI. Re-importing a newer version of the same course keeps your progress (tracked by lesson id). Syllabus view on the skillset page.
- **Progress is safe across updates:** additive database migration (tested), automatic snapshot after every lesson and when the app goes to the background, automatic restore if the database ever comes up empty, a backup file in Documents/PES before installing an update, and “Restore from backup” right on the first screen.
- **Redesign:** four tabs (Home · Skillsets · Progress · Settings); Home leads with the next lesson and a Start button; statistics and badges merged into Progress; grouped Settings with AI status; segmented portion picker that never cuts off; toasts no longer cover the top bar; larger touch targets (44 px); WCAG AA text contrast; screen-reader labels; the unfinished leaderboard preview is gone.
- **Placement test** is optional and skipped automatically when AI isn't available.
- **Quality:** 120+ unit/integration tests; Playwright end-to-end tests on Android (Chromium) and iOS (WebKit) device profiles and desktop browsers, with accessibility (axe) and no-horizontal-scroll checks from 320 px phones to tablets; smoke tests of the APK on Android emulators (API 31/34/36, small phone, tablet) in CI.

## 0.1.0 — 2026-10-23

First Android build (MVP, milestone M1).

- Skillsets: learn several professions or skills at once, each with its own section, colour, portion size, lesson language and internet toggle.
- Sources per skillset: PDF, EPUB, Word, TXT/Markdown, HTML files (also from Google Drive / Dropbox / OneDrive via the phone's file picker), pasted text and web pages. Text is split into ~1,500-word parts that lessons follow in order.
- Placement test as the first session of every skillset (easy → hard, “I don't know” option), giving a level plus strong and weak topics.
- Daily session in portions of 5 / 15 / 30 / 60 minutes or custom: review of the last lesson → new theory → quiz → open question graded by AI with feedback and a model answer.
- Internet research for lessons via Claude's web search tool (optional per skillset).
- Progress: daily goal, activity rings, week calendar, 14-day chart, per-skillset coverage and accuracy.
- Gamification: XP, levels and ranks, daily streaks, 12 badges; leaderboard preview (accounts come later).
- Bring your own Claude API key (stored in Android Keystore); model picker.
- Self-update from GitHub Releases; backup export/restore.
- Dark design with Tiffany accent.
