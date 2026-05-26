#!/usr/bin/env bash
# Package the extension into a Chrome Web Store-ready .zip.
# Reads version from manifest.json so the filename matches.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_DIR="$REPO_ROOT/extension-build"
mkdir -p "$OUT_DIR"

VERSION="$(grep -m1 '"version"' "$SCRIPT_DIR/manifest.json" | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/')"
if [ -z "$VERSION" ]; then
    echo "ERROR: could not read version from manifest.json" >&2
    exit 1
fi

ZIP_PATH="$OUT_DIR/atshack-extension-v${VERSION}.zip"
rm -f "$ZIP_PATH"

cd "$SCRIPT_DIR"
zip -r "$ZIP_PATH" . \
    -x "build.sh" \
    -x "README.md" \
    -x ".DS_Store" \
    -x "*/.DS_Store" \
    -x "*.zip"

echo
echo "Built: $ZIP_PATH"
du -h "$ZIP_PATH" | awk '{print "Size:  " $1}'
echo
echo "Upload at: https://chrome.google.com/webstore/devconsole"
