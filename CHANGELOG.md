# Changelog

All notable changes to PES. Versions follow semver; every new version on `main` becomes a GitHub Release with an APK.

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
