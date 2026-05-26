#!/usr/bin/env python3
"""Generate an Open-Graph thumbnail (1200x630) for an ATSHack blog post.

Single-file PIL implementation. No API key, no rate limit, no costs.
Brand palette pulled from style.css. Lato Black for the display headline.

Usage:
    python generate_blog_thumb.py --slug my-post --title "Long headline"
    python generate_blog_thumb.py --slug my-post --title "..." --color coral
    python generate_blog_thumb.py --slug my-post --title "..." --tag "ATS"

Output: blog-thumbs/<slug>.png (1200x630)
"""

import argparse
import re
import sys
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "blog-thumbs"

# Brand palette (style.css)
BG_0 = (10, 10, 15)        # --bg-0
BG_2 = (18, 21, 27)        # --bg-2
ACCENT = (202, 255, 0)     # --accent (CAFF00)
CORAL = (255, 71, 87)      # --coral
INK_0 = (245, 246, 248)    # --ink-0
INK_2 = (144, 151, 163)    # --ink-2

FONT_BLACK = "/usr/share/fonts/truetype/lato/Lato-Black.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/lato/Lato-Bold.ttf"
FONT_REGULAR = "/usr/share/fonts/truetype/lato/Lato-Regular.ttf"

W, H = 1200, 630
PAD_X, PAD_Y = 70, 70

COLORS = {
    "accent": ACCENT,
    "coral": CORAL,
    "white": INK_0,
}


def wrap_headline(draw, text, font, max_w):
    """Greedy wrap that prefers full-word lines under max_w pixels."""
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=font) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def pick_headline_size(draw, text, max_w, max_lines):
    """Find the largest font size that fits in max_lines."""
    for size in (96, 88, 80, 72, 64, 58, 52):
        font = ImageFont.truetype(FONT_BLACK, size)
        lines = wrap_headline(draw, text, font, max_w)
        if len(lines) <= max_lines:
            return font, lines
    # Fallback: smallest font, accept overflow.
    font = ImageFont.truetype(FONT_BLACK, 48)
    return font, wrap_headline(draw, text, font, max_w)


def draw_brand_mark(draw, x, y, accent_color):
    """ATS pill + ATSHACK wordmark, top-left."""
    tile_font = ImageFont.truetype(FONT_BLACK, 26)
    name_font = ImageFont.truetype(FONT_BOLD, 26)
    # Pill tile "ATS"
    tile_text = "ATS"
    tw = draw.textlength(tile_text, font=tile_font)
    pad_x, pad_y = 14, 8
    tile_w = int(tw + pad_x * 2)
    tile_h = 44
    draw.rounded_rectangle([x, y, x + tile_w, y + tile_h], radius=10, fill=accent_color)
    draw.text((x + pad_x, y + pad_y - 2), tile_text, font=tile_font, fill=BG_0)
    # Wordmark "ATSHack"
    name_x = x + tile_w + 12
    name_y = y + 8
    draw.text((name_x, name_y), "ATSHack", font=name_font, fill=INK_0)


def make_thumbnail(slug, title, tag=None, color="accent"):
    accent = COLORS.get(color, ACCENT)

    img = Image.new("RGB", (W, H), BG_0)
    draw = ImageDraw.Draw(img, "RGBA")

    # Soft vignette: brighten center via radial highlight
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    cx, cy = W // 2, H // 2
    for r in range(420, 0, -20):
        alpha = max(0, 22 - int(r * 22 / 420))
        gdraw.ellipse([cx - r, cy - r, cx + r, cy + r],
                      fill=(accent[0], accent[1], accent[2], alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(40))
    img.paste(glow, (0, 0), glow)

    # Diagonal accent stripe in bottom-right
    stripe = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(stripe)
    sdraw.polygon(
        [(W, H - 220), (W, H), (W - 220, H)],
        fill=(accent[0], accent[1], accent[2], 28),
    )
    img.paste(stripe, (0, 0), stripe)

    draw = ImageDraw.Draw(img, "RGBA")

    # Top: brand mark
    draw_brand_mark(draw, PAD_X, PAD_Y, accent)

    # Top-right: optional tag chip (e.g., "ATS", "Strategy")
    if tag:
        tag_font = ImageFont.truetype(FONT_BOLD, 18)
        tag_text = tag.upper()
        tw = draw.textlength(tag_text, font=tag_font)
        chip_w = int(tw + 28)
        chip_h = 36
        chip_x = W - PAD_X - chip_w
        chip_y = PAD_Y + 4
        draw.rounded_rectangle(
            [chip_x, chip_y, chip_x + chip_w, chip_y + chip_h],
            radius=18,
            fill=(accent[0], accent[1], accent[2], 30),
            outline=accent,
            width=1,
        )
        draw.text((chip_x + 14, chip_y + 8), tag_text, font=tag_font, fill=accent)

    # Headline: largest fitting size, vertically centered in the lower half
    max_w = W - PAD_X * 2
    max_lines = 4
    font, lines = pick_headline_size(draw, title, max_w, max_lines)

    # Position the block so it sits in the middle-lower area
    line_h = font.size + 10
    block_h = len(lines) * line_h
    start_y = (H - block_h) // 2 + 20

    for i, line in enumerate(lines):
        y = start_y + i * line_h
        # Subtle shadow
        draw.text((PAD_X + 3, y + 4), line, font=font, fill=(0, 0, 0, 180))
        draw.text((PAD_X, y), line, font=font, fill=INK_0)

    # Bottom accent rule above footer
    rule_y = H - PAD_Y - 50
    draw.rectangle([PAD_X, rule_y, PAD_X + 90, rule_y + 4], fill=accent)

    # Footer kicker
    footer_font = ImageFont.truetype(FONT_BOLD, 22)
    draw.text((PAD_X, rule_y + 16), "atshack.com", font=footer_font, fill=INK_2)

    # Save
    OUT_DIR.mkdir(exist_ok=True)
    out = OUT_DIR / f"{slug}.png"
    img.save(out, "PNG", optimize=True)
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--slug", required=True)
    p.add_argument("--title", required=True)
    p.add_argument("--tag", default=None, help="Small chip in upper-right corner")
    p.add_argument("--color", default="accent", choices=list(COLORS.keys()))
    args = p.parse_args()

    out = make_thumbnail(args.slug, args.title, tag=args.tag, color=args.color)
    print(f"  -> {out}")


if __name__ == "__main__":
    main()
