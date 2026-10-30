# Store listing materials

```bash
node tools/store/listing-md.mjs   # after any change in listing/*.json: checks the limits, rewrites listing/*.md
```
It fails (and writes nothing) if a text breaks a rule: title ≤30, short ≤80, full ≤4000, subtitle ≤30, promo ≤170, keywords ≤100 with no spaces after commas and no words already in the title or subtitle, exactly 6 captions, no ё/Ё in Russian, the owner's fixed en/ru titles. Captions over ~52 and feature lines over ~55 characters only get a warning.

- `listing/<lang>.json` — source texts per language (en, es, de, fr, zh, zh-TW, hi, ru, uk, be): Play title/short/full, App Store subtitle/promo/keywords, screenshot captions (in screen order: AI-checked open answer, sources, lesson, quiz, courses, home with streak), feature-graphic line.
- `listing/<lang>.md` — generated from the JSON: the same texts laid out for copy-pasting into Play Console / App Store Connect. Edit the JSON, not the .md.
- One text, several store locales — paste the same listing into each (the header of every .md lists them):
  en → en-US, en-GB, en-AU, en-IN, en-CA · es → es-ES, es-419, es-US · fr → fr-FR, fr-CA · de → de-DE · zh → zh-CN · zh-TW → zh-TW, zh-HK · hi → hi-IN · ru → ru-RU · uk → uk · be → be (no Belarusian in the App Store).
- `zh-TW` is a store-only language (Traditional Chinese, Taiwan wording): the app and the site have no zh-TW interface, so its screenshots reuse the Simplified Chinese (`zh`) app screens with the captions from `zh-TW.json`.
- Screenshots and graphics are generated, not stored in git:
  ```bash
  npm run build && npx vite preview --port 4175 &
  node tools/store/capture.mjs /tmp/raw                 # real app screens: 9 languages × phone/tablet
  node tools/store/frames.mjs  /tmp/raw /tmp/assets     # captioned store screenshots, feature graphic, 512 px icon
  python3 tools/store/site_shots.py /tmp/raw            # the same screens for chompbook.online
  ```
  Output sizes: Google Play phone 1080×1920, tablet 1600×2560, feature graphic 1024×500, icon 512×512; App Store iPhone 6.9" 1320×2868, iPad 13" 2064×2752.
  The capture uses a free built-in course with a demo AI key against a mocked AI (nothing leaves the machine) — screenshot 1 is its AI-checked open answer — and writes demo progress (a 7-day streak) into the local database for the screenshots only. zh-TW uses the zh screens with its own captions.
- Answers for the store questionnaires: `docs/STORE_FORMS.md`; legal checks: `docs/LEGAL_CHECK.md`; the publishing to-do: `docs/STORE_PUBLISHING.md`.
