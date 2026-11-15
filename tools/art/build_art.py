#!/usr/bin/env python3
"""
Turns the mascot artwork (Qwen-drawn PNGs, plain white or cream background, a "Qwen" mark in the
bottom-right corner) into small transparent WebP files in src/assets/art/.

    python3 tools/art/build_art.py "<folder with the PNGs>"

The folder is Oleg's `Refs/` (game sprites in `Refs/game/`). The source PNGs stay out of the repo;
only the WebP output is committed. Re-run after replacing a drawing.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageEnhance
from scipy import ndimage

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "src", "assets", "art")


def find(src, name):
    for p in (os.path.join(src, name), os.path.join(src, "game", name)):
        if os.path.exists(p):
            return p
    raise FileNotFoundError(name)


def cut_out(im: Image.Image, tol=26.0) -> Image.Image:
    """Background (the colour of the border, flood-filled from the edges) → transparent, soft edges."""
    a = np.asarray(im.convert("RGB")).astype(np.float32)
    h, w, _ = a.shape
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bg = np.median(border, axis=0)
    dist = np.sqrt(((a - bg) ** 2).sum(-1))
    near = dist < tol
    lab, _ = ndimage.label(near)
    edge_labels = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bgmask = np.isin(lab, edge_labels[edge_labels > 0])
    # the watermark: small foreground islands in the bottom-right corner
    fg = ~bgmask
    flab, n = ndimage.label(fg)
    if n:
        sl = ndimage.find_objects(flab)
        areas = ndimage.sum(np.ones_like(flab), flab, index=np.arange(1, n + 1))
        for i, s in enumerate(sl):
            if s is None:
                continue
            y0, x0 = s[0].start, s[1].start
            if y0 > h * 0.86 and x0 > w * 0.72 and areas[i] < h * w * 0.01:
                bgmask[flab == i + 1] = True
    # soft edge: a 2 px ring around the background takes alpha from its distance to the bg colour
    ring = ndimage.binary_dilation(bgmask, iterations=2) & ~bgmask
    alpha = np.where(bgmask, 0.0, 1.0)
    soft = np.clip((dist - tol * 0.5) / (tol * 2.5), 0, 1)
    alpha[ring] = soft[ring]
    # un-mix the background colour out of the soft pixels so no light fringe shows on dark themes
    am = np.clip(alpha, 1e-3, 1)[..., None]
    rgb = np.clip((a - bg * (1 - am)) / am, 0, 255)
    rgba = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def keep_main(im: Image.Image, min_share=0.02) -> Image.Image:
    """Drops specks: islands smaller than `min_share` of the biggest one."""
    a = np.asarray(im).copy()
    m = a[..., 3] > 40
    lab, n = ndimage.label(m)
    if n > 1:
        areas = ndimage.sum(m, lab, index=np.arange(1, n + 1))
        small = np.isin(lab, np.arange(1, n + 1)[areas < areas.max() * min_share])
        a[small, 3] = 0
    return Image.fromarray(a, "RGBA")


def trim(im: Image.Image, pad=6) -> Image.Image:
    bb = im.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()
    if not bb:
        return im
    x0, y0, x1, y1 = bb
    return im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))


def cells(im: Image.Image, cols: int, rows: int):
    """Splits a sprite sheet into its cells: cut lines go through the emptiest columns/rows near the even grid."""
    a = np.asarray(im)[..., 3] > 20
    h, w = a.shape

    def cuts(profile, n, size):
        out = [0]
        for k in range(1, n):
            c = int(size * k / n)
            r = int(size / n * 0.3)
            seg = profile[c - r:c + r]
            out.append(c - r + int(np.argmin(seg)))
        return out + [size]

    xs = cuts(a.sum(0), cols, w)
    ys = cuts(a.sum(1), rows, h)
    return [[im.crop((xs[i], ys[j], xs[i + 1], ys[j + 1])) for i in range(cols)] for j in range(rows)]


def fit(im: Image.Image, box: int) -> Image.Image:
    s = min(1.0, box / max(im.width, im.height))
    return im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)


def save(im: Image.Image, name: str, box: int, q=82):
    os.makedirs(OUT, exist_ok=True)
    im = fit(im, box)
    p = os.path.join(OUT, name + ".webp")
    im.save(p, "WEBP", quality=q, method=6)
    return p


def ground(src):
    """The seamless garden tile: the watermark patched with grass from the same row band, then scaled."""
    im = Image.open(find(src, "game_ground_tile.png")).convert("RGB")
    w, h = im.size
    box = (int(w * 0.70), int(h * 0.90), w, h)
    patch = im.crop((box[0] - int(w * 0.35), box[1], box[2] - int(w * 0.35), box[3]))
    im.paste(patch, box[:2])
    im = im.resize((480, 480), Image.LANCZOS)
    # darker and calmer than the drawing, so the light worm, pages and books stand out on it
    im = ImageEnhance.Color(ImageEnhance.Contrast(ImageEnhance.Brightness(im).enhance(0.78)).enhance(0.85)).enhance(1.2)
    p = os.path.join(OUT, "game-ground.webp")
    im.save(p, "WEBP", quality=78, method=6)


def main(src):
    one = {
        # file: (output name, max side px)
        "screen_empty.png": ("worm-empty", 520),
        "screen_loading.png": ("worm-loading", 520),
        "screen_error.png": ("worm-error", 520),
        "screen_success.png": ("worm-success", 560),
        "screen_chill.png": ("worm-rest", 560),
        "screen_no_energy.png": ("worm-tired", 600),
        "ui_worm_streak.png": ("worm-streak", 520),
        "onboarding_welcome.png": ("onb-welcome", 600),
        "onboarding_step_by_step.png": ("onb-bites", 600),
        "onboarding_routine.png": ("onb-habit", 600),
        "onboarding_aim.png": ("onb-goal", 600),
        "onboarding_callibration_test.png": ("onb-test", 600),
        "pro_hero.png": ("pro-hero", 560),
        "pro_badge.png": ("pro-badge", 192),
        "course_programming.png": ("course-ai", 360),
        "course_math.png": ("course-data", 360),
        "course_english.png": ("course-learning", 360),
        "course_finance.png": ("course-money", 360),
        "course_psycology.png": ("course-thinking", 360),
        "game_worm_head.png": ("game-head", 96),
        "game_worm_body.png": ("game-body", 72),
        "game_worm_tail.png": ("game-tail", 72),
        "game_bird_shadow.png": ("game-bird-shadow", 192),
    }
    for f, (name, box) in one.items():
        im = trim(keep_main(cut_out(Image.open(find(src, f))), 0.03 if name == "onb-welcome" else 0.002))
        print(save(im, name, box))

    sheets = {
        # file: (cols, rows, names row by row, max side px)
        "game_worm_head_states.png": (3, 2, ["game-head-calm", "game-head-left", "game-head-right", "game-head-chomp", "game-head-hurt", "game-head-happy"], 96),
        "game_items.png": (3, 3, ["game-book-1", "game-book-2", "game-book-3", "game-page-1", "game-page-2", "game-page-3", "game-apple-1", "game-apple-2", "game-apple-3"], 84),
        "game_bird_frames.png": (4, 1, ["game-bird-1", "game-bird-2", "game-bird-3", "game-bird-4"], 192),
        "game_mole.png": (4, 1, ["game-mole-hole", "game-mole-peek", "game-mole-out", "game-mole-hide"], 128),
        "game_decor.png": (4, 2, ["game-decor-pebbles", "game-decor-leaf", "game-decor-leaf2", "game-decor-mushroom", "game-decor-daisies", "game-decor-grass", "game-decor-twig", "game-decor-clover"], 72),
        "game_life.png": (2, 1, ["game-life", "game-life-empty"], 64),
        "game_fx.png": (5, 1, ["game-fx-star", "game-fx-dust", "game-fx-feathers", "game-fx-leaves", "game-fx-confetti"], 112),
        "ui_icons_economy.png": (5, 1, ["icon-energy", "icon-streak", "icon-freeze", "icon-rest", "icon-skip"], 96),
        "achievements.png": (3, 3, ["medal-first", "medal-7", "medal-30", "medal-100", "medal-sun", "medal-moon", "medal-perfect", "medal-shield", "medal-cap"], 144),
    }
    for f, (cols, rows, names, box) in sheets.items():
        cut = cut_out(Image.open(find(src, f)))
        grid = cells(cut, cols, rows)
        k = 0
        for row in grid:
            for c in row:
                im = trim(keep_main(c, 0.01 if "fx" not in names[k] and "decor" not in names[k] else 0.002))
                print(save(im, names[k], box))
                k += 1
    ground(src)
    write_index()


def write_index():
    """src/assets/art.ts: one import per WebP, so Vite fingerprints and bundles them."""
    names = sorted(f[:-5] for f in os.listdir(OUT) if f.endswith(".webp"))

    def ident(n):
        parts = n.split("-")
        return parts[0] + "".join(x.capitalize() for x in parts[1:])

    lines = [
        "/**",
        " * Mascot artwork (2.0.0): the green bookworm and his world, drawn in Qwen and cut out by",
        " * `tools/art/build_art.py` into small transparent WebP files. Generated by that tool: don't edit by hand.",
        " */",
    ]
    lines += [f'import {ident(n)} from "./art/{n}.webp";' for n in names]
    lines += ["", "export const ART = {"] + [f'  "{n}": {ident(n)},' for n in names] + ["} as const;", "", "export type ArtName = keyof typeof ART;", ""]
    with open(os.path.join(OUT, "..", "art.ts"), "w") as f:
        f.write("\n".join(lines))


if __name__ == "__main__":
    main(sys.argv[1])
