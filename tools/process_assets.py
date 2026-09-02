from collections import deque
from pathlib import Path
from shutil import copy2

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "demo" / "public" / "assets"
OUT.mkdir(parents=True, exist_ok=True)

for name in ["bg_museum_hall.png", "bg_workshop_scroll.png"]:
    copy2(ROOT / name, OUT / name)


def flood_remove_background(image: Image.Image, mode: str) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size
    seen = bytearray(w * h)
    queue = deque()

    def background(x: int, y: int) -> bool:
        r, g, b, _ = pixels[x, y]
        if mode == "checker":
            return min(r, g, b) > 192 and max(r, g, b) - min(r, g, b) < 30
        # Warm paper used by the master sheet.
        return r > 178 and g > 165 and b > 140 and r - b < 75

    for x in range(w):
        if background(x, 0): queue.append((x, 0))
        if background(x, h - 1): queue.append((x, h - 1))
    for y in range(h):
        if background(0, y): queue.append((0, y))
        if background(w - 1, y): queue.append((w - 1, y))

    while queue:
        x, y = queue.popleft()
        idx = y * w + x
        if seen[idx] or not background(x, y):
            continue
        seen[idx] = 1
        r, g, b, _ = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)
        if x: queue.append((x - 1, y))
        if x + 1 < w: queue.append((x + 1, y))
        if y: queue.append((x, y - 1))
        if y + 1 < h: queue.append((x, y + 1))

    if mode == "checker":
        # Generated sheets sometimes contain a visible checkerboard instead of
        # real transparency. Remove the remaining disconnected light squares.
        for y in range(h):
            for x in range(w):
                r, g, b, a = pixels[x, y]
                spread = max(r, g, b) - min(r, g, b)
                light = min(r, g, b)
                if spread < 24 and light > 205:
                    pixels[x, y] = (r, g, b, 0)
                elif spread < 20 and light > 185:
                    pixels[x, y] = (r, g, b, max(0, min(a, int((light - 185) * 10))))
    return rgba


def crop(source: str, box: tuple[int, int, int, int], target: str, mode: str | None = None):
    image = Image.open(ROOT / source)
    if mode:
        image = flood_remove_background(image, mode)
    image.crop(box).save(OUT / target, optimize=True)


crop("char_li_sheet.png", (15, 0, 245, 660), "li_stand.png", "checker")
crop("char_li_sheet.png", (0, 635, 430, 980), "li_work.png", "checker")
crop("char_li_sheet.png", (970, 965, 1254, 1254), "li_sad.png", "checker")

crop("char_yan_sheet.png", (385, 0, 600, 525), "yan_stand.png")
crop("char_yan_sheet.png", (1015, 475, 1295, 965), "yan_depart.png")
crop("char_yan_sheet.png", (325, 470, 745, 900), "brothers.png")

crop("char_master_sheet.png", (0, 0, 375, 485), "master_portrait.png", "paper")
crop("char_master_sheet.png", (375, 0, 585, 515), "master_stand.png", "paper")
crop("char_master_sheet.png", (0, 470, 470, 790), "master_work.png", "paper")

crop("workers_pack.png", (0, 0, 1254, 380), "workers_cut.png", "checker")
crop("workers_pack.png", (0, 365, 1254, 805), "workers_sand_water.png", "checker")
crop("workers_pack.png", (0, 790, 420, 1254), "workers_carry.png", "checker")

print(f"Processed assets written to {OUT}")
