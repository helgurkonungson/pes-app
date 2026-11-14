"""Upload the Google Play store listing (texts, phone/tablet screenshots, feature graphic) through the
Google Play Developer API in one edit.

Usage:
  pip install google-api-python-client google-auth
  python3 tools/store/play_upload.py --key path/to/service-account.json \
      --assets "<Claude outputs>/store-assets/google-play" [--listing store/listing] [--only en,ru] [--dry-run]
      [--video https://youtu.be/<id> [--video-only]]

- The service account needs Play Console access to this app with "Manage store presence".
- Texts come from store/listing/<lang>.json (title, short, full); images from the assets folder made by
  tools/store/frames.mjs (phone/<lang>/1..6, tablet-10in/<lang>/1..6, feature-graphic/<lang>).
- Only locales that already exist in the Play listing are touched; others are reported and skipped (--create adds them: --only kk,tr --create).
- With managed publishing on, the committed changes wait in Play Console → Publishing overview.
"""
import argparse, glob, json, os, sys

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

PACKAGE = "online.chompbook.app"
# one text, several store locales (store/README.md)
LOCALES = {
    "en": ["en-US", "en-GB", "en-AU", "en-IN", "en-CA"],
    "es": ["es-ES", "es-419", "es-US"],
    "fr": ["fr-FR", "fr-CA"],
    "de": ["de-DE"],
    "zh": ["zh-CN"],
    "zh-TW": ["zh-TW", "zh-HK"],
    "hi": ["hi-IN"],
    "ru": ["ru-RU"],
    "uk": ["uk"],
    "be": ["be"],
    "kk": ["kk"],       # site-and-store-only: screenshots reuse the Russian app screens
    "tr": ["tr-TR"],    # site-and-store-only: screenshots reuse the English app screens
}
IMAGES = [("phoneScreenshots", "phone"), ("tenInchScreenshots", "tablet-10in")]


def pick(folder):
    files = sorted(glob.glob(os.path.join(folder, "*.jpg")) + glob.glob(os.path.join(folder, "*.png")),
                   key=lambda p: os.path.basename(p))
    return files


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--key", required=True)
    ap.add_argument("--assets", required=True)
    ap.add_argument("--listing", default=os.path.join(os.path.dirname(__file__), "..", "..", "store", "listing"))
    ap.add_argument("--only", default="")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--create", action="store_true", help="also create locales that are not in the Play listing yet (e.g. --only kk,tr --create)")
    ap.add_argument("--video", default="", help="YouTube promo video URL, set on every touched locale")
    ap.add_argument("--video-only", action="store_true", help="only set the promo video (no texts or images)")
    a = ap.parse_args()

    creds = service_account.Credentials.from_service_account_file(
        a.key, scopes=["https://www.googleapis.com/auth/androidpublisher"])
    api = build("androidpublisher", "v3", credentials=creds, cache_discovery=False)
    edits = api.edits()
    edit = edits.insert(packageName=PACKAGE, body={}).execute()["id"]
    existing = {l["language"] for l in edits.listings().list(packageName=PACKAGE, editId=edit).execute().get("listings", [])}
    print("Play listing locales:", ", ".join(sorted(existing)))

    langs = [x for x in (a.only.split(",") if a.only else LOCALES) if x]
    done, skipped = [], []
    for lang in langs:
        L = json.load(open(os.path.join(a.listing, f"{lang}.json"), encoding="utf-8"))
        for loc in LOCALES[lang]:
            if loc not in existing and not a.create:
                skipped.append(loc)
                continue
            if a.video_only:
                if not a.video:
                    sys.exit("--video-only needs --video <YouTube URL>")
                if not a.dry_run:
                    edits.listings().patch(packageName=PACKAGE, editId=edit, language=loc, body={"language": loc, "video": a.video}).execute()
                print(("[dry-run] " if a.dry_run else "video set: ") + loc)
                done.append(loc)
                continue
            body = {"language": loc, "title": L["title"], "shortDescription": L["short"], "fullDescription": L["full"]}
            if a.video:
                body["video"] = a.video
            plan = {kind: pick(os.path.join(a.assets, sub, lang)) for kind, sub in IMAGES}
            fg = [p for p in glob.glob(os.path.join(a.assets, "feature-graphic", f"{lang}.*"))]
            for kind, files in plan.items():
                if len(files) != 6:
                    sys.exit(f"{loc}: expected 6 {kind}, found {len(files)}")
            if not fg:
                sys.exit(f"{loc}: no feature graphic")
            if a.dry_run:
                print(f"[dry-run] {loc}: texts + {len(plan['phoneScreenshots'])} phone + {len(plan['tenInchScreenshots'])} tablet + feature graphic")
                done.append(loc)
                continue
            edits.listings().update(packageName=PACKAGE, editId=edit, language=loc, body=body).execute()
            for kind, files in plan.items():
                edits.images().deleteall(packageName=PACKAGE, editId=edit, language=loc, imageType=kind).execute()
                for f in files:
                    edits.images().upload(packageName=PACKAGE, editId=edit, language=loc, imageType=kind,
                                          media_body=MediaFileUpload(f, mimetype="image/jpeg" if f.endswith(".jpg") else "image/png")).execute()
            edits.images().deleteall(packageName=PACKAGE, editId=edit, language=loc, imageType="featureGraphic").execute()
            edits.images().upload(packageName=PACKAGE, editId=edit, language=loc, imageType="featureGraphic",
                                  media_body=MediaFileUpload(fg[0], mimetype="image/jpeg" if fg[0].endswith(".jpg") else "image/png")).execute()
            print("uploaded", loc)
            done.append(loc)

    if skipped:
        print("not in the Play listing (skipped):", ", ".join(skipped))
    if a.dry_run:
        edits.delete(packageName=PACKAGE, editId=edit).execute()
        print("dry run: nothing changed")
        return
    edits.commit(packageName=PACKAGE, editId=edit).execute()
    print("committed:", ", ".join(done))


if __name__ == "__main__":
    main()
