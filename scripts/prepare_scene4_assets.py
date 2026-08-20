from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path("/Users/liull02/Desktop/文物小游戏/demo/public/assets")
SOURCES = {
    "li_work_complete.png": Path("/Users/liull02/.codex/generated_images/01a01dda-f079-7120-bc1e-f1dee4d6896b/exec-6855f82b-3228-4c89-b6b6-9f8f62cd0774.png"),
    "tool_water_bowl.png": Path("/Users/liull02/.codex/generated_images/01a01dda-f079-7120-bc1e-f1dee4d6896b/exec-8aa8c625-3f0b-4ffe-acae-f9bab228d45a.png"),
    "tool_sand_basket.png": Path("/Users/liull02/.codex/generated_images/01a01dda-f079-7120-bc1e-f1dee4d6896b/exec-e309d958-bb8e-4289-9aad-1cc23ad3e36f.png"),
}


def trim_with_padding(image: Image.Image, padding: int = 28) -> Image.Image:
    alpha = image.getchannel("A")
    box = alpha.getbbox()
    if not box:
        return image
    left = max(0, box[0] - padding)
    top = max(0, box[1] - padding)
    right = min(image.width, box[2] + padding)
    bottom = min(image.height, box[3] + padding)
    return image.crop((left, top, right, bottom))


def remove_connected_checkerboard(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    seen = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def background_candidate(x: int, y: int) -> bool:
        red, green, blue, _ = pixels[x, y]
        return min(red, green, blue) >= 198 and max(red, green, blue) - min(red, green, blue) <= 24

    for x in range(width):
        if background_candidate(x, 0):
            queue.append((x, 0))
        if background_candidate(x, height - 1):
            queue.append((x, height - 1))
    for y in range(height):
        if background_candidate(0, y):
            queue.append((0, y))
        if background_candidate(width - 1, y):
            queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        index = y * width + x
        if seen[index] or not background_candidate(x, y):
            continue
        seen[index] = 1
        red, green, blue, _ = pixels[x, y]
        pixels[x, y] = (red, green, blue, 0)
        if x > 0:
            queue.append((x - 1, y))
        if x + 1 < width:
            queue.append((x + 1, y))
        if y > 0:
            queue.append((x, y - 1))
        if y + 1 < height:
            queue.append((x, y + 1))

    return trim_with_padding(rgba)


for name, source in SOURCES.items():
    image = Image.open(source).convert("RGBA")
    prepared = trim_with_padding(image) if name.startswith("li_") else remove_connected_checkerboard(image)
    prepared.save(ROOT / name, optimize=True)
