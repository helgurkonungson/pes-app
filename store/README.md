# Store listing materials

- `listing/<lang>.json` — source texts per language (en, es, de, fr, zh, hi, ru, uk, be): Play title/short/full, App Store subtitle/promo/keywords, screenshot captions, feature-graphic line. Limits are checked when they are generated.
- `listing/<lang>.md` — the same texts laid out for copy-pasting into Play Console / App Store Connect.
- Screenshots and graphics are generated, not stored in git:
  ```bash
  npm run build && npx vite preview --port 4175 &
  node tools/store/capture.mjs /tmp/raw                 # real app screens: 9 languages × phone/tablet
  node tools/store/frames.mjs  /tmp/raw /tmp/assets     # captioned store screenshots, feature graphic, 512 px icon
  ```
  Output sizes: Google Play phone 1080×1920, tablet 1600×2560, feature graphic 1024×500, icon 512×512; App Store iPhone 6.9" 1320×2868, iPad 13" 2064×2752.
  The capture uses a free built-in course and writes demo progress (a 7-day streak) into the local database for the screenshots only.
- Answers for the store questionnaires: `docs/STORE_FORMS.md`; legal checks: `docs/LEGAL_CHECK.md`; the publishing to-do: `docs/STORE_PUBLISHING.md`.
