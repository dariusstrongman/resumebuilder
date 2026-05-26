#!/usr/bin/env python3
"""Generate photographic blog thumbnails for every post via Imagen 4.

Each slug maps to a hand-tuned prompt. Editorial / Bloomberg-style
realism, cinematic lighting, no faces, no readable text. Overwrites
existing thumbnails.

Usage:
    GEMINI_KEY=... python batch_blog_photos.py
    GEMINI_KEY=... python batch_blog_photos.py --only ai-skills-on-resume
"""

import argparse
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from generate_blog_photo import generate

# Shared style suffix appended to every prompt for visual consistency.
STYLE = (
    " Editorial photography, cinematic lighting, shallow depth of field, "
    "warm but professional color grading, like a Bloomberg or Wired feature. "
    "No people's faces visible. No readable text. Photo-realistic, high detail."
)

PROMPTS = {
    "ai-skills-on-resume": (
        "Overhead view of a modern wooden desk. A sleek open laptop with a "
        "softly glowing blue-purple abstract pattern on the screen, suggesting "
        "AI. Beside it, a printed resume, an espresso cup, eyeglasses, a "
        "ballpoint pen. Soft window light from the left."
    ),
    "ats-rejected-but-qualified": (
        "Close-up of a laptop screen showing a generic email interface, "
        "blurred. The mood is muted and slightly somber. Dark wood desk, a "
        "half-empty coffee cup, a notebook with closed pen. Cold blue tones "
        "from the screen contrast with warm desk light. Atmospheric."
    ),
    "action-verbs-for-resume": (
        "Top-down view of a printed resume on a clean desk. A yellow "
        "highlighter and a black pen rest beside it. A few lines on the "
        "resume have been gently highlighted in yellow. Wood grain visible. "
        "Bright natural daylight."
    ),
    "biggest-resume-mistakes": (
        "Top-down close-up of a printed document on a desk. A red ballpoint "
        "pen rests on the page, having drawn small editor's marks in red ink "
        "along the margins. Reading glasses sit nearby. Cinematic morning light."
    ),
    "how-ats-systems-work": (
        "A row of modern server racks in a clean data center, photographed "
        "at low angle with subtle blue and white indicator lights. Shallow "
        "depth of field, the foreground rack sharp, the back of the room "
        "fading to dark. Cinematic, atmospheric."
    ),
    "how-often-should-you-update-resume": (
        "Top-down view of a paper desk calendar with a small red circle "
        "around one date. Beside it: a fountain pen, a folded pair of "
        "tortoise-shell eyeglasses, and the corner of a printed resume "
        "document. Warm afternoon light."
    ),
    "how-to-pass-ats-screening": (
        "A sleek modern flatbed document scanner on a clean workspace, with "
        "a single sheet of paper resting on the glass. A thin blue scan-line "
        "of light is visible across the page. Minimal, futuristic, clean."
    ),
    "how-to-write-professional-summary": (
        "Close-up of hands typing on a slim modern laptop keyboard, only "
        "fingers and forearms visible. Cuff of a charcoal sweater visible. "
        "A blurred window of soft afternoon light in the background. Plants "
        "softly out of focus. Calm, focused mood."
    ),
    "is-my-resume-ats-friendly": (
        "Overhead view of a tablet on a clean desk showing a document with "
        "small green checkmarks softly visible. A stylus rests beside the "
        "tablet. A small succulent and a cup of black coffee in the frame. "
        "Bright modern daylight."
    ),
    "one-page-vs-two-page-resume": (
        "Top-down view of two printed pages laid side-by-side on a clean "
        "wooden desk. One page on the left, two pages stacked slightly "
        "overlapping on the right. A pen rests between them. Soft, even "
        "studio-style daylight from above."
    ),
    "resume-design-tips": (
        "A designer's workspace photographed at an angle. Sheets of paper "
        "with rough layout sketches, a metal ruler, pencils, a roll of "
        "drafting tape, and a closed MacBook. Soft northern light from a "
        "studio window."
    ),
    "resume-for-career-change": (
        "A symbolic photograph of a forked walking path through a quiet "
        "park at golden hour. Two paths diverge among trees. Warm low-angle "
        "sun. No people. Cinematic, contemplative, hopeful."
    ),
    "resume-for-remote-jobs": (
        "A cozy modern home office: a slim laptop open on a wooden desk, a "
        "ceramic mug, a small green plant, a window with soft morning light, "
        "natural materials. Inviting, lived-in but tidy."
    ),
    "resume-gaps-how-to-explain": (
        "Top-down view of a paper monthly planner on a desk. Several "
        "consecutive weeks are blank while others are filled with handwritten "
        "notes. A fountain pen rests across the binding. Honest, warm, soft "
        "afternoon light."
    ),
    "resume-keywords-that-get-interviews": (
        "Top-down close-up of a magnifying glass resting on a printed page. "
        "The print under the glass is slightly enlarged but not readable. "
        "Wood grain desk beneath. Warm side light casts a soft shadow."
    ),
    "resume-with-no-experience": (
        "A bright clean desk by a window with a slim laptop closed at center, "
        "an unopened notebook, a sharpened pencil, and a small potted plant. "
        "Cup of tea. Fresh, optimistic morning light. A backpack hangs softly "
        "out of focus in the background."
    ),
    "should-i-include-gpa-on-resume": (
        "A graduation cap with a navy tassel resting on a wooden desk beside "
        "a rolled diploma tied with a maroon ribbon. A printed page peeks "
        "out from below. Warm golden hour window light."
    ),
    "what-recruiters-look-for-in-resume": (
        "Hands holding a small stack of printed documents over a clean desk, "
        "fingertips and rolled-up shirt cuffs visible but no face. A sharp "
        "overhead light source casts a soft shadow on the desk. Other "
        "documents fan out below. Editorial, decisive mood."
    ),
    "why-tailoring-your-resume-matters": (
        "A pair of small sharp tailor's scissors resting on a freshly printed "
        "document on a clean desk. A measuring tape coils softly beside them. "
        "A pen and a notebook in the frame. Soft window light from the side. "
        "Tactile, craft-oriented mood."
    ),
}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--only", default=None, help="Generate just one slug")
    p.add_argument("--delay", type=float, default=2.0, help="Seconds between calls")
    args = p.parse_args()

    key = os.environ.get("GEMINI_KEY")
    if not key:
        print("ERROR: GEMINI_KEY not set", file=sys.stderr)
        sys.exit(1)

    items = [(s, PROMPTS[s]) for s in (PROMPTS if not args.only else [args.only])]
    print(f"Generating {len(items)} thumbnails...")
    success, fail = 0, 0
    for slug, prompt in items:
        full = prompt + STYLE
        try:
            out = generate(full, slug, key)
            print(f"  OK  {slug} -> {out}")
            success += 1
        except Exception as e:
            print(f"  FAIL {slug}: {e}")
            fail += 1
        time.sleep(args.delay)
    print(f"\nDone. Success: {success} | Fail: {fail}")


if __name__ == "__main__":
    main()
