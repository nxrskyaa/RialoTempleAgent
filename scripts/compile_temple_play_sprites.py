from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


CELL = 96
COLS = 6
ROWS = 8
OUT_SIZE = (COLS * CELL, ROWS * CELL)


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


def is_matte_pixel(red: int, green: int, blue: int, alpha: int, allow_dark_matte: bool) -> bool:
    if alpha < 8:
        return True
    hot_pink = red > 170 and blue > 145 and green < 135 and red - green > 60 and blue - green > 45
    dark_matte = allow_dark_matte and red < 26 and green < 26 and blue < 26 and max(red, green, blue) - min(red, green, blue) < 12
    bright_checker = red > 220 and green > 220 and blue > 220 and max(red, green, blue) - min(red, green, blue) < 38
    gray_checker = red > 188 and green > 188 and blue > 188 and max(red, green, blue) - min(red, green, blue) < 20
    return hot_pink or dark_matte or bright_checker or gray_checker


def is_global_chroma(red: int, green: int, blue: int, alpha: int) -> bool:
    if alpha < 8:
        return True
    return red > 170 and blue > 145 and green < 135 and red - green > 60 and blue - green > 45


def has_opaque_dark_edge(image: Image.Image) -> bool:
    pixels = image.convert("RGBA").load()
    width, height = image.size
    total = max(1, width * 2 + height * 2)
    dark = 0
    for x in range(width):
        for y in (0, height - 1):
            red, green, blue, alpha = pixels[x, y]
            if alpha > 8 and red < 28 and green < 28 and blue < 28:
                dark += 1
    for y in range(height):
        for x in (0, width - 1):
            red, green, blue, alpha = pixels[x, y]
            if alpha > 8 and red < 28 and green < 28 and blue < 28:
                dark += 1
    return dark / total > 0.35


def flood_clear_background(image: Image.Image) -> Image.Image:
    allow_dark_matte = has_opaque_dark_edge(image)
    image = image.convert("RGBA")
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
        red, green, blue, alpha = pixels[x, y]
        if not is_matte_pixel(red, green, blue, alpha, allow_dark_matte):
            continue
        pixels[x, y] = (0, 0, 0, 0)
        queue.append((x - 1, y))
        queue.append((x + 1, y))
        queue.append((x, y - 1))
        queue.append((x, y + 1))

    # Remove pink matte islands left inside grid gaps without touching black clothing.
    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            if is_global_chroma(red, green, blue, alpha):
                pixels[x, y] = (0, 0, 0, 0)

    return image


def alpha_bounds(image: Image.Image) -> tuple[int, int, int, int] | None:
    return image.getchannel("A").getbbox()


def dominant_component_crop(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    mask = alpha.point(lambda value: 255 if value > 12 else 0).filter(ImageFilter.MaxFilter(7))
    components = connected_components(mask)
    if not components:
        return image
    max_area = max(component[4] for component in components)
    largest = max(components, key=lambda component: component[4])
    keep: list[tuple[int, int, int, int, int]] = []
    for component in components:
        left, top, right, bottom, area = component
        center_x = (left + right) / 2
        center_y = (top + bottom) / 2
        near_center = image.width * 0.08 <= center_x <= image.width * 0.92 and image.height * 0.04 <= center_y <= image.height * 0.96
        if component == largest or (area >= max(90, max_area * 0.12) and near_center):
            keep.append(component)
    left = min(component[0] for component in keep)
    top = min(component[1] for component in keep)
    right = max(component[2] for component in keep)
    bottom = max(component[3] for component in keep)
    pad = 4
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(image.width, right + pad)
    bottom = min(image.height, bottom + pad)
    return image.crop((left, top, right, bottom))


def crop_content(image: Image.Image) -> Image.Image | None:
    clean = flood_clear_background(image)
    clean = dominant_component_crop(clean)
    bounds = alpha_bounds(clean)
    if not bounds:
        return None
    crop = clean.crop(bounds)
    if crop.width < 8 or crop.height < 12:
        return None
    return crop


def crop_grid(source: Image.Image, col: int, row: int, cols: int = COLS, rows: int = ROWS) -> Image.Image | None:
    left = round(source.width * col / cols)
    top = round(source.height * row / rows)
    right = round(source.width * (col + 1) / cols)
    bottom = round(source.height * (row + 1) / rows)
    return crop_content(source.crop((left, top, right, bottom)))


def pick_six(frames: list[Image.Image]) -> list[Image.Image]:
    frames = [frame for frame in frames if frame is not None]
    if not frames:
        return []
    if len(frames) == 1:
        return [frames[0].copy() for _ in range(6)]
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


def mirror(frames: list[Image.Image]) -> list[Image.Image]:
    return [frame.transpose(Image.Transpose.FLIP_LEFT_RIGHT) for frame in frames]


def repeat(frame: Image.Image) -> list[Image.Image]:
    return [frame.copy() for _ in range(6)]


def grid6x8_rows(source: Image.Image) -> list[list[Image.Image]]:
    rows: list[list[Image.Image]] = []
    for row in range(ROWS):
        cells = [crop_grid(source, col, row) for col in range(COLS)]
        row_frames = pick_six([cell for cell in cells if cell is not None])
        rows.append(row_frames)

    for row, frames in enumerate(rows):
        if frames:
            continue
        if row == 3 and rows[2]:
            rows[row] = mirror(rows[2])
        elif row == 7 and rows[6]:
            rows[row] = mirror(rows[6])
        elif row > 0 and rows[row - 1]:
            rows[row] = [frame.copy() for frame in rows[row - 1]]
        elif rows[0]:
            rows[row] = [frame.copy() for frame in rows[0]]
        else:
            raise ValueError(f"empty row {row}")
    return rows


def connected_components(mask: Image.Image) -> list[tuple[int, int, int, int, int]]:
    width, height = mask.size
    data = mask.load()
    visited = bytearray(width * height)
    components: list[tuple[int, int, int, int, int]] = []

    for start_y in range(height):
        for start_x in range(width):
            index = start_y * width + start_x
            if visited[index] or data[start_x, start_y] == 0:
                continue
            stack = [(start_x, start_y)]
            visited[index] = 1
            left = width
            right = -1
            top = height
            bottom = -1
            area = 0
            while stack:
                x, y = stack.pop()
                area += 1
                left = min(left, x)
                right = max(right, x)
                top = min(top, y)
                bottom = max(bottom, y)
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    next_index = ny * width + nx
                    if visited[next_index] or data[nx, ny] == 0:
                        continue
                    visited[next_index] = 1
                    stack.append((nx, ny))
            components.append((left, top, right + 1, bottom + 1, area))
    return components


def component_rows(source: Image.Image) -> list[list[Image.Image]]:
    clean = flood_clear_background(source)
    alpha = clean.getchannel("A")
    mask = alpha.point(lambda value: 255 if value > 12 else 0).filter(ImageFilter.MaxFilter(9))
    min_area = max(380, int(source.width * source.height * 0.00035))
    items: list[tuple[float, float, Image.Image]] = []

    for left, top, right, bottom, area in connected_components(mask):
        if area < min_area:
            continue
        pad = 8
        left = max(0, left - pad)
        top = max(0, top - pad)
        right = min(clean.width, right + pad)
        bottom = min(clean.height, bottom + pad)
        crop = crop_content(clean.crop((left, top, right, bottom)))
        if not crop:
            continue
        items.append(((left + right) / 2, (top + bottom) / 2, crop))

    items.sort(key=lambda item: item[1])
    row_threshold = max(54, source.height / 12)
    rows: list[list[tuple[float, float, Image.Image]]] = []
    for item in items:
        if not rows:
            rows.append([item])
            continue
        average_y = sum(row_item[1] for row_item in rows[-1]) / len(rows[-1])
        if abs(item[1] - average_y) > row_threshold:
            rows.append([item])
        else:
            rows[-1].append(item)

    output: list[list[Image.Image]] = []
    for row in rows:
        row.sort(key=lambda item: item[0])
        output.append([item[2] for item in row])
    return output


def component_layout_rows(source: Image.Image) -> list[list[Image.Image]]:
    rows = component_rows(source)
    if len(rows) >= 8:
        return [pick_six(row) for row in rows[:8]]

    if len(rows) >= 4:
        down = pick_six(rows[0])
        right = pick_six(rows[1])
        up = pick_six(rows[2])
        left = pick_six(rows[3])
        return [
            repeat(down[0]),
            repeat(up[0]),
            repeat(left[0]),
            repeat(right[0]),
            down,
            up,
            left,
            right,
        ]

    if len(rows) == 3:
        top = rows[0]
        down = pick_six(top[:3] or top)
        up = pick_six(top[3:5] or top)
        side = pick_six(top[5:] + rows[1] + rows[2])
        return [
            repeat(down[0]),
            repeat(up[0]),
            repeat(mirror(side)[0]),
            repeat(side[0]),
            down,
            up,
            mirror(side),
            side,
        ]

    if not rows:
        raise ValueError("no character components found")
    base = pick_six(rows[0])
    return [
        repeat(base[0]),
        repeat(base[0]),
        repeat(mirror(base)[0]),
        repeat(base[0]),
        base,
        base,
        mirror(base),
        base,
    ]


def source_rows(source: Image.Image) -> list[list[Image.Image]]:
    if source.size in {(1086, 1448), (1122, 1402)}:
        return grid6x8_rows(source)
    return component_layout_rows(source)


def normalize_rows(rows: list[list[Image.Image]]) -> list[Image.Image]:
    frames = [frame for row in rows for frame in row]
    if len(frames) != COLS * ROWS:
        raise ValueError(f"expected 48 frames, got {len(frames)}")

    bounds = [alpha_bounds(frame) for frame in frames]
    valid = [box for box in bounds if box]
    if not valid:
        return [Image.new("RGBA", (CELL, CELL)) for _ in frames]
    max_width = max(box[2] - box[0] for box in valid)
    max_height = max(box[3] - box[1] for box in valid)
    scale = min((CELL - 7) / max_width, (CELL - 6) / max_height, 1)

    normalized: list[Image.Image] = []
    for frame, box in zip(frames, bounds):
        canvas = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
        if box:
            crop = frame.crop(box)
            width = max(1, round(crop.width * scale))
            height = max(1, round(crop.height * scale))
            crop = crop.resize((width, height), Image.Resampling.NEAREST)
            canvas.alpha_composite(crop, ((CELL - width) // 2, CELL - height - 2))
        normalized.append(canvas)
    return normalized


def build_sheet(source_path: Path) -> Image.Image:
    source = Image.open(source_path).convert("RGBA")
    frames = normalize_rows(source_rows(source))
    sheet = Image.new("RGBA", OUT_SIZE, (0, 0, 0, 0))
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
        sheet = build_sheet(source_path)
        sheet.save(walk_dir / f"{slug}.png")
        sheet.crop((0, 0, CELL, CELL)).save(preview_dir / f"{slug}.png")
        print(f"compiled {source_name} -> {slug}")


def main() -> None:
    compile_all(
        Path("CharacterResource"),
        Path("public/temple-play/characters/walk"),
        Path("public/temple-play/characters/preview"),
    )


if __name__ == "__main__":
    main()
