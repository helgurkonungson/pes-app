#!/usr/bin/env python3
"""Generates the Android launcher icons and splash screens for PES.

Design: three rounded "portion" bars on a dark tile (Tiffany, faded Tiffany, grey).
Run from the repo root:  python3 tools/make_icons.py   (needs Pillow)
"""
from pathlib import Path
from PIL import Image, ImageDraw

RES = Path(__file__).resolve().parent.parent / "android/app/src/main/res"
BG = (28, 29, 32, 255)          # #1C1D20 tile
SCREEN = (20, 21, 23, 255)      # #141517 app background
TIFFANY = (129, 216, 208, 255)  # #81D8D0
TIFFANY_75 = (104, 168, 163, 255)
GREY = (107, 110, 117, 255)
SS = 4  # supersampling


def bars(draw: ImageDraw.ImageDraw, x: float, y: float, unit: float) -> None:
    """Bars laid out on a 512-unit design grid starting at (x, y); `unit` = px per design unit."""
    spec = [(0, 248, TIFFANY), (88, 176, TIFFANY_75), (176, 104, GREY)]
    for dy, w, color in spec:
        top = y + dy * unit
        draw.rounded_rectangle([x, top, x + w * unit, top + 64 * unit], radius=32 * unit, fill=color)


def icon(size: int, shape: str) -> Image.Image:
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if shape == "square":
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=BG)
    elif shape == "round":
        d.ellipse([0, 0, s - 1, s - 1], fill=BG)
    unit = s / 512
    # bars block is 248 x 240 design units; centre it
    bars(d, (s - 248 * unit) / 2, (s - 240 * unit) / 2, unit)
    return img.resize((size, size), Image.LANCZOS)


def foreground(size: int) -> Image.Image:
    """Adaptive-icon foreground: 108dp canvas, keep artwork inside the central ~60%."""
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    unit = (s * 0.42) / 248
    bars(d, (s - 248 * unit) / 2, (s - 240 * unit) / 2, unit)
    return img.resize((size, size), Image.LANCZOS)


def splash(w: int, h: int) -> Image.Image:
    img = Image.new("RGBA", (w * 2, h * 2), SCREEN)
    d = ImageDraw.Draw(img)
    unit = (min(w, h) * 2 * 0.28) / 248
    bars(d, (w * 2 - 248 * unit) / 2, (h * 2 - 240 * unit) / 2, unit)
    return img.resize((w, h), Image.LANCZOS).convert("RGB")


def main() -> None:
    for density, px in {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}.items():
        folder = RES / f"mipmap-{density}"
        icon(px, "square").save(folder / "ic_launcher.png")
        icon(px, "round").save(folder / "ic_launcher_round.png")
        foreground(int(px * 108 / 48)).save(folder / "ic_launcher_foreground.png")
    for f in RES.glob("drawable*/splash.png"):
        w, h = Image.open(f).size
        splash(w, h).save(f)
    (RES / "values/ic_launcher_background.xml").write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#1C1D20</color>\n</resources>\n'
    )
    print("icons and splash screens written to", RES)


if __name__ == "__main__":
    main()
