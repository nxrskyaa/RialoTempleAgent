#!/usr/bin/env python3
"""Prepare pixel-art assets for Rialo Temple Play.

Pipeline per asset:
  1. key-out magenta (#FF00FF) background -> transparent (with halo removal)
  2. slice sheets (2x2 grids / horizontal strips) when needed
  3. autocrop to content bounding box
  4. downscale to the in-game grid size (LANCZOS, sharp pixel result)

Tile textures (grass/road/soil) have NO magenta: they are only resized and
kept seamless (no key-out, no crop).

Source : D:/assetsupdate  (read-only, NOT committed)
Output : public/temple-play/world/<category>/...  + manifest.json

Run:  python scripts/prepare_assets.py
"""

import json
import os
from PIL import Image, ImageMath, ImageFilter

SRC = os.environ.get("ASSET_SRC", "D:/assetsupdate")
OUT = "public/temple-play/world"

# Magenta detection via chroma, not absolute brightness, so it also catches the
# darkened magenta drop-shadows the source art bakes onto the background.
# A magenta pixel has R and B both well above G, and R ~= B (symmetric).
# Legit art is kept: red/orange (B not above G), blue (R not above G),
# purple/pink (B clearly above R, so |R-B| is large).
CHROMA = 60   # how far R and B must exceed G
SYMM = 45     # max |R-B| to count as (symmetric) magenta


def key_out_magenta(img: Image.Image) -> Image.Image:
    """Return RGBA with magenta background removed and 1px halo eroded."""
    img = img.convert("RGBA")
    r, g, b, a = img.split()
    # mask = 255 where pixel is background magenta
    mask = ImageMath.unsafe_eval(
        "convert((((r - g) > c) & ((b - g) > c) & (abs(r - b) < s)) * 255, 'L')",
        r=r, g=g, b=b, c=CHROMA, s=SYMM,
    )
    alpha = ImageMath.unsafe_eval("convert(255 - m, 'L')", m=mask)
    # erode opaque area by 1px to drop the anti-aliased magenta fringe
    alpha = alpha.filter(ImageFilter.MinFilter(3))
    img.putalpha(alpha)
    return img


def autocrop(img: Image.Image) -> Image.Image:
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def fit(img: Image.Image, longest: int) -> Image.Image:
    """Downscale so the longest side == `longest`, preserving aspect ratio."""
    w, h = img.size
    scale = longest / max(w, h)
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    return img.resize((nw, nh), Image.LANCZOS)


def slice_grid(img: Image.Image, cols: int, rows: int):
    w, h = img.size
    cw, ch = w // cols, h // rows
    cells = []
    for ry in range(rows):
        for cx in range(cols):
            cells.append(img.crop((cx * cw, ry * ch, (cx + 1) * cw, (ry + 1) * ch)))
    return cells


# source file -> processing recipe
# mode: single | strip:N | grid2x2 | tile
JOBS = [
    # category, source filename, mode, longest, output base names
    ("building", "bangunan 1.png", "single", 320, ["building-1"]),
    ("building", "bangunan 2.png", "single", 320, ["building-2"]),
    ("building", "bangunan 3.png", "single", 256, ["building-3"]),
    ("tree",     "pohon.png",      "single", 144, ["tree"]),
    ("lamp",     "lampu.png",      "single", 160, ["lamp"]),
    ("pond",     "kolam.png",      "single", 288, ["pond"]),
    ("flower",   "bunga biru.png",        "single", 56, ["flower-blue"]),
    ("flower",   "bunga jingga.png",      "single", 56, ["flower-amber"]),
    ("flower",   "bunga kuning muda.png", "single", 56, ["flower-cream"]),
    ("flower",   "bunga kuning.png",      "single", 56, ["flower-yellow"]),
    ("flower",   "bunga merah.png",       "single", 56, ["flower-red"]),
    ("flower",   "bunga orange.png",      "single", 56, ["flower-orange"]),
    ("flower",   "bunga pink.png",        "single", 56, ["flower-pink"]),
    ("flower",   "bunga ungu.png",        "single", 56, ["flower-purple"]),
    ("grass",    "rumput.png",   "strip:3", 44, ["grass-1", "grass-2", "grass-3"]),
    ("crop",     "tanaman.png",   "strip:4", 52,
        ["crop-leafy-0", "crop-leafy-1", "crop-leafy-2", "crop-leafy-3"]),
    ("crop",     "tanaman 2.png", "strip:4", 52,
        ["crop-root-0", "crop-root-1", "crop-root-2", "crop-root-3"]),
    ("park",     "taman.png", "grid2x2", 104,
        ["park-bench", "park-lantern", "park-bush", "park-planter"]),
    ("fishing",  "pancingan.png", "grid2x2", 88,
        ["fishing-rod", "fishing-bobber", "fishing-bucket", "fishing-net"]),
    # seamless tiles: no key-out, no crop, just resize
    ("tile", "map.png",        "tile", 128, ["ground-grass"]),
    ("tile", "jalanan.png",    "tile", 128, ["ground-road"]),
    ("tile", "tanah kebun.png", "tile", 128, ["ground-soil"]),
]


def process_cells(img, mode):
    if mode == "single":
        return [autocrop(key_out_magenta(img))]
    if mode == "tile":
        return [img.convert("RGBA")]
    if mode == "grid2x2":
        keyed = key_out_magenta(img)
        return [autocrop(c) for c in slice_grid(keyed, 2, 2)]
    if mode.startswith("strip:"):
        n = int(mode.split(":")[1])
        keyed = key_out_magenta(img)
        return [autocrop(c) for c in slice_grid(keyed, n, 1)]
    raise ValueError(f"unknown mode {mode}")


def main():
    manifest = []
    for category, fname, mode, longest, names in JOBS:
        path = os.path.join(SRC, fname)
        if not os.path.exists(path):
            print(f"  SKIP (missing): {fname}")
            continue
        src = Image.open(path)
        cells = process_cells(src, mode)
        if len(cells) != len(names):
            print(f"  WARN: {fname} produced {len(cells)} cells, expected {len(names)}")
        out_dir = os.path.join(OUT, category)
        os.makedirs(out_dir, exist_ok=True)
        for cell, name in zip(cells, names):
            out = fit(cell, longest)
            rel = f"{category}/{name}.png"
            out.save(os.path.join(OUT, rel))
            manifest.append({
                "name": name,
                "file": f"/temple-play/world/{rel}",
                "w": out.width,
                "h": out.height,
                "category": category,
            })
            print(f"  {rel}: {out.width}x{out.height}")

    manifest.sort(key=lambda m: (m["category"], m["name"]))
    with open(os.path.join(OUT, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"\nWrote {len(manifest)} assets + manifest.json to {OUT}/")


if __name__ == "__main__":
    main()
