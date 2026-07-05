"""Repack AI-generated character sheets into the Temple Play sprite format.

The source sheets (ChatGPT image gen) do not follow any consistent grid:
canvas sizes differ, row/column layouts differ per file, backgrounds are
either solid magenta or a baked-in fake-transparency checkerboard, and some
directions/animations are missing entirely. This tool:

  detect  - remove backgrounds, auto-detect frame cells via projection
            profiles (no fixed grid), and emit labeled contact sheets +
            a detection summary for manual direction labeling.
  pack    - using scripts/character-layouts.json, compose the final
            576x768 sheets (6 cols x 8 rows @ 96px, row order:
            idle down/up/left/right then walk down/up/left/right) that
            src/pages/TemplePlay.tsx expects, plus 96x96 previews.

Usage:
  python scripts/repack_characters.py detect [--only Name] [--debug-dir DIR]
  python scripts/repack_characters.py pack   [--only Name] [--debug-dir DIR]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

SOURCE_DIR = Path(r"D:\characters\RialoTempleAgent")
REPO_ROOT = Path(__file__).resolve().parent.parent
WALK_DIR = REPO_ROOT / "public" / "temple-play" / "characters" / "walk"
PREVIEW_DIR = REPO_ROOT / "public" / "temple-play" / "characters" / "preview"
LAYOUTS_PATH = Path(__file__).resolve().parent / "character-layouts.json"

CELL = 96
COLS = 6
ROW_ORDER = [
    "idle_down", "idle_up", "idle_left", "idle_right",
    "walk_down", "walk_up", "walk_left", "walk_right",
]
TARGET_CHAR_H = 84   # character height inside the 96px cell
BASELINE_Y = 94      # feet anchor inside the cell

MIRROR = {"idle_left": "idle_right", "idle_right": "idle_left",
          "walk_left": "walk_right", "walk_right": "walk_left"}


def slugify(name: str) -> str:
    slug = name.lower().replace(".", "-").replace(" ", "-")
    slug = re.sub(r"-+", "-", slug)
    return re.sub(r"[^a-z0-9-]", "", slug)


# ---------------------------------------------------------------------------
# Background removal
# ---------------------------------------------------------------------------

def corner_color(rgb: np.ndarray) -> np.ndarray:
    h, w, _ = rgb.shape
    patches = [rgb[:6, :6], rgb[:6, -6:], rgb[-6:, :6], rgb[-6:, -6:]]
    return np.mean([p.reshape(-1, 3).mean(axis=0) for p in patches], axis=0)


def remove_background(img: Image.Image) -> tuple[np.ndarray, str]:
    """Return RGBA array with the background made transparent."""
    rgba = np.array(img.convert("RGBA")).astype(np.int16)
    r, g, b, a = rgba[..., 0], rgba[..., 1], rgba[..., 2], rgba[..., 3]

    if (a[0, :] < 20).any() or (a[:, 0] < 20).any():
        return rgba.astype(np.uint8), "alpha"

    corner = corner_color(rgba[..., :3].astype(np.float32))
    cr, cg, cb = corner

    if cr > 150 and cb > 130 and cg < 130:
        mode = "magenta"
        # True magenta has comparable R and B; hot-pink clothing (B well below
        # R) must survive the flood.
        balanced = (b * 4 > r * 3) & (r * 4 > b * 3)
        bg_like = (r > 130) & (b > 110) & balanced & (g < 0.62 * np.minimum(r, b) + 25)
    else:
        mode = "checker"
        mx = np.maximum(np.maximum(r, g), b)
        mn = np.minimum(np.minimum(r, g), b)
        bg_like = (r > 180) & (g > 180) & (b > 180) & (mx - mn < 48)

    # Flood: only background regions connected to the image border.
    labels, _ = ndimage.label(bg_like)
    border_labels = np.unique(np.concatenate([
        labels[0, :], labels[-1, :], labels[:, 0], labels[:, -1]]))
    border_labels = border_labels[border_labels != 0]
    bg = np.isin(labels, border_labels)
    rgba[..., 3][bg] = 0

    if mode == "magenta":
        # Enclosed magenta islands (gaps between limbs) aren't border-connected;
        # strip anything close to pure #FF00FF regardless of connectivity.
        hard_magenta = (r > 195) & (b > 195) & (g < 70)
        rgba[..., 3][hard_magenta] = 0
        # Defringe: strip magenta-tinted halo pixels adjacent to transparency.
        # Require blue near red so legit pink/red clothing survives.
        for _ in range(3):
            transparent = rgba[..., 3] < 16
            ring = ndimage.binary_dilation(transparent, iterations=1) & ~transparent
            halo = ring & (r > g + 60) & (b > g + 60) & (b * 4 > r * 3)
            if not halo.any():
                break
            rgba[..., 3][halo] = 0

    return rgba.astype(np.uint8), mode


# ---------------------------------------------------------------------------
# Frame detection via projection profiles
# ---------------------------------------------------------------------------

def find_runs(profile: np.ndarray, min_gap: int, min_size: int) -> list[tuple[int, int]]:
    """Contiguous >0 runs, merging gaps <= min_gap, dropping runs < min_size."""
    nz = profile > 0
    runs: list[list[int]] = []
    start = None
    for i, v in enumerate(nz):
        if v and start is None:
            start = i
        elif not v and start is not None:
            runs.append([start, i])
            start = None
    if start is not None:
        runs.append([start, len(nz)])
    merged: list[list[int]] = []
    for run in runs:
        if merged and run[0] - merged[-1][1] <= min_gap:
            merged[-1][1] = run[1]
        else:
            merged.append(run)
    return [(s, e) for s, e in merged if e - s >= min_size]


def detect_cells(rgba: np.ndarray) -> list[list[tuple[int, int, int, int]]]:
    """Return rows of cell bboxes (x0, y0, x1, y1).

    Some sheets draw two miniature animation rows so close together that the
    y-projection merges them into one band; when most cells in a band split
    cleanly into two vertical blobs, the band is split into two rows.
    """
    mask = rgba[..., 3] > 16
    bands = find_runs(mask.sum(axis=1), min_gap=6, min_size=24)
    rows: list[list[tuple[int, int, int, int]]] = []
    for y0, y1 in bands:
        band = mask[y0:y1]
        cols = find_runs(band.sum(axis=0), min_gap=6, min_size=14)
        cells = []
        splits = []
        for x0, x1 in cols:
            sub = band[:, x0:x1]
            ys, xs = np.nonzero(sub)
            cells.append((x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1))
            sub_bands = find_runs(sub.sum(axis=1), min_gap=4, min_size=18)
            splits.append(sub_bands if len(sub_bands) >= 2 else None)
        if not cells:
            continue
        counts = [len(s) for s in splits if s]
        k = max(set(counts), key=counts.count) if counts else 1
        matching = sum(1 for s in splits if s and len(s) == k)
        if k >= 2 and len(cells) >= 3 and matching >= max(2, int(0.6 * len(cells))):
            sub_rows: list[list[tuple[int, int, int, int]]] = [[] for _ in range(k)]
            for (x0, x1), cell, sub in zip(cols, cells, splits):
                if sub is None or len(sub) != k:
                    sub_rows[0].append(cell)
                    continue
                for target, (sy0, sy1) in zip(sub_rows, sub):
                    blob = mask[y0 + sy0:y0 + sy1, x0:x1]
                    ys, xs = np.nonzero(blob)
                    target.append((x0 + xs.min(), y0 + sy0 + ys.min(),
                                   x0 + xs.max() + 1, y0 + sy0 + ys.max() + 1))
            for row in sub_rows:
                if row:
                    rows.append(sorted(row))
        else:
            rows.append(cells)
    return rows


# ---------------------------------------------------------------------------
# Detect mode output
# ---------------------------------------------------------------------------

def contact_sheet(rgba: np.ndarray, rows: list[list[tuple[int, int, int, int]]], out: Path) -> None:
    box = 72
    pad = 6
    ncols = max(len(r) for r in rows)
    width = 40 + ncols * (box + pad)
    height = 20 + len(rows) * (box + pad + 14)
    sheet = Image.new("RGBA", (width, height), (24, 26, 34, 255))
    draw = ImageDraw.Draw(sheet)
    src = Image.fromarray(rgba)
    for ri, row in enumerate(rows):
        y = 20 + ri * (box + pad + 14)
        draw.text((6, y + box // 2 - 5), f"r{ri}", fill=(255, 220, 120, 255))
        for ci, (x0, y0, x1, y1) in enumerate(row):
            x = 40 + ci * (box + pad)
            cell = src.crop((x0, y0, x1, y1))
            scale = min(box / cell.width, box / cell.height)
            cell = cell.resize((max(1, int(cell.width * scale)), max(1, int(cell.height * scale))), Image.NEAREST)
            draw.rectangle([x - 1, y - 1, x + box, y + box], outline=(70, 74, 92, 255))
            sheet.paste(cell, (x + (box - cell.width) // 2, y + (box - cell.height) // 2), cell)
            draw.text((x, y + box + 1), f"{ci}", fill=(150, 160, 190, 255))
    sheet.save(out)


def run_detect(args: argparse.Namespace) -> None:
    debug_dir = Path(args.debug_dir)
    debug_dir.mkdir(parents=True, exist_ok=True)
    summary: dict[str, dict] = {}
    for src_path in sorted(SOURCE_DIR.glob("*.png")):
        name = src_path.stem
        if args.only and args.only.lower() != name.lower():
            continue
        img = Image.open(src_path)
        rgba, mode = remove_background(img)
        rows = detect_cells(rgba)
        heights = [y1 - y0 for row in rows for (_, y0, _, y1) in row]
        summary[name] = {
            "slug": slugify(name),
            "size": [img.width, img.height],
            "bg": mode,
            "rows": [len(r) for r in rows],
            "cell_h_median": int(np.median(heights)) if heights else 0,
            "row_heights": [int(np.median([y1 - y0 for (_, y0, _, y1) in row])) for row in rows],
        }
        contact_sheet(rgba, rows, debug_dir / f"{slugify(name)}.png")
        print(f"{name:>16} {img.width}x{img.height} bg={mode:8} rows={[len(r) for r in rows]}")
    (debug_dir / "summary.json").write_text(json.dumps(summary, indent=2))


# ---------------------------------------------------------------------------
# Pack mode
# ---------------------------------------------------------------------------

def pingpong(indices: list[int], count: int) -> list[int]:
    if len(indices) >= count:
        picks = np.linspace(0, len(indices) - 1, count).round().astype(int)
        return [indices[i] for i in picks]
    if len(indices) == 1:
        return indices * count
    cycle = indices + indices[-2:0:-1]  # e.g. [0,1,2] -> [0,1,2,1]
    return [cycle[i % len(cycle)] for i in range(count)]


def compose_cell(char: Image.Image, scale: float, bob: int = 0) -> Image.Image:
    w = max(1, round(char.width * scale))
    h = max(1, round(char.height * scale))
    scaled = char.resize((w, h), Image.NEAREST)
    cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    x = (CELL - w) // 2
    y = min(CELL - h, BASELINE_Y - h + bob)
    cell.paste(scaled, (x, max(0, y)), scaled)
    return cell


def resolve_layout(layouts: dict, name: str) -> dict:
    chars = layouts["characters"]
    if name not in chars:
        raise KeyError(f"no layout for {name}")
    entry = dict(chars[name])
    family = entry.pop("family", None)
    resolved: dict = {}
    if family:
        resolved.update(layouts["families"][family])
    resolved.update(entry.get("rows", {}))
    for key, value in entry.items():
        if key != "rows":
            resolved[key] = value
    return resolved


def build_character(name: str, rgba: np.ndarray, layout: dict, debug_dir: Path | None) -> Image.Image:
    rows = detect_cells(rgba)
    src = Image.fromarray(rgba)

    def frames_for(spec) -> list[Image.Image]:
        row_idx = spec["row"]
        if row_idx >= len(rows):
            raise IndexError(f"{name}: row {row_idx} missing (has {len(rows)})")
        row = rows[row_idx]
        cols = spec.get("cols", list(range(len(row))))
        cols = [c for c in cols if c < len(row)]
        if not cols:
            raise IndexError(f"{name}: row {row_idx} has no usable cols")
        return [src.crop(row[c]) for c in cols]

    # First pass: gather source frames per semantic row.
    gathered: dict[str, list[Image.Image]] = {}
    pending: dict[str, str] = {}
    for key in ROW_ORDER:
        spec = layout.get(key)
        if spec is None:
            pending[key] = "auto"
        elif isinstance(spec, str):
            pending[key] = spec
        else:
            gathered[key] = frames_for(spec)

    # Resolve fallbacks: mirror, bob, auto. Returns (frames, is_idle_fallback).
    bob_rows: set[str] = set()

    def resolve(key: str, rule: str) -> tuple[list[Image.Image], bool]:
        if rule == "auto" and key in MIRROR and MIRROR[key] in gathered:
            rule = "mirror:" + MIRROR[key]
        if rule.startswith("mirror:"):
            ref = rule.split(":", 1)[1]
            base = gathered.get(ref)
            if base is None:
                raise ValueError(f"{name}: mirror ref {ref} missing for {key}")
            return [f.transpose(Image.FLIP_LEFT_RIGHT) for f in base], False
        if rule.startswith("bob:") or rule == "auto":
            ref = rule.split(":", 1)[1] if ":" in rule else ("idle_" + key.split("_")[1])
            base = gathered.get(ref)
            if base is None:
                base = next(iter(gathered.values()))
            return list(base), True
        raise ValueError(f"{name}: bad rule {rule} for {key}")

    # Mirror rules may reference rows that are themselves pending; resolve
    # explicit specs first (already gathered), then two passes for chains.
    for _ in range(2):
        for key, rule in list(pending.items()):
            try:
                frames, is_bob = resolve(key, rule)
            except ValueError:
                continue
            gathered[key] = frames
            if is_bob and key.startswith("walk_"):
                bob_rows.add(key)
            del pending[key]
    if pending:
        raise ValueError(f"{name}: unresolved rows {sorted(pending)}")

    # Scale: normalize every row so the character height is uniform across
    # rows (the AI draws some directions/animations at wildly different
    # sizes). Row-max height keeps the intra-row walk bob intact.
    sheet = Image.new("RGBA", (COLS * CELL, len(ROW_ORDER) * CELL), (0, 0, 0, 0))
    for ri, key in enumerate(ROW_ORDER):
        frames = gathered[key]
        row_h = max(f.height for f in frames)
        row_w = max(f.width for f in frames)
        scale = min(TARGET_CHAR_H / row_h, (CELL - 4) / row_w)
        order = pingpong(list(range(len(frames))), COLS)
        for ci in range(COLS):
            bob = -1 if (key in bob_rows and ci % 2 == 1) else 0
            cell = compose_cell(frames[order[ci]], scale, bob)
            sheet.paste(cell, (ci * CELL, ri * CELL), cell)
    return sheet


def run_pack(args: argparse.Namespace) -> None:
    layouts = json.loads(LAYOUTS_PATH.read_text())
    debug_dir = Path(args.debug_dir) if args.debug_dir else None
    if debug_dir:
        (debug_dir / "packed").mkdir(parents=True, exist_ok=True)
    WALK_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    failures: list[str] = []
    for src_path in sorted(SOURCE_DIR.glob("*.png")):
        name = src_path.stem
        if args.only and args.only.lower() != name.lower():
            continue
        slug = slugify(name)
        if name not in layouts["characters"]:
            print(f"skip {name} (no layout entry)")
            continue
        try:
            rgba, _ = remove_background(Image.open(src_path))
            layout = resolve_layout(layouts, name)
            sheet = build_character(name, rgba, layout, debug_dir)
        except Exception as exc:  # noqa: BLE001 - report and continue
            failures.append(f"{name}: {exc}")
            print(f"FAIL {name}: {exc}")
            continue
        sheet.save(WALK_DIR / f"{slug}.png")
        preview = sheet.crop((0, 0, CELL, CELL))
        preview.save(PREVIEW_DIR / f"{slug}.png")
        if debug_dir:
            sheet.save(debug_dir / "packed" / f"{slug}.png")
        print(f"ok   {name} -> {slug}.png")
    if failures:
        print("\nFAILURES:")
        for f in failures:
            print(" -", f)
        sys.exit(1)


def run_zoom(args: argparse.Namespace) -> None:
    """Emit selected cells at high resolution for direction labeling."""
    src_path = next(p for p in SOURCE_DIR.glob("*.png") if p.stem.lower() == args.only.lower())
    rgba, _ = remove_background(Image.open(src_path))
    rows = detect_cells(rgba)
    src = Image.fromarray(rgba)
    wanted: list[tuple[int, int]] = []
    for part in args.cells.split(","):
        r, c = part.split(":")
        wanted.append((int(r), int(c)))
    box = 190
    sheet = Image.new("RGBA", (len(wanted) * (box + 8) + 8, box + 30), (24, 26, 34, 255))
    draw = ImageDraw.Draw(sheet)
    for i, (r, c) in enumerate(wanted):
        x = 8 + i * (box + 8)
        cell = src.crop(rows[r][c])
        scale = min(box / cell.width, box / cell.height)
        cell = cell.resize((max(1, int(cell.width * scale)), max(1, int(cell.height * scale))), Image.NEAREST)
        sheet.paste(cell, (x + (box - cell.width) // 2, 24 + (box - cell.height) // 2), cell)
        draw.text((x, 6), f"r{r}c{c}", fill=(255, 220, 120, 255))
    out = Path(args.debug_dir) / f"zoom-{slugify(args.only)}.png"
    sheet.save(out)
    print(out)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=["detect", "pack", "zoom"])
    parser.add_argument("--only", help="process a single character by name")
    parser.add_argument("--cells", help="zoom cells as row:col,row:col,...")
    parser.add_argument("--debug-dir", default=str(REPO_ROOT / ".sprite-debug"))
    args = parser.parse_args()
    if args.mode == "detect":
        run_detect(args)
    elif args.mode == "zoom":
        run_zoom(args)
    else:
        run_pack(args)


if __name__ == "__main__":
    main()
