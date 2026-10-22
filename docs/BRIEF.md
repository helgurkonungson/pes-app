# PES Mobile App — Product Brief

**Status:** draft for approval · 2026-10-23 · working name **PES** (Personal Education System)

## 1. Vision
Turn your own sources (books, articles, notes) and the internet into a **daily learning routine sized to the time you have** (5 · 15 · 30 · 60 min or custom), for **several skillsets in parallel**, with measurable progress and game mechanics. The CDO course is the first skillset; any other profession or skill can be added the same way.

## 2. Users
- **Primary (now):** Oleg, preparing for the CDO role on his Android phone.
- **Target (public):** self-learners and professionals worldwide (English first, Russian later) who learn from their own materials and bring their own AI API key.

## 3. User stories (MoSCoW · milestone)

| ID | As a learner I want… | Priority | Milestone |
|---|---|---|---|
| **Skillsets** ||||
| US-01 | to learn several skillsets at once, each with its own section in the main menu | Must | M1 |
| US-02 | to attach sources to each skillset: local files (PDF, EPUB, TXT/MD), pasted text, web links | Must | M1 |
| US-03 | to pick files from cloud drives (Google Drive, Dropbox, OneDrive) | Must (via the phone's file picker) | M1 |
| US-03b | to connect a cloud folder directly and auto-pick up new files | Could | M3 |
| US-04 | the app to use the internet when preparing lessons (on/off per skillset) | Must | M1 |
| **Sessions** ||||
| US-05 | to choose the portion size 5 / 15 / 30 / 60 min or custom (default per skillset, changeable per session) | Must | M1 |
| US-06 | my first session in a skillset to be a placement test that sets my starting level | Must | M1 |
| US-07 | every next session to run: **review of the last lesson → new theory → short quiz → open question** | Must | M1 |
| US-08 | my open answer to be checked by AI with a score and specific feedback | Must | M1 |
| US-09 | lessons to follow my sources in order and adapt to my quiz results | Must | M1 |
| **Progress & motivation** ||||
| US-10 | to see progress per skillset (level, coverage of sources, quiz accuracy, minutes) and overall | Must | M1 |
| US-11 | XP, streaks, levels and badges | Must | M1 |
| US-12 | a leaderboard | Should | M3 (needs accounts + server) |
| US-13 | daily reminders | Should | M2 |
| **Platform & updates** ||||
| US-14 | the app on my Android phone as an APK | Must | M1 |
| US-15 | my unpublished build to update itself from GitHub; store builds to update through the stores | Must / Should | M1 / M4 |
| US-16 | to use my own AI key (Claude), stored securely on the phone | Must | M1 |
| US-17 | an iOS build | Should | M2 |
| **Design** ||||
| US-18 | the dark card-based look from the reference (big radii, bottom bar with a central action button, rings and progress bars) with a **Tiffany / turquoise** accent | Must | M1 |

## 4. MVP (M1) scope
Skillsets · sources (files, text, links, internet research) · placement test · daily session loop with AI grading · progress, XP, streak, levels, badges · BYOK key · Android APK with self-update from GitHub · dark design.

**Not in M1:** accounts, leaderboard, multi-device sync, direct cloud-folder sync, iOS build, reminders, payments, light theme.

## 5. Non-functional requirements
- **Local-first:** all data on the device (IndexedDB), JSON export/backup. Sources and key go only to the AI provider.
- **Offline:** prepared lessons and progress work offline; generating new lessons needs internet.
- **Security:** user's key in secure storage; no developer secrets in the app or repo.
- **i18n-ready:** English UI, strings ready for Russian.
- **Phone-first UX:** 360 px+, safe areas, large touch targets, accessible labels.
- **Quality:** pure logic (session planner, scoring, XP/streaks) unit-tested.

## 6. Constraints
Budget: free tiers by default. AI cost: user's own key. No deadline: quality over speed. Oleg co-develops. Devices: Android phone, iPhone, Mac with Xcode; no Apple Developer account yet.

## 7. Success metric for M1
Oleg completes a session on his phone daily for 2 weeks in the CDO skillset, and sessions fit the chosen time within ±20%.

## 8. Open questions
App name and icon · leaderboard scope (friends vs global) · which AI providers besides Claude.
