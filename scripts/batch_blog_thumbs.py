#!/usr/bin/env python3
"""Generate thumbnails for every blog post and wire og:image meta tags.

Idempotent: skips thumbnails that already exist (unless --force), and
replaces existing og:image / twitter:image tags so re-runs don't dupe.

Usage:
    python batch_blog_thumbs.py            # all posts under blog/
    python batch_blog_thumbs.py --force    # regen even if thumb exists
    python batch_blog_thumbs.py --dry-run  # report what would change
"""

import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from generate_blog_thumb import make_thumbnail

ROOT = Path(__file__).resolve().parent.parent
BLOG_DIR = ROOT / "blog"
THUMBS_DIR = ROOT / "blog-thumbs"
BASE_URL = "https://www.atshack.com"

TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.I | re.S)
HEAD_END_RE = re.compile(r"</head>", re.I)
OG_IMAGE_RE = re.compile(r'<meta\s+property=["\']og:image["\'][^>]*>\s*\n?', re.I)
TW_IMAGE_RE = re.compile(r'<meta\s+name=["\']twitter:image["\'][^>]*>\s*\n?', re.I)


def clean_title(raw):
    """Strip " | ATSHack" suffix and any leading/trailing whitespace."""
    t = re.sub(r"\s*\|\s*ATSHack.*$", "", raw, flags=re.I).strip()
    t = re.sub(r"\s+", " ", t)
    return t


def upsert_meta(html, og_url):
    """Insert/replace og:image + twitter:image tags before </head>."""
    new_og = f'    <meta property="og:image" content="{og_url}">\n'
    new_tw = f'    <meta name="twitter:image" content="{og_url}">\n'

    # Strip existing tags (so re-runs replace, don't duplicate)
    html = OG_IMAGE_RE.sub("", html)
    html = TW_IMAGE_RE.sub("", html)

    inject = new_og + new_tw
    return HEAD_END_RE.sub(inject + "</head>", html, count=1)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--force", action="store_true", help="Regenerate existing thumbs")
    p.add_argument("--dry-run", action="store_true", help="Report changes only")
    args = p.parse_args()

    THUMBS_DIR.mkdir(exist_ok=True)
    if not BLOG_DIR.exists():
        print(f"ERROR: {BLOG_DIR} not found", file=sys.stderr)
        sys.exit(1)

    posts = sorted([p for p in BLOG_DIR.glob("*.html") if p.name != "index.html"])
    if not posts:
        print("No blog posts found.")
        return

    print(f"Found {len(posts)} blog posts.")
    generated, updated, skipped = 0, 0, 0

    for post in posts:
        slug = post.stem
        thumb_path = THUMBS_DIR / f"{slug}.png"

        html = post.read_text(encoding="utf-8")
        m = TITLE_RE.search(html)
        if not m:
            print(f"  SKIP {slug}: no <title>")
            skipped += 1
            continue

        title = clean_title(m.group(1))
        if not title:
            print(f"  SKIP {slug}: empty title")
            skipped += 1
            continue

        # Generate thumbnail
        if thumb_path.exists() and not args.force:
            print(f"  exists  {slug}")
        else:
            if args.dry_run:
                print(f"  WOULD GEN {slug}: {title[:60]}")
            else:
                make_thumbnail(slug, title)
                print(f"  gen     {slug}: {title[:60]}")
                generated += 1

        # Wire og:image
        og_url = f"{BASE_URL}/blog-thumbs/{slug}.png"
        new_html = upsert_meta(html, og_url)
        if new_html != html:
            if args.dry_run:
                print(f"    WOULD WIRE og:image -> {og_url}")
            else:
                post.write_text(new_html, encoding="utf-8")
                updated += 1

    print(f"\nGenerated: {generated} | HTML updated: {updated} | Skipped: {skipped}")


if __name__ == "__main__":
    main()
