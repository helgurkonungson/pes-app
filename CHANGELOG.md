# Changelog

All notable changes to Chompbook (formerly PES). Versions follow semver; every new version on `main` becomes a GitHub Release with an APK.

## 0.10.0 — 2026-10-25

- **Free AI from Google (Gemini).** A new button at the first start and in Settings. A consent screen comes first: what will happen, how Google may use materials on the free tier, the EU/UK/Switzerland limit, 18+, and Google's terms. Nothing happens until you tick the box.
  - When the app build has Google sign-in configured: you sign in to Google right in the app, and the app creates a "Chompbook" project in your Google account, turns on the Gemini API, creates a key that works only for it, checks it and saves it on the phone. Access to your account is used once and not kept.
  - Otherwise, or if Google asks for something first: Google's key page opens inside the app, and when you close it, the copied key is pasted and checked automatically.
  - Gemini becomes the AI provider, with the newest Flash model.
- **The AI provider menu has three choices:** Built-in AI (Gemini, free), Your own API (server), and Other services (Claude, ChatGPT, Alice AI, Qwen, Groq, NVIDIA, Gemini with your own key).

## 0.9.1 — 2026-10-25

- **The "preparing the lesson" screen always shows progress:** a bar that keeps moving (by the real writing steps when they are known) and phrases that change every few seconds — "Reading your materials…", "Just a little longer…", "Almost ready…".
- **Fixed the test counter:** the big number at the top of a placement, intermediate or final test now counts questions ("8 / 10") and matches the question you're on; before, the intro page was counted too ("9 / 11" next to "Question 8 of 10").

## 0.9.0 — 2026-10-25

- **Spaced repetition.** Every question you answer becomes a review card. Cards you got wrong come back the next day, right ones after 3, 7, 14, 30 and 60 days. The review at the start of a lesson is made of the cards due today plus the last lesson's key points. Home shows how many cards are due.
- **Intermediate and final tests instead of the AI review.** Every 5th lesson starts with a short test over everything learned so far (weakest topics first). When the material is finished, a final test of 15 questions comes before "course finished"; the score is on the skillset page.
- **Fairer placement test:** two questions per part of your material. A part counts as known only if both are right; "I don't know" counts as not known.
- **No open question in lessons without AI.** Nothing could check the answer, so the step is gone.
- **Reminders** (Settings → Daily reminder): a daily reminder at the time you choose, with the number of due cards, and an evening nudge when your streak would break. Offered once after your first lesson.
- **Listen to lessons:** a "Listen" button on theory pages reads the text aloud with the phone's own voice. It works offline.
- **Scanned PDFs are recognised automatically:** pages without text are read with text recognition (Russian and English) right on the phone. No photos, no internet. If recognition gets stuck, the import still finishes with the pages that have text (the reason goes to the error log).
- **Error log** (Settings → Error log), with a "Send to developer" button. API keys are never written to it.
- **Token usage:** AI tokens and requests for each lesson on the results screen, and this month's total in Settings.
- Fixed: a lesson written in the background could get stuck on "Writing the quiz…" if it was opened at the moment it finished.
- Release notes in the update pop-up are now shown in the app's language. All CI checks, including WebKit and the Android emulators, now have to pass before a release.

## 0.8.0 — 2026-10-24

- **Every skillset starts with a short placement test** — whatever the material: with AI (from your sources or, without sources, from the skillset's topic), without AI (fill-in-the-gap questions from your own sources), and for imported courses (one question from each of up to 10–14 lessons). Older skillsets that skipped the test automatically get it while no lesson is done yet.
- **Skipping = starting from zero.** The test's first page says so; skipping (there or on the skillset page) asks for confirmation, sets the level to beginner and lessons then cover every topic from the basics.
- **Only the weak spots remain.** Parts of your material (or course lessons) you answered right are skipped by the lessons; with AI the lessons also don't re-teach the topics you already know.
- **The first lesson after the test has no review step** — there is nothing to review yet.

## 0.7.0 — 2026-10-24

- **Start an AI lesson right away.** As soon as the review and the first part of the theory are written, the lesson opens; the remaining parts and the quiz are written in the background and appear by themselves. If you get ahead of the writer, a page shows "Writing the next part…" and the next page appears there as soon as it's ready.
- **Progress on the lesson card.** While a lesson is still being written, the lesson screen, the Home card and the skillset page show "Lesson still being written · step i of n". If writing stops (no connection, phone asleep), it shows "paused" and continues automatically when you open the lesson again — from the saved step, nothing is rewritten.
- **New loading animation:** the book from the icon gets eaten bite by bite, crumbs flying, until it's finished — then a new book.
- **"Continue without sources"** on the sources screen of a new skillset (with the note that sources can be added later): goes straight to the first session (with AI: placement test / lesson from a curriculum).

## 0.6.1 — 2026-10-24

- **Lessons from books start with the actual content.** Title page, copyright/ISBN page, table of contents, preface, introduction, acknowledgements are skipped — the lesson begins at "Глава 1" / "Chapter 1" (or, in books without chapter headings, after the recognisable front matter). Index, bibliography and notes at the end are skipped too. A source is never skipped entirely.
- **No more junk characters.** Control characters, invisible marks, broken PDF glyphs (�), page numbers, dot leaders ("Введение ....... 9"), symbol rows and words split by line-end hyphens are cleaned up — for new imports and for books you already added.
- Applies to lessons without AI and to the excerpts sent to the AI.

## 0.6.0 — 2026-10-24

- **AI lessons (Gemini especially) are written in small steps instead of one huge request:** first a plan, then each part of the theory, then the review and the quiz. Each answer is short, so it finishes within Gemini's limits; a malformed answer is re-asked once; Gemini's per-minute limit ("retry in 41s") is waited out automatically.
- **Nothing is lost when the phone sleeps.** Every finished step is saved. If the connection drops while the app is in the background, the lesson continues by itself when you come back — from the step where it stopped. Retry after an error and reopening the lesson later also continue instead of starting over.
- While a lesson is being written, the screen stays on.
- The loading screen shows the step ("Writing part 2 of 3…", "Step 3 of 6") with a progress bar.
- Data: new local table for half-written lessons (database v3, additive — nothing existing changes).

## 0.5.1 — 2026-10-24

- **“A new version is available” pop-up.** The first time you open the app each day (or come back to it on a new day), it checks GitHub for a newer release. If there is one, a pop-up shows the new version, what's new, and two buttons: **Update** (saves a backup first, then downloads the APK) and **Later**. “Later” keeps the banner on the Home screen; the pop-up comes back the next day.
  - One check a day: later launches that day use the saved answer and need no internet. No internet or GitHub down → nothing is shown, and the next launch tries again.
  - The pop-up never opens over a lesson — it waits until you leave it.
  - Settings → Check for updates still checks right away.
- **Yellow look.** The main colour is now the sunny yellow of the new icon (#FFC53A) instead of turquoise: buttons, tabs, rings, the countdown screen, toggles. Dark text sits on yellow (10.9:1 contrast), yellow on the dark background is 11.6:1. Warnings and “what to improve” turned orange and imported-course tags light blue, so they no longer look like the accent.

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
