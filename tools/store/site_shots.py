"""Screenshots for chompbook.online (site/public/img/shots/<lang>/1..6.webp) from the raw phone
captures of tools/store/capture.mjs, in the store order (1 AI-checked answer … 6 home).

Each shot gets extra side margins in the app's background colour, so on the site's phone mockups the
text never touches the frame (0.19.2), and the exact 600×1140 shape the CSS expects (no side cropping).

Usage: python3 tools/store/site_shots.py <rawDir> [langs]
"""
import sys
from pathlib import Path
from PIL import Image

RAW = Path(sys.argv[1])
LANGS = (sys.argv[2] if len(sys.argv) > 2 else "en,es,de,fr,zh,hi,ru,uk,be").split(",")
OUT = Path(__file__).resolve().parents[2] / "site" / "public" / "img" / "shots"
SCREENS = ["1-ai-check", "2-sources", "3-lesson", "4-quiz", "5-courses", "6-home"]
W, H = 600, 1140
SIDE = 0.055  # extra margin on each side, share of the screenshot width

for lang in LANGS:
    (OUT / lang).mkdir(parents=True, exist_ok=True)
    for i, name in enumerate(SCREENS, 1):
        src = Image.open(RAW / "phone" / lang / f"{name}.png").convert("RGB")
        bg = src.getpixel((2, src.height // 2))
        pad = round(src.width * SIDE)
        width = src.width + 2 * pad
        height = round(width * H / W)
        canvas = Image.new("RGB", (width, height), bg)
        canvas.paste(src.crop((0, 0, src.width, min(height, src.height))), (pad, 0))
        canvas.resize((W, H), Image.LANCZOS).save(OUT / lang / f"{i}.webp", "WEBP", quality=80, method=6)
    print("ok", lang)
