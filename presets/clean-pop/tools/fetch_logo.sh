#!/usr/bin/env bash
# Fetch a brand logo SVG from Wikimedia Commons and rasterize it to a transparent PNG (600 px tall).
#   tools/fetch_logo.sh <out_name> "<Commons file name>"      e.g.  tools/fetch_logo.sh vw "Volkswagen_logo_2019.svg"
# Writes logos/<out_name>.svg and logos/<out_name>.png in the current directory.
# Logos are trademarks: fine for identifying the product in your own review video, never as your own branding.
# Commons rate-limits bursts (HTTP 429): the loop below waits and retries. Thumbnails (thumb.wikimedia.org) are not
# needed: the original SVG comes from upload.wikimedia.org and Chromium (Playwright) rasterizes it locally.
# Known-good files (2026-11): Volkswagen_logo_2019.svg, Audi-Logo_2016.svg, BMW.svg, Mercedes-Benz_Logo_2010.svg,
#   Porsche_Wortmarke.svg, Hot_wheels_textlogo.svg
set -euo pipefail
name="$1"; file="$2"; here="$(cd "$(dirname "$0")" && pwd)"
mkdir -p logos
n=0
until [ "$(curl -sS -L -A 'clean-pop-preset/1.0 (personal video edit)' -o "logos/$name.svg" -w '%{http_code}' \
        "https://commons.wikimedia.org/wiki/Special:FilePath/$file")" = 200 ]; do
  n=$((n+1)); [ $n -ge 6 ] && { echo "could not download $file"; exit 1; }; sleep 15
done
(cd logos && node "$here/svg2png.js" "$name")
echo "logos/$name.png"
