# UTM links

Every link to the site or to Google Play from outside carries UTM tags, lowercase, words joined by hyphens.

| Tag | Value | Examples |
|---|---|---|
| `utm_source` | the platform | `producthunt`, `reddit`, `hn`, `indiehackers`, `youtube`, `directories`, `alternativeto`, `linkedin`, `telegram`, `email` |
| `utm_medium` | the type of placement | `launch`, `post`, `comment`, `video`, `profile`, `listing` |
| `utm_campaign` | the campaign | `launch-nov26` for the November 2026 launch; later `<topic>-<month><yy>` |
| `utm_content` | the exact spot, when there are several | `r-sideproject`, `r-androidapps`, `first-comment`, `description`, `pinned-comment`, a directory's name |

## Two kinds of links

**Site** (Cloudflare Web Analytics shows the referring site; Yandex Metrica on `/ru/` also shows the tags):

```
https://chompbook.online/?utm_source=producthunt&utm_medium=launch&utm_campaign=launch-nov26
```

**Google Play** — the tags go inside `referrer`, URL-encoded; Play Console shows them in *Statistics → User acquisition* (by `utm_source` and `utm_campaign`):

```
https://play.google.com/store/apps/details?id=online.chompbook.app&referrer=utm_source%3Dproducthunt%26utm_medium%3Dlaunch%26utm_campaign%3Dlaunch-nov26
```

The site's own store buttons already use `utm_source=chompbook.online&utm_medium=site&utm_campaign=home|home-bottom&utm_content=<lang>`, so a visit with no tags shows up in Play as `chompbook.online`. If the visitor arrived by a tagged link (the site examples above), `site.js` remembers those tags for the browser tab and puts them into the button's `referrer` instead: Play then shows `utm_source`/`utm_campaign` of the incoming link, and `utm_content` becomes `<incoming content>_<page>_<lang>` (for example `first-comment_home_en`).

## Launch links (launch-nov26)

| Where | Link goes to | utm_source / utm_medium / utm_content |
|---|---|---|
| Product Hunt — website field | Google Play | `producthunt` / `launch` / — |
| Product Hunt — first comment | site | `producthunt` / `launch` / `first-comment` |
| Show HN | site | `hn` / `launch` / — |
| Reddit r/SideProject | Google Play | `reddit` / `post` / `r-sideproject` |
| Reddit r/androidapps | Google Play | `reddit` / `post` / `r-androidapps` |
| Indie Hackers | site | `indiehackers` / `post` / — |
| Directories (launch-kit §9) | site | `directories` / `listing` / `<directory name>` |
| YouTube — description and pinned comment | Google Play | `youtube` / `video` / `description` or `pinned-comment` |
| Product Hunt / Reddit / HN profiles | site | `<platform>` / `profile` / — |

Results: Play Console *User acquisition* for installs, RevenueCat for trials and Pro, the n8n weekly report for everything together (task #366 sums up the launch).
