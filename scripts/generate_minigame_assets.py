"""Generate hand-authored pixel-art assets for Temple Play minigames.

Every sprite is a character grid mapped to a palette ('.' = transparent),
rendered 1:1 to PNG; the game scales them up with pixelated rendering.

Usage: python scripts/generate_minigame_assets.py
Output: public/temple-play/minigame/{fish,pets,chest}/*.png + contact.png debug
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public" / "temple-play" / "minigame"


def render(rows: list[str], palette: dict[str, str]) -> Image.Image:
    height = len(rows)
    width = max(len(r) for r in rows)
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    px = img.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch == "." or ch == " ":
                continue
            color = palette[ch]
            px[x, y] = tuple(int(color[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
    return img


# ---------------------------------------------------------------------------
# Fish (side view, facing left). Shapes are shared; palettes vary per species.
# Keys: o outline, B body, S belly/secondary, T tail/fins, W eye white,
#       K pupil, P pattern/patch, A accent
# ---------------------------------------------------------------------------

CARP = [
    "........ooooo...........",
    "......ooBBBBBoo...oo....",
    ".....oBBBPBBBBBo.oTTo...",
    "...ooBBBBBPBBBBBoTTTo...",
    "..oBWWBBBBBBPBBBTTTTo...",
    ".oBWKKBBPBBBBBBBTTTTo...",
    ".oBWKKBBBBBBPBBBTTTTo...",
    "..oBWWBBBPBBBBBBTTTTo...",
    "...ooSSSSBBBBPBBoTTTo...",
    ".....oSSSSSBBBBo.oTTo...",
    "......ooSSSSSoo...oo....",
    "........ooooo...........",
]

CATFISH = [
    "..A......oooooo.........",
    "...A...ooBBBBBBoo..oo...",
    "....AooBBBBBBBBBBooTTo..",
    "...oBBWWBBBBBBBBBBTTTo..",
    "..oBBWKKBBBBBBBBBBTTTo..",
    "..oBBWKKBBBBBBBBBBTTTo..",
    "...oBBWWBBBBBBBBBBTTTo..",
    "....AooSSSSSSSSSSooTTo..",
    "...A...ooSSSSSSoo..oo...",
    "..A......oooooo.........",
]

ROUND = [
    "........oooooo..........",
    "......ooBBBBBBoo........",
    ".....oBBBBPBBBBBo..oo...",
    "....oBBWWBBBBPBBBooTo...",
    "...oBBWKKBBBBBBBBTTTo...",
    "...oBBWKKBBPBBBBBTTTo...",
    "...oBBWWBBBBBBPBBTTTo...",
    "....oBSSBBPBBBBBBooTo...",
    ".....oSSSSSSBBBSo..oo...",
    "......ooSSSSSSoo........",
    "........oooooo..........",
]

BETTA = [
    "..........ooooo..TTTT...",
    "........ooBBBBBooTTTTT..",
    ".......oBBBPBBBBTTTTTT..",
    "....ooBBBBBBBPBBTTTTTT..",
    "...oBWWBBBPBBBBBATTTTT..",
    "..oBWKKBBBBBBPBBAATTTT..",
    "..oBWKKBBPBBBBBBAATTTT..",
    "...oBWWBBBBBPBBBATTTTT..",
    "....ooBBBPBBBBBBTTTTTT..",
    ".......oBBBBBBBTTTTTTT..",
    "........ooTTTTTTTTTT....",
    "..........TTTTTTTT......",
]

AROWANA = [
    "....oooo................",
    "..ooBBBBooooooooooo.....",
    ".oBWWBBBBBBBBBBBBBBooo..",
    "oBWKKBBPBBPBBPBBPBBBTTo.",
    "oBWKKBBBBBBBBBBBBBBBTTo.",
    ".oBWWSSSSSSSSSSSSSBTTo..",
    "..ooSSSSooooooooooTTo...",
    "....oooo..........oo....",
]

MOON = [
    ".......ooooooo..........",
    ".....ooBBBBBBBoo........",
    "....oBBBBBAABBBBo..oo...",
    "...oBBWWBBBAABBBBooTo...",
    "..oBBWKKBBBBAABBBTTTo...",
    "..oBBWKKBBBBAABBBTTTo...",
    "..oBBWWBBBBAABBBBTTTo...",
    "...oBBBBBAABBBBBBooTo...",
    "....oBBBAABBBBBBo..oo...",
    ".....ooBBBBBBBoo........",
    ".......ooooooo..........",
]

DRAGON_KOI = [
    ".A...A....ooooo.........",
    ".AA.AA..ooBBBBBoo..oo...",
    "..AAA..oBBBPBBBBBooTTo..",
    "...oooBBBBBBPBBBBBTTTo..",
    "..oBWWBBBPBBBBBPBBTTTo..",
    ".oBWKKBBBBBPBBBBBBTTTo..",
    ".oBWKKBBPBBBBBPBBBTTTo..",
    "..oBWWBBBBBPBBBBBBTTTo..",
    "...AoSSSSBBBBBBPBooTTo..",
    "..A..oSSSSSSBBBBo..oo...",
    ".A....ooSSSSSoo.........",
]

LEVIATHAN = [
    "...A...A...A............",
    "..oAo.oAo.oAo...........",
    ".oBBBoBBBoBBBoooooo.....",
    "oBWWBBBBBBBBBBBBBBBoo...",
    "oBWKKBPBBPBBPBBPBBBBBo..",
    "oBWKKBBBBBBBBBBBBBBBBBo.",
    ".oBWWBSSSSSSSSSSSBBTTTo.",
    "..oBSSSSooooooSSSBTTTo..",
    "...ooooo......ooBTTTo...",
    "...............oTTTo....",
    "................ooo.....",
]

RAY = [
    "........oooooo..........",
    "......ooBBBBBBoo........",
    "....ooBBBBBBBBBBoo......",
    "..ooBBWKBBBBBBPBBBoooo..",
    ".oBBBBBBBBBPBBBBABTTTTo.",
    "..ooBBBBBBBBBBPBBBoooo..",
    "....ooSSSSSSSSSSoo......",
    "......ooSSSSSSoo........",
    "........oooooo..........",
]

FISH = {
    "zebra-danio": (CARP, {
        "o": "#3a4048", "B": "#d8dde2", "S": "#eef1f4", "T": "#8a94a0",
        "W": "#ffffff", "K": "#14181c", "P": "#3a4048", "A": "#3a4048",
    }),
    "sunny-guppy": (BETTA, {
        "o": "#7a4a10", "B": "#f6c33c", "S": "#fadf90", "T": "#ff8a3c",
        "W": "#ffffff", "K": "#241a06", "P": "#ff8a3c", "A": "#ffd977",
    }),
    "glass-eel": (AROWANA, {
        "o": "#5a7a8a", "B": "#cfe8f2", "S": "#eff8fc", "T": "#a5cbdd",
        "W": "#ffffff", "K": "#1c2c34", "P": "#a5cbdd", "A": "#a5cbdd",
    }),
    "royal-gar": (AROWANA, {
        "o": "#1f4d2e", "B": "#4f9e5c", "S": "#a9dcae", "T": "#f2c24e",
        "W": "#ffffff", "K": "#0f2415", "P": "#2f7a45", "A": "#f2c24e",
    }),
    "thunder-ray": (RAY, {
        "o": "#2c3a6e", "B": "#4f63b8", "S": "#93a3e0", "T": "#3a4a8a",
        "W": "#ffffff", "K": "#10142a", "P": "#f6d33c", "A": "#f6d33c",
    }),
    "aurora-salmon": (CARP, {
        "o": "#7a3a52", "B": "#f090ac", "S": "#f8cede", "T": "#4de3d2",
        "W": "#ffffff", "K": "#2a0f18", "P": "#4de3d2", "A": "#4de3d2",
    }),
    "celestial-koi": (DRAGON_KOI, {
        "o": "#7a6a2a", "B": "#f4f0e2", "S": "#ffffff", "T": "#f2c24e",
        "W": "#ffffff", "K": "#241a08", "P": "#f2c24e", "A": "#ffe9a0",
    }),
    "koi-merah": (CARP, {
        "o": "#7a2f24", "B": "#f5efe0", "S": "#f0dfc2", "T": "#ff8f6b",
        "W": "#ffffff", "K": "#1c1310", "P": "#e34f3a", "A": "#e34f3a",
    }),
    "mujair-hijau": (CARP, {
        "o": "#1f4d2e", "B": "#57b36b", "S": "#a9dcae", "T": "#2f7a45",
        "W": "#ffffff", "K": "#132015", "P": "#2f7a45", "A": "#2f7a45",
    }),
    "lele-biru": (CATFISH, {
        "o": "#16324f", "B": "#3f6f9e", "S": "#a5c6e0", "T": "#2a4f78",
        "W": "#ffffff", "K": "#0d1826", "P": "#2a4f78", "A": "#6e93b8",
    }),
    "nila-emas": (CARP, {
        "o": "#7a5416", "B": "#f2c24e", "S": "#f8e3a4", "T": "#d99a26",
        "W": "#ffffff", "K": "#241a08", "P": "#d99a26", "A": "#d99a26",
    }),
    "gurame-ungu": (ROUND, {
        "o": "#41245c", "B": "#8a5cb8", "S": "#c9aade", "T": "#5e3a86",
        "W": "#ffffff", "K": "#1c0f28", "P": "#5e3a86", "A": "#5e3a86",
    }),
    "cupang-neon": (BETTA, {
        "o": "#5c1444", "B": "#e8467c", "S": "#f490b4", "T": "#4de3d2",
        "W": "#ffffff", "K": "#230715", "P": "#a12a90", "A": "#8ff2e8",
    }),
    "arwana-perak": (AROWANA, {
        "o": "#4a5560", "B": "#c8d3dc", "S": "#eef3f6", "T": "#94a4b0",
        "W": "#ffffff", "K": "#151a1e", "P": "#94a4b0", "A": "#94a4b0",
    }),
    "koi-naga": (DRAGON_KOI, {
        "o": "#6e1f16", "B": "#f0c04a", "S": "#f8e3a4", "T": "#d1372a",
        "W": "#ffffff", "K": "#210b07", "P": "#d1372a", "A": "#ffd977",
    }),
    "ikan-bulan": (MOON, {
        "o": "#2a3f66", "B": "#bcd3f2", "S": "#e6efFb", "T": "#8fb0dd",
        "W": "#ffffff", "K": "#101b30", "P": "#8fb0dd", "A": "#f6e08a",
    }),
    "rialo-leviathan": (LEVIATHAN, {
        "o": "#0d3f3a", "B": "#2e9e8f", "S": "#8fe0d2", "T": "#1f6e64",
        "W": "#ffffff", "K": "#06201d", "P": "#1f6e64", "A": "#f2c24e",
    }),
}

# ---------------------------------------------------------------------------
# Pets (chibi, facing the player, ~top-down overworld style).
# Keys per map, palettes inline.
# ---------------------------------------------------------------------------

EMBERPUP = ([
    "....oo........oo....",
    "...oFFo......oFFo...",
    "...oFBBo....oBBFo...",
    "....oBBoooooBBo.....",
    "....oBBBBBBBBBo.....",
    "...oBBBBBBBBBBBo....",
    "...oBWKBBBBBWKBo....",
    "...oBWKBBBBBWKBo....",
    "...oBBBBKKBBBBBo....",
    "....oBBBKKBBBBo.....",
    "....oSBBBBBBSo..FF..",
    "...oSSBBBBBBSSoFAFF.",
    "...oSBBBBBBBBSoFAAF.",
    "...oBBoBBBBoBBooFF..",
    "....oo.oBBo.oo......",
    "........oo..........",
], {"o": "#5c2c16", "B": "#e8823c", "S": "#f6c690", "F": "#ff5f2a",
    "A": "#ffc93c", "W": "#ffffff", "K": "#20120a"})

SPROUTLE = ([
    ".........AA.........",
    "........AGGA........",
    ".........GG.........",
    "......ooGGGGoo......",
    ".....oGGGGGGGGo.....",
    "....oGWKGGGGWKGo....",
    "....oGWKGGGGWKGo....",
    "....oGGGGKKGGGGo....",
    ".....oGGGGGGGGo.....",
    "....ooSSSSSSSSoo....",
    "...oSPPSPPSPPSPSo...",
    "...oSPPSPPSPPSPSo...",
    "...oSSPPSSPPSSPSo...",
    "....ooSSSSSSSSoo....",
    "....oGGo....oGGo....",
    ".....oo......oo.....",
], {"o": "#1f4d2e", "G": "#6fcf6f", "S": "#b98a4e", "P": "#8a6236",
    "A": "#a9f27e", "W": "#ffffff", "K": "#132015"})

PUDDLIX = ([
    "..AA............AA..",
    ".AKAA..........AAKA.",
    ".AAA.ooooooooo..AAA.",
    "..A.oBBBBBBBBBo..A..",
    "...oBBBBBBBBBBBo....",
    "..oBWKBBBBBBWKBo....",
    "..oBWKBBBBBBWKBo....",
    "..oBBBBSSSSBBBBo....",
    "...oBBBSKKSBBBo.....",
    "...oBBBBBBBBBBo.....",
    "..oBBBBBBBBBBBBo....",
    "..oBBoBBBBBBoBBo....",
    "...oo.oBBBBo.oo.oo..",
    "......oBBBBooooBBo..",
    ".......oBBBBBBBo....",
    "........ooooooo.....",
], {"o": "#8a3a5c", "B": "#f2a0c0", "S": "#f8cede", "A": "#e86aa0",
    "K": "#2a0f1c", "W": "#ffffff"})

PEEBOLT = ([
    "...oo..........oo...",
    "..oKBo........oBKo..",
    "..oBBBo......oBBBo..",
    "...oBBBooooooBBBo...",
    "....oBBBBBBBBBBo....",
    "...oBBBBBBBBBBBBo...",
    "...oBWKBBBBBBWKBo...",
    "...oBWKBBBBBBWKBo...",
    "...oBAABBKKBBAABo...",
    "....oBBBKKKBBBBo....",
    "....oBBBBBBBBBo.AA..",
    "...oBBBBBBBBBBoAAA..",
    "...oBBBBBBBBBBoAA...",
    "...oBBoBBBBoBBoA....",
    "....oo.oBBo.oo......",
    "........oo..........",
], {"o": "#6e5312", "B": "#f6d33c", "A": "#3ccfc0", "K": "#241c06",
    "W": "#ffffff"})

ROCKLING = ([
    ".....ooooooooo......",
    "....oBBBGBBBBBo.....",
    "...oBBBBBBBGBBBo....",
    "...oBWWBBBBBWWBo....",
    "...oBKKBBBBBKKBo....",
    "...oBBBBBBBBBBBo....",
    "....oBBBKKKBBBo.....",
    "...oBBGBBBBBGBBo....",
    "..oBBBBBBBBBBBBBo...",
    "..oBoBBBGBBBBBoBo...",
    "..oBoBBBBBBGBBoBo...",
    "...ooBBBBBBBBBoo....",
    "....oBBoBBBoBBo.....",
    ".....oo.oBo.oo......",
    "........oBo.........",
    ".........o..........",
], {"o": "#3a3f47", "B": "#8a929e", "G": "#6fae6f", "K": "#16181c",
    "W": "#f2f5f8"})

WISPY = ([
    ".........oo.........",
    ".......ooBBoo.......",
    "......oBBBBBBo......",
    ".....oBBBBBBBBo.....",
    "....oBBWKBBWKBBo....",
    "....oBBWKBBWKBBo....",
    "....oBBBBBBBBBBo....",
    "....oBBBBKKBBBBo....",
    "....oABBBBBBBBAo....",
    "....oAABBBBBBAAo....",
    ".....oABBBBBBAo.....",
    ".....oBBoBBoBBo.....",
    "......oB.oB.oBo.....",
    "......o...o...o.....",
], {"o": "#1d5c5c", "B": "#5ce0d0", "A": "#a4f2e8", "K": "#0a2624",
    "W": "#ffffff"})

FROSTBUN = ([
    "....oAo......oAo....",
    "...oABAo....oABAo...",
    "...oABBo....oBBAo...",
    "...oABBo....oBBAo...",
    "....oBBoooooBBo.....",
    "....oBBBBBBBBBo.....",
    "...oBBBBBBBBBBBo....",
    "...oBWKBBBBBWKBo....",
    "...oBWKBBBBBWKBo....",
    "...oBBBBAKABBBBo....",
    "....oBBBBABBBBo.....",
    "....oBBBBBBBBBo.....",
    "...oBBBBBBBBBBBoo...",
    "...oBBoBBBBBoBBoBo..",
    "....oo.oBBBo.oooo...",
    "........ooo.........",
], {"o": "#4a6e8a", "B": "#f2f8fc", "A": "#9cd3f0", "K": "#182430",
    "W": "#ffffff"})

STARCUB = ([
    "....oo........oo....",
    "...oBBo......oBBo...",
    "...oBSBo....oBSBo...",
    "....oBBoooooBBo.....",
    "....oBBBABBBBBo.....",
    "...oBBBAAABBBBBo....",
    "...oBBBBABBBBBBo....",
    "...oBWKBBBBBWKBo....",
    "...oBWKBBBBBWKBo....",
    "...oBBBBSKSBBBBo....",
    "....oBBBSSSBBBo.....",
    "....oBBBBBBBBBo.....",
    "...oBBBBBBBBBBBo....",
    "...oBBoBBBBBoBBo....",
    "....oo.oBBBo.oo.....",
    "........ooo.........",
], {"o": "#1c2440", "B": "#3c4a7a", "S": "#8a96c0", "A": "#f6d33c",
    "K": "#0c101e", "W": "#ffffff"})

EMBERDRAKE = ([
    "..oo....oooo....oo..",
    ".oAAo..oBBBBo..oAAo.",
    ".oAAAooBBBBBBooAAAo.",
    "..oAAABBBBBBBBAAAo..",
    "...oABBWKBBWKBBAo...",
    "....oBBWKBBWKBBo....",
    "....oBBBBBBBBBBo....",
    "....oSBBSKKSBBSo....",
    ".....oBBSSSSBBo.....",
    "....oBBBBBBBBBBo....",
    "...oBBBBBBBBBBBBo...",
    "...oBBoBBBBBBoBBo...",
    "....oo.oBBBBo.oo....",
    ".......oBBo.oAo.....",
    "........oBBoAAAo....",
    ".........oo.oAo.....",
], {"o": "#5c1414", "B": "#d13a2a", "S": "#f2a03c", "A": "#ff7a2a",
    "K": "#200606", "W": "#ffe9c9"})

BUBBLY = ([
    "......oooooo......",
    "....ooBBBBBBoo....",
    "...oBBBBBBBBBBo...",
    "..oBBABBBBBBABBo..",
    "..oBWKBBBBBBWKBo..",
    "..oBWKBBBBBBWKBo..",
    "..oBBBBSKKSBBBBo..",
    "...oBBBBBBBBBBo...",
    "....ooBBBBBBoo....",
    "....oBoBBoBBoo....",
    "...oB.oBBo.oBo....",
    "...o..oB.o..o.....",
    "......o..o........",
], {"o": "#2a5c6e", "B": "#7ad4e8", "A": "#c4eef6", "S": "#a8e2f0",
    "K": "#0f2a32", "W": "#ffffff"})

MOTHIE = ([
    "..oooo......oooo..",
    ".oWWWWo....oWWWWo.",
    "oWWAAWWo..oWWAAWWo",
    "oWAAAAWWooWWAAAAWo",
    "oWWAAWWBBBBWWAAWWo",
    ".oWWWoBKBBKBoWWWo.",
    "..ooooBBBBBBoooo..",
    "....oBBSKKSBBo....",
    "...oWWBBBBBBWWo...",
    "..oWWWWBBBBWWWWo..",
    "..oWWWWoBBoWWWWo..",
    "...oooo.oo.oooo...",
    "....A........A....",
], {"o": "#4a3a1e", "W": "#e8d8a8", "A": "#c9973f", "B": "#8a6a3a",
    "K": "#1c1408", "S": "#f2e2b8"})

SHOCKFIN = ([
    "........AA........",
    ".......AAA........",
    "......oooooo......",
    "....ooBBBBBBoo....",
    "...oBWKBBBBBBBo...",
    "..oBBWKBBBBBBSBo..",
    "..oBBBBBBBBBSSBo..",
    "...oBBSKKSBBSBo...",
    "....ooBBBBBBoo....",
    "......oooooo......",
    "....A...AA........",
    "...AA....AAA......",
    "...A.......A......",
], {"o": "#6e5312", "B": "#f6d33c", "S": "#ffefb0", "A": "#78ecff",
    "K": "#241c06", "W": "#ffffff"})

LUNAROWL = ([
    ".oo............oo.",
    ".oBo..........oBo.",
    "..oBoooooooooooBo.",
    "..oBBBBBBBBBBBBo..",
    "..oBWWKBBBBWWKBo..",
    "..oBWWKBBBBWWKBo..",
    "..oBBBBAAABBBBBo..",
    "...oBSSBABBSSBo...",
    "...oBSSBBBBSSBo...",
    "...oBSSSSSSSSBo...",
    "....oBSSSSSSBo....",
    "....oBBBBBBBBo....",
    ".....oAo..oAo.....",
    "......o....o......",
], {"o": "#241c30", "B": "#4a3c64", "S": "#8a7ab0", "A": "#f2c24e",
    "K": "#100c18", "W": "#f6f0ff"})

AURORIX = ([
    "..A..A......A..A..",
    "..oAoA......AoAo..",
    "...oo..oooo..oo...",
    "....ooBBBBBBoo....",
    "....oBWKBBWKBo....",
    "....oBWKBBWKBo....",
    "....oBBBKKBBBo....",
    ".....oBBBBBBo.....",
    "....oBBAABBBBo....",
    "...oBBBAABBBBBo...",
    "...oBBBBBBBBBBo...",
    "...oBBoBBBBoBBo...",
    "....oo.oBBo.oo....",
    "........oo........",
], {"o": "#3a2a5c", "B": "#cfd8f4", "A": "#8ff2e8", "K": "#141024",
    "W": "#ffffff"})

PETS = {
    "bubbly": BUBBLY,
    "mothie": MOTHIE,
    "shockfin": SHOCKFIN,
    "lunarowl": LUNAROWL,
    "aurorix": AURORIX,
    "emberpup": EMBERPUP,
    "sproutle": SPROUTLE,
    "puddlix": PUDDLIX,
    "peebolt": PEEBOLT,
    "rockling": ROCKLING,
    "wispy": WISPY,
    "frostbun": FROSTBUN,
    "starcub": STARCUB,
    "emberdrake": EMBERDRAKE,
}

# ---------------------------------------------------------------------------
# Chest (closed / glowing / open)
# ---------------------------------------------------------------------------

CHEST_PALETTE = {
    "o": "#3d2412", "W": "#8a5a2e", "w": "#a8743e", "G": "#f2c24e",
    "g": "#ffe9a0", "L": "#ffefb0", "K": "#241505", "S": "#fff7d6",
}

CHEST_CLOSED = [
    "....oooooooooooooo....",
    "..ooWWWWWWWWWWWWWWoo..",
    ".oWWwwwwwwwwwwwwwwWWo.",
    ".oWwwwwwwwwwwwwwwwWWo.",
    ".oGGGGGGGGGGGGGGGGGGo.",
    ".oWWWWWWWGGGGWWWWWWWo.",
    ".oWwwwwwwGKKGwwwwwwWo.",
    ".oWwwwwwwGKKGwwwwwwWo.",
    ".oWwwwwwwGGGGwwwwwwWo.",
    ".oWwwwwwwwwwwwwwwwwWo.",
    ".oGGGGGGGGGGGGGGGGGGo.",
    "..oooooooooooooooooo..",
]

CHEST_GLOW = [
    "......S.......S.......",
    "....oooooooooooooo.S..",
    ".SooWWWWWWWWWWWWWWoo..",
    ".oWWwwwwwwwwwwwwwwWWo.",
    ".oLLLLLLLLLLLLLLLLLLo.",
    ".oGGGGGGGGGGGGGGGGGGo.",
    ".oWWWWWWWGGGGWWWWWWWo.",
    ".oWwwwwwwGLLGwwwwwwWo.",
    ".oWwwwwwwGLLGwwwwwwWo.",
    ".oWwwwwwwGGGGwwwwwwWo.",
    ".oWwwwwwwwwwwwwwwwwWo.",
    ".oGGGGGGGGGGGGGGGGGGo.",
    "..oooooooooooooooooo..",
]

CHEST_OPEN = [
    "..S....LLLLLLL....S...",
    "....LLLLLLLLLLLLL.....",
    "..ooLLLLLLLLLLLLoo.S..",
    ".oWWLLLLLLLLLLLLWWo...",
    ".oWwwwwwwwwwwwwwwwWo..",
    ".oGGGGGGGGGGGGGGGGGo..",
    ".oKKKKKKKKKKKKKKKKKo..",
    ".oKLLKLLKLLKLLKLLKKo..",
    ".oWWWWWWWGGGGWWWWWWWo.",
    ".oWwwwwwwGLLGwwwwwwWo.",
    ".oWwwwwwwGGGGwwwwwwWo.",
    ".oWwwwwwwwwwwwwwwwwWo.",
    ".oGGGGGGGGGGGGGGGGGGo.",
    "..oooooooooooooooooo..",
]

CHESTS = {
    "chest-closed": CHEST_CLOSED,
    "chest-glow": CHEST_GLOW,
    "chest-open": CHEST_OPEN,
}


def main() -> None:
    made: list[tuple[str, Image.Image]] = []
    for group, items in (("fish", FISH), ("pets", PETS)):
        folder = OUT / group
        folder.mkdir(parents=True, exist_ok=True)
        for name, (rows, palette) in items.items():
            img = render(rows, palette)
            img.save(folder / f"{name}.png")
            made.append((f"{group}/{name}", img))
    chest_dir = OUT / "chest"
    chest_dir.mkdir(parents=True, exist_ok=True)
    for name, rows in CHESTS.items():
        img = render(rows, CHEST_PALETTE)
        img.save(chest_dir / f"{name}.png")
        made.append((f"chest/{name}", img))

    # Debug contact sheet at 4x
    scale = 4
    cols = 6
    cell = 30 * scale
    rows_n = (len(made) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * (cell + 8) + 8, rows_n * (cell + 22) + 8), (30, 32, 42, 255))
    draw = ImageDraw.Draw(sheet)
    for i, (name, img) in enumerate(made):
        big = img.resize((img.width * scale, img.height * scale), Image.NEAREST)
        x = 8 + (i % cols) * (cell + 8)
        y = 8 + (i // cols) * (cell + 22)
        sheet.paste(big, (x + (cell - big.width) // 2, y + (cell - big.height) // 2), big)
        draw.text((x, y + cell + 2), name.split("/")[-1], fill=(255, 220, 120, 255))
    sheet.save(OUT / "contact.png")
    print(f"generated {len(made)} sprites -> {OUT}")


if __name__ == "__main__":
    main()
