#!/usr/bin/env python3
"""Generate a photographic blog thumbnail via Imagen 4 (Gemini API).

Editorial / Bloomberg-style realism. Aspect 16:9 → resize/crop to
1200x630 OG-standard. No text overlay (the blog card and og preview
already show the headline next to the image).

Usage:
    python generate_blog_photo.py --slug ai-skills-on-resume --prompt "..."
"""

import argparse
import base64
import json
import os
import sys
import urllib.request
from pathlib import Path

from PIL import Image
from io import BytesIO

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "blog-thumbs"
MODEL = "imagen-4.0-generate-001"


def generate(prompt, slug, key):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:predict?key={key}"
    body = {
        "instances": [{"prompt": prompt}],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": "16:9",
            "safetyFilterLevel": "block_low_and_above",
            "personGeneration": "allow_adult",
        },
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.loads(r.read())

    if "predictions" not in data or not data["predictions"]:
        raise RuntimeError(f"No image returned: {json.dumps(data)[:400]}")

    b64 = data["predictions"][0]["bytesBase64Encoded"]
    raw = base64.b64decode(b64)
    img = Image.open(BytesIO(raw)).convert("RGB")

    # Imagen returns 16:9 close to 1408x768. Resize/center-crop to 1200x630.
    target_w, target_h = 1200, 630
    src_w, src_h = img.size
    src_ratio = src_w / src_h
    tgt_ratio = target_w / target_h
    if src_ratio > tgt_ratio:
        new_h = src_h
        new_w = int(new_h * tgt_ratio)
        x = (src_w - new_w) // 2
        img = img.crop((x, 0, x + new_w, src_h))
    else:
        new_w = src_w
        new_h = int(new_w / tgt_ratio)
        y = (src_h - new_h) // 2
        img = img.crop((0, y, src_w, y + new_h))
    img = img.resize((target_w, target_h), Image.LANCZOS)

    OUT_DIR.mkdir(exist_ok=True)
    out = OUT_DIR / f"{slug}.png"
    img.save(out, "PNG", optimize=True)
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--slug", required=True)
    p.add_argument("--prompt", required=True)
    args = p.parse_args()
    key = os.environ.get("GEMINI_KEY")
    if not key:
        print("ERROR: GEMINI_KEY not set", file=sys.stderr)
        sys.exit(1)
    out = generate(args.prompt, args.slug, key)
    print(f"  -> {out}")


if __name__ == "__main__":
    main()
