"""1200x630 tile for the landing page. House colours match the other chice tiles."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
BG = (243, 240, 234)
INK = (26, 25, 22)
MUTED = (106, 101, 96)
PIPE = (26, 58, 82)
WATER = (143, 196, 221)
WATER_EDGE = (46, 111, 143)
PAPER = (255, 253, 248)


def font(size: int) -> ImageFont.ImageFont:
    for name in ("georgia.ttf", "times.ttf", "segoeui.ttf"):
        path = Path(r"C:\Windows\Fonts") / name
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def main() -> None:
    image = Image.new("RGB", (1200, 630), BG)
    draw = ImageDraw.Draw(image)
    title = font(78)
    sub = font(28)
    draw.text((72, 150), "Icon Water", font=title, fill=INK)
    draw.text((72, 240), "Sewer Grade", font=title, fill=INK)
    draw.text((76, 360), "Minimum and maximum grade", font=sub, fill=MUTED)
    draw.text((76, 404), "for an ACT gravity sewer.", font=sub, fill=MUTED)

    cx, cy, r = 900, 330, 180
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=PAPER, outline=PIPE, width=8)
    # water up to about 30% of the diameter
    yd = 0.32
    y = cy + r - 2 * r * yd
    half = math.sqrt(max(0, r * r - (y - cy) ** 2))
    draw.chord((cx - r + 6, cy - r + 6, cx + r - 6, cy + r - 6), start=0, end=180, fill=WATER, outline=WATER_EDGE)
    draw.line((cx - half, y, cx + half, y), fill=WATER_EDGE, width=4)
    image.save(ROOT / "og.png", "PNG")
    print("wrote", ROOT / "og.png")


if __name__ == "__main__":
    main()
