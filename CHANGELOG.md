# Changelog

All notable changes to Chompbook (formerly PES). Versions follow semver; every new version on `main` becomes a GitHub Release with an APK.

## 0.5.1 — 2026-10-24

- **“A new version is available” pop-up.** The first time you open the app each day (or come back to it on a new day), it checks GitHub for a newer release. If there is one, a pop-up shows the new version, what's new, and two buttons: **Update** (saves a backup first, then downloads the APK) and **Later**. “Later” keeps the banner on the Home screen; the pop-up comes back the next day.
  - One check a day: later launches that day use the saved answer and need no internet. No internet or GitHub down → nothing is shown, and the next launch tries again.
  - The pop-up never opens over a lesson — it waits until you leave it.
  - Settings → Check for updates still checks right away.

## 0.5.0 — 2026-10-23

- **New name and icon.** The app is now **Chompbook** (on Russian-language phones: **Грызи**, from "грызть гранит науки"). New icon: an open book with a bite taken out of it, on a sunny yellow background — adaptive on Android 8+, with a themed (monochrome) version for Android 13+ and a matching splash screen.
- Nothing else changes: same app id, data, settings and progress; backups stay in Documents/PES.

## 0.4.2 — 2026-10-23

- **Gemini lessons no longer stop at “AI service is overloaded”.** The key check passed, but writing a lesson failed: Google answered the big lesson request with 503 “model is overloaded” or a 5xx/timeout after long thinking, and the app gave up at once.
  - Gemini now thinks briefly (`reasoning_effort: low`) and gets extra token room for it — faster answers, fewer timeouts.
  - A busy server (500/502/503) is retried automatically twice (after 2 s and 5 s); if it still fails or times out (504), the app asks once more in a plainer way — without function calling, with the JSON schema in the prompt. Works for every OpenAI-compatible provider.
  - If a model refuses `reasoning_effort`, it is dropped and the request repeated.
- **The real reason is shown.** The lesson error screen now shows the HTTP code and the provider's own words (e.g. “Ответ сервиса: The model is overloaded…”) plus “pick another model in Settings → AI” for non-Claude providers. Gemini's errors (wrapped in an array) were not read at all before.
- Gemini's free-tier per-minute limit (“exceeded your current quota … retry in 41s”) is now a rate limit, not “credits ran out” — AI is no longer switched off for 6 hours. The credits message no longer names Anthropic for every provider.

## 0.4.1 — 2026-10-23

- **Small phones:** onboarding buttons stay pinned at the bottom of the screen (on 360 × 640 the “Continue without AI” button was off-screen — found by the emulator test).
- Emulator results so far: no native top bar and data kept across reinstall on Android 14 (small phone, tablet) and Android 16. CI matrix: API 31 replaced by 33 (API 31's stock WebView is older than the supported minimum).

## 0.4.0 — 2026-10-23

- **Three more AI options** (Settings → AI → Provider, now a list with descriptions):
  - **Gemini** (Google AI Studio key `AIza…`); the newest stable Flash model is picked automatically after the key check.
  - **Groq** (`gsk_…`, GroqCloud, very fast; default Llama 3.3 70B Versatile).
  - **Custom API** — any OpenAI-compatible server: Ollama or LM Studio on your computer or phone, vLLM, a corporate proxy. Enter the address (e.g. `http://192.168.1.10:11434/v1`), the key is optional, models are listed from the server. Android now allows plain-http connections so local servers work.
- Any model id can be typed in by hand for every non-Claude provider.
- If a server rejects a forced function call, the app automatically retries in a plainer mode and accepts JSON in the answer.

## 0.3.2 — 2026-10-23

- **Clearer AI key errors:** when a provider refuses a key, the app now shows the provider's own reason under the message. For Alice AI, “permission denied to the folder” comes with step-by-step help (role `ai.languageModels.user` on the folder, key scope `yc.ai.languageModels.execute`) instead of a generic “key rejected”.

## 0.3.1 — 2026-10-23

- **NVIDIA as an AI provider:** Settings → AI → Provider → NVIDIA. Use an API key from build.nvidia.com (`nvapi-…`); default model Llama 3.3 70B Instruct, any chat model from NVIDIA's catalog can be picked. Lessons accept either a function call or JSON in the answer, because not every NVIDIA model supports forced function calls.

## 0.3.0 — 2026-10-23

- **More AI providers:** Settings → AI → Provider: Claude, ChatGPT (OpenAI), Alice AI (Yandex AI Studio: Alice AI LLM, YandexGPT and others — needs the folder ID) and Qwen (Alibaba DashScope, international or China region). One key per provider in secure storage; model picker per provider; “credits ran out” is recognised for every provider and lessons continue without AI. Web research (“Use the internet”) stays Claude-only.
- **Check for updates** shows its result right in the Settings row (“latest version · checked at 21:05”, “Version X is available”, or a GitHub error). In 0.1.0 the confirmation toast was drawn under the native top bar, so the button looked dead.
- CI: WebKit/Firefox end-to-end runs no longer delay the Android release.
- Tests for the OpenAI-compatible client (request format, Yandex folder/model URI, error mapping) and end-to-end checks of the provider settings.

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
