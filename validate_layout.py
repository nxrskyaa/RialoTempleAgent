import re

src = open('src/pages/TemplePlay.tsx').read()
buildings = {
    k: (int(x), int(y), int(w), int(h))
    for k, x, y, w, h in re.findall(r"key: '(\w+)', x: (\d+), y: (\d+), w: (\d+), h: (\d+)", src)
}
pond = (160, 768, 256, 192)
box = lambda b: (b[0] - b[2] / 2, b[1] - b[3], b[0] + b[2] / 2, b[1])
ov = lambda a, b: (
    max(0, min(a[2], b[2]) - max(a[0], b[0])),
    max(0, min(a[3], b[3]) - max(a[1], b[1])),
)
ks = list(buildings)
bad = 0
for i in range(len(ks)):
    for j in range(i + 1, len(ks)):
        ix, iy = ov(box(buildings[ks[i]]), box(buildings[ks[j]]))
        if ix > 0 and iy > 0:
            print(f"OVERLAP {ks[i]} x {ks[j]}: {ix:.0f}x{iy:.0f}")
            bad += 1
pb = (pond[0], pond[1], pond[0] + pond[2], pond[1] + pond[3])
for k in ks:
    ix, iy = ov(box(buildings[k]), pb)
    if ix > 0 and iy > 0:
        print(f"POND OVERLAP {k}")
        bad += 1
    x0, y0, x1, y1 = box(buildings[k])
    if x0 < 0 or y0 < 0 or x1 > 1600 or y1 > 1280:
        print(f"OUT OF BOUNDS {k}")
for px, py in [(int(x), int(y)) for x, y in re.findall(r"\n\s+x: (\d+),\n\s+y: (\d+),", src)]:
    for k in ks:
        x0, y0, x1, y1 = box(buildings[k])
        if x0 < px < x1 and y0 < py < y1:
            print(f"NPC ({px},{py}) inside {k}")
            bad += 1
    if pond[0] < px < pond[0] + pond[2] and pond[1] < py < pond[1] + pond[3]:
        print(f"NPC ({px},{py}) inside POND")
        bad += 1
print("RESULT:", "CLEAN" if bad == 0 else f"{bad} ISSUES - PERBAIKI SEBELUM COMMIT")
