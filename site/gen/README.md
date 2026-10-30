# chompbook.online pages

Pages in `site/public` are generated — don't edit the HTML by hand.

```
node site/gen/build.mjs          # regenerate after any change below
node site/gen/build.mjs --check  # what the test runs
```

| Change | File |
|---|---|
| Publisher details, e-mails, store links (`status: "live"` when the app is published) | `config.mjs` |
| Date shown on the documents | `config.mjs` → `DOCS_DATE` |
| Site texts (all nine languages, same keys) | `i18n/<lang>.mjs` |
| Privacy, terms, support, data deletion — English / Russian | `docs/en.mjs`, `docs/ru.mjs` |
| Short versions for uk, be, es, de, fr, zh, hi | `docs/summaries.mjs` |
| RuStore (CIS): user agreement, offer, 152-FZ policy, consent | `docs/cis.mjs` |
| Screenshot captions | `store/listing/<lang>.json` (same as the stores) |
| Screenshots | `site/public/img/shots/<lang>/1…6.webp` — `python3 tools/store/site_shots.py <raw dir of tools/store/capture.mjs>` (store order, side margins so text never touches the phone frame) |
| Styles / scripts | `site/public/style.css`, `site/public/site.js` (hand-written) |

Store forms: privacy `https://chompbook.online/privacy/`, terms `/terms/`, support `/support/`, data deletion `/delete-data/`; RuStore — `/cis/privacy/`, `/cis/terms/`, `/cis/offer/`.

Deploy: Cloudflare Workers Builds for the Worker `chompbook-site` — repository `helgurkonungson/pes-app`, branch `main`, root directory `site`, build command empty, deploy command `npx wrangler deploy`. A push to `main` publishes the site within a minute or two. A push that changes only `site/` skips the app CI (`android.yml` paths-ignore) and runs the quick `site.yml` checks instead.
