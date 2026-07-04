from __future__ import annotations

import argparse
import math
from collections import deque
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageChops, ImageFilter


CELL = 96
COLS = 6
ROWS = 8
OUT_SIZE = (COLS * CELL, ROWS * CELL)
PREVIEW_SIZE = (96, 96)


CHARACTERS: dict[str, str] = {
    "Nxr.png": "nxr",
    "Vika Joestar.png": "vika-joestar",
    "Ade.png": "ade",
    "Barong.png": "barong",
    "Eric Argent.png": "eric-argent",
    "Rollins.png": "rollins",
    "Pinkeu.png": "pinkeu",
    "Blond.png": "blond",
    "dikzzy.png": "dikzzy",
    "K.Gufran.png": "k-gufran",
    "rikky.png": "rikky",
    "Vibevortex.png": "vibevortex",
    "Wisnu.png": "wisnu",
    "Raka.png": "raka",
    "Jepanya.png": "jepanya",
    "AQC.png": "aqc",
    "DP.png": "dp",
    "Ishu.png": "ishu",
    "Jeams.png": "jeams",
    "Koushik.png": "koushik",
    "KingJ.png": "kingj",
    "Richard12.png": "richard12",
    "Luka.png": "luka",
    "Silverwave.png": "silverwave",
    "Suleyman.png": "suleyman",
    "Yozi.png": "yozi",
    "Dora.png": "dora",
    "Darma.png": "darma",
    "Flippedface.png": "flippedface",
    "Ecelannister.png": "ecelannister",
    "Ali.png": "ali",
    "LongLife.png": "longlife",
    "BJoestar.png": "bjoestar",
    "Keep.png": "keep",
    "Sukanto.png": "sukanto",
    "Elias.png": "elias",
    "Sza.png": "sza",
    "Spider.png": "spider",
    "Goat.png": "goat",
    "Cryptondo.png": "cryptondo",
    "Luzzy.png": "luzzy",
}


def is_pink_chroma(red: int, green: int, blue: int, alpha: int) -> bool:
    if alpha < 8:
        return True
    return red > 165 and blue > 145 and green < 125 and red - green > 70 and blue - green > 70


def is_light_checker(red: int, green: int, blue: int, alpha: int) -> bool:
    if alpha < 8:
        return True
    spread = max(red, green, blue) - min(red, green, blue)
    very_light_neutral = red > 226 and green > 226 and blue > 226 and spread < 36
    light_gray_neutral = red > 190 and green > 190 and blue > 190 and spread < 24
    return very_light_neutral or light_gray_neutral


def is_background_pixel(red: int, green: int, blue: int, alpha: int) -> bool:
    if alpha < 8:
        return True
    return is_pink_chroma(red, green, blue, alpha) or is_light_checker(red, green, blue, alpha)


def clear_global_chroma(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    width, height = image.size

    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            if is_pink_chroma(red, green, blue, alpha):
                pixels[x, y] = (0, 0, 0, 0)

    return image


def flood_clear_background(image: Image.Image) -> Image.Image:
    image = clear_global_chroma(image)
    pixels = image.load()
    width, height = image.size
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.pop()
        if x < 0 or y < 0 or x >= width or y >= height:
            continue
        index = y * width + x
        if visited[index]:
            continue
        visited[index] = 1
        if not is_background_pixel(*pixels[x, y]):
            continue
        pixels[x, y] = (0, 0, 0, 0)
        queue.append((x - 1, y))
        queue.append((x + 1, y))
        queue.append((x, y - 1))
        queue.append((x, y + 1))

    return image


def clear_cell_background(image: Image.Image) -> Image.Image:
    """Clean one frame cell while preserving white clothing away from the border."""
    return flood_clear_background(image)


def alpha_bounds(image: Image.Image) -> tuple[int, int, int, int] | None:
    alpha = image.getchannel("A")
    return alpha.getbbox()


def connected_components(mask: Image.Image) -> list[tuple[int, int, int, int, int]]:
    width, height = mask.size
    data = mask.load()
    visited = bytearray(width * height)
    components: list[tuple[int, int, int, int, int]] = []

    for start_y in range(height):
        for start_x in range(width):
            start = start_y * width + start_x
            if visited[start] or data[start_x, start_y] == 0:
                continue
            queue = [(start_x, start_y)]
            visited[start] = 1
            left = width
            right = -1
            top = height
            bottom = -1
            area = 0

            while queue:
                x, y = queue.pop()
                area += 1
                left = min(left, x)
                right = max(right, x)
                top = min(top, y)
                bottom = max(bottom, y)

                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    idx = ny * width + nx
                    if visited[idx] or data[nx, ny] == 0:
                        continue
                    visited[idx] = 1
                    queue.append((nx, ny))

            components.append((left, top, right + 1, bottom + 1, area))

    return components


def extract_pose_crops(source: Image.Image) -> list[Image.Image]:
    clean = flood_clear_background(source)
    alpha = clean.getchannel("A")
    mask = alpha.point(lambda value: 255 if value > 12 else 0)
    # Dilation merges tiny disconnected accessories into one pose, but the source pose spacing is large enough
    # that different characters stay separated.
    dilated = mask.filter(ImageFilter.MaxFilter(13))
    components = connected_components(dilated)
    min_area = max(420, int(clean.width * clean.height * 0.00045))
    crops: list[tuple[float, float, Image.Image]] = []

    for left, top, right, bottom, area in components:
        if area < min_area:
            continue
        pad = 10
        left = max(0, left - pad)
        top = max(0, top - pad)
        right = min(clean.width, right + pad)
        bottom = min(clean.height, bottom + pad)
        crop = clean.crop((left, top, right, bottom))
        bounds = alpha_bounds(crop)
        if not bounds:
            continue
        crop = crop.crop(bounds)
        if crop.width < 16 or crop.height < 22:
            continue
        crops.append(((left + right) / 2, (top + bottom) / 2, crop))

    crops.sort(key=lambda item: (item[1], item[0]))
    return [crop for _, _, crop in crops]


def group_pose_rows(source: Image.Image) -> list[list[Image.Image]]:
    clean = clear_global_chroma(source)
    alpha = clean.getchannel("A")
    mask = alpha.point(lambda value: 255 if value > 12 else 0).filter(ImageFilter.MaxFilter(7))
    components = connected_components(mask)
    min_area = max(420, int(clean.width * clean.height * 0.00045))
    items: list[tuple[float, float, Image.Image]] = []

    for left, top, right, bottom, area in components:
        if area < min_area:
            continue
        pad = 10
        left = max(0, left - pad)
        top = max(0, top - pad)
        right = min(clean.width, right + pad)
        bottom = min(clean.height, bottom + pad)
        crop = clean.crop((left, top, right, bottom))
        bounds = alpha_bounds(crop)
        if not bounds:
            continue
        crop = crop.crop(bounds)
        if crop.width < 16 or crop.height < 22:
            continue
        items.append(((left + right) / 2, (top + bottom) / 2, crop))

    items.sort(key=lambda item: item[1])
    row_threshold = max(42, source.height / 18)
    rows: list[list[tuple[float, float, Image.Image]]] = []
    for item in items:
        if not rows or abs(item[1] - sum(row_item[1] for row_item in rows[-1]) / len(rows[-1])) > row_threshold:
            rows.append([item])
        else:
            rows[-1].append(item)

    sorted_rows: list[list[Image.Image]] = []
    for row in rows:
        row.sort(key=lambda item: item[0])
        sorted_rows.append([crop for _, _, crop in row])
    return sorted_rows


def crop_grid_cell(source: Image.Image, col: int, row: int, cols: int, rows: int) -> Image.Image:
    left = round(source.width * col / cols)
    top = round(source.height * row / rows)
    right = round(source.width * (col + 1) / cols)
    bottom = round(source.height * (row + 1) / rows)
    crop = clear_cell_background(source.crop((left, top, right, bottom)))
    bounds = alpha_bounds(crop)
    return crop.crop(bounds) if bounds else Image.new("RGBA", (1, 1))


def grid_rows(source: Image.Image) -> list[list[Image.Image]]:
    return [[crop_grid_cell(source, col, row, COLS, ROWS) for col in range(COLS)] for row in range(ROWS)]


def row_has_content(frame: Image.Image) -> bool:
    bounds = alpha_bounds(frame)
    if not bounds:
        return False
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]
    return width >= 10 and height >= 18


def content_frames(frames: list[Image.Image]) -> list[Image.Image]:
    return [frame for frame in frames if row_has_content(frame)]


def pick_six(frames: list[Image.Image]) -> list[Image.Image]:
    if not frames:
        return []
    if len(frames) == 1:
        return frames * 6
    if len(frames) == 2:
        return [frames[0], frames[1], frames[0], frames[1], frames[0], frames[1]]
    if len(frames) == 3:
        return [frames[0], frames[1], frames[2], frames[1], frames[0], frames[1]]
    if len(frames) == 4:
        return [frames[0], frames[1], frames[2], frames[3], frames[2], frames[1]]
    if len(frames) == 5:
        return [frames[0], frames[1], frames[2], frames[3], frames[4], frames[3]]
    if len(frames) == 6:
        return frames[:6]

    step = (len(frames) - 1) / 5
    return [frames[round(index * step)] for index in range(6)]


def mirror_frames(frames: Iterable[Image.Image]) -> list[Image.Image]:
    return [frame.transpose(Image.Transpose.FLIP_LEFT_RIGHT) for frame in frames]


def repeat_frame(frame: Image.Image) -> list[Image.Image]:
    return [frame.copy() for _ in range(6)]


def build_frame_rows(source: Image.Image, slug: str) -> list[list[Image.Image]]:
    # Newer user-provided sprite sheets already follow MappingCharacter:
    # 6 columns x 8 rows. Split them by grid first; component detection on the
    # full sheet can accidentally merge a whole vertical column of poses.
    if source.size == (1086, 1448):
        return grid_rows(source)

    if source.size == (1122, 1402):
        rows = grid_rows(source)
        idle_down = pick_six(content_frames(rows[0]) or rows[0])
        idle_up = pick_six(content_frames(rows[1]) or rows[1])
        side_idle = pick_six(content_frames(rows[2]) or content_frames(rows[3]) or rows[2])
        walk_down = pick_six(content_frames(rows[4]) or idle_down)
        walk_up = pick_six(content_frames(rows[5]) or idle_up)
        side_walk = pick_six(content_frames(rows[6]) or content_frames(rows[7]) or side_idle)
        return [
            idle_down,
            idle_up,
            mirror_frames(side_idle),
            side_idle,
            walk_down,
            walk_up,
            mirror_frames(side_walk),
            side_walk,
        ]

    rows = group_pose_rows(source)

    if len(rows) >= 8 and all(len(row) >= 3 for row in rows[:8]):
        return [pick_six(row) for row in rows[:8]]

    if slug == "nxr" and len(rows) >= 4:
        down = pick_six(rows[0])
        right = pick_six(rows[1])
        up = pick_six(rows[2])
        left = mirror_frames(right)
        return [
            repeat_frame(down[0]),
            repeat_frame(up[0]),
            repeat_frame(left[0]),
            repeat_frame(right[0]),
            down,
            up,
            left,
            right,
        ]

    if len(rows) >= 4 and len(rows[0]) >= 4:
        idle_down = rows[0][0]
        idle_right = rows[0][1]
        idle_up = rows[0][2]
        idle_left = rows[0][3]
        side_source: list[Image.Image] = []
        for row in rows[1:]:
            side_source.extend(row)
        side_walk = pick_six(side_source or [idle_right])
        return [
            repeat_frame(idle_down),
            repeat_frame(idle_up),
            repeat_frame(idle_left),
            repeat_frame(idle_right),
            repeat_frame(idle_down),
            repeat_frame(idle_up),
            mirror_frames(side_walk),
            side_walk,
        ]

    poses = extract_pose_crops(source)
    if not poses:
        raise ValueError(f"no usable poses found for {slug}")
    base = poses[0]
    right = pick_six(poses[1:] or [base])
    return [
        repeat_frame(base),
        repeat_frame(base),
        mirror_frames(right),
        repeat_frame(right[0]),
        repeat_frame(base),
        repeat_frame(base),
        mirror_frames(right),
        right,
    ]


def normalize_to_cell(frames: list[Image.Image]) -> list[Image.Image]:
    cleaned = [clear_cell_background(frame) for frame in frames]
    bounds = [alpha_bounds(frame) for frame in cleaned]
    valid = [box for box in bounds if box]
    if not valid:
        return [Image.new("RGBA", (CELL, CELL)) for _ in frames]

    max_width = max(box[2] - box[0] for box in valid)
    max_height = max(box[3] - box[1] for box in valid)
    scale = min((CELL - 8) / max_width, (CELL - 8) / max_height, 1)
    normalized: list[Image.Image] = []

    for frame, box in zip(cleaned, bounds):
        canvas = Image.new("RGBA", (CELL, CELL))
        if box:
            crop = frame.crop(box)
            width = max(1, round(crop.width * scale))
            height = max(1, round(crop.height * scale))
            crop = crop.resize((width, height), Image.Resampling.NEAREST)
            canvas.alpha_composite(crop, ((CELL - width) // 2, CELL - height - 2))
        normalized.append(canvas)

    return normalized


def build_sheet(source_path: Path, slug: str) -> Image.Image:
    source = Image.open(source_path).convert("RGBA")
    rows = build_frame_rows(source, slug)
    frames = normalize_to_cell([frame for row in rows for frame in row])
    if len(frames) != COLS * ROWS:
        raise ValueError(f"{slug} produced {len(frames)} frames, expected 48")

    sheet = Image.new("RGBA", OUT_SIZE)
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, ((index % COLS) * CELL, (index // COLS) * CELL))
    return sheet


def compile_all(source_dir: Path, walk_dir: Path, preview_dir: Path) -> None:
    walk_dir.mkdir(parents=True, exist_ok=True)
    preview_dir.mkdir(parents=True, exist_ok=True)

    for source_name, slug in CHARACTERS.items():
        source_path = source_dir / source_name
        if not source_path.exists():
            raise FileNotFoundError(source_path)

        sheet = build_sheet(source_path, slug)
        walk_path = walk_dir / f"{slug}.png"
        preview_path = preview_dir / f"{slug}.png"
        sheet.save(walk_path)
        first = sheet.crop((0, 0, CELL, CELL))
        preview = Image.new("RGBA", PREVIEW_SIZE)
        preview.alpha_composite(first, (0, 0))
        preview.save(preview_path)
        print(f"compiled {source_name} -> {walk_path}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", default=r"D:\characters\RialoTempleAgent")
    parser.add_argument("--walk-dir", default=r"public\temple-play\characters\walk")
    parser.add_argument("--preview-dir", default=r"public\temple-play\characters\preview")
    args = parser.parse_args()
    compile_all(Path(args.source_dir), Path(args.walk_dir), Path(args.preview_dir))


if __name__ == "__main__":
    main()
