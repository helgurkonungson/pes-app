# Branches and where each one goes

`main` is where all work lands, directly or through a working branch such as `pro` (Oleg's branch for new versions; it is merged into `main` when the version is ready, and nothing is released from it). The other branches are release lines: each one is a copy of `main` at the moment it was released to its target, plus (for a store) the code that only that store needs. Releasing = bringing `main` into the branch and pushing it.

| Branch | Target | What a push does |
|---|---|---|
| `pro` and other working branches | work in progress | gates only, like `main`. |
| `main` | development | CI gates only (type-check, unit, e2e on Chromium/WebKit/Firefox). No build, no release. The Pro server (`api/`, Cloudflare Worker `chompbook-api`) still deploys from `main`. |
| `site` | chompbook.online | Cloudflare Workers Builds (`chompbook-site`) deploys `site/` once its production branch is `site`; `site.yml` checks the pages. |
| `google-play` | Google Play | gates → build → emulator smoke tests → Release `vX.Y.Z` with `PES-x.y.z.apk` and `Chompbook-x.y.z-play.aab` (upload the AAB in Play Console). |
| `galaxy-store` | Samsung Galaxy Store | the same, with `VITE_STORE=galaxy` and the `galaxy` flavor (ADR-041) → Release `galaxy-vX.Y.Z` with `Chompbook-x.y.z-galaxy.apk` (Seller Portal → Binary). |
| `rustore` | RuStore | the same with `VITE_STORE=rustore` and the `rustore` flavor (ADR-042) → Release `rustore-vX.Y.Z` with `Chompbook-x.y.z-rustore.apk` (RuStore Console → Versions → upload). |

A new release goes out only when `package.json` has a new version; a push of the same version updates the build artifacts and leaves the existing Release alone. Version codes come from the Android workflow's run number, so they only grow, across all branches.

## Releasing

```bash
# Google Play
git checkout google-play && git merge --ff-only main && git push
# Galaxy Store (keeps its own commits, so a merge, not a fast-forward)
git checkout galaxy-store && git merge main && git push
# RuStore (keeps its own commits on top of galaxy-store's flavor scheme)
git checkout rustore && git merge main && git push
# Site
git checkout site && git merge --ff-only main && git push
```

`site` and `google-play` carry nothing of their own, so they always fast-forward. Fix things in `main`, never directly in a release branch (a hotfix made there is merged back into `main` right away).

## What differs per store

| | Google Play | Galaxy Store | RuStore |
|---|---|---|---|
| Pro purchases | RevenueCat → Google Play Billing | RevenueCat → Samsung IAP (`GalaxyPurchasesPlugin`, done in `galaxy-store`) | RuStore Pay SDK (`RuStorePayPlugin`, done in `rustore`); the Pro server checks RuStore purchases itself (`api/src/rustore.ts`) |
| Rate the app | Play In-App Review | Galaxy Store page | not asked in the app; "Version" opens the RuStore page |
| Store links, "Manage subscription" | Play | Galaxy Store (`STORE_URL`) | RuStore |
| Countries | all but Russia and Belarus | per Seller Portal | Russia, Belarus, CIS |
| One-tap Gemini key (Google sign-in) | yes | yes (Samsung phones have Google services; the upload key's SHA-1 is registered, docs/GEMINI_SETUP.md) | off (no Google client id in the build): Gemini isn't offered in Russia and Belarus |
| AI for Pro | Chompbook AI server | same | same server, its own models (`RUSTORE_MODEL`): Anthropic doesn't serve Russia/Belarus |
| Legal pages | /privacy/, /terms/ | same (they name the Galaxy Store) | /cis/ set (152-FZ, offer) |

When the Galaxy code is ready to stay, it moves into `main` (flavors cost nothing for the Play build), and `galaxy-store` becomes a plain fast-forward line like `google-play`.
