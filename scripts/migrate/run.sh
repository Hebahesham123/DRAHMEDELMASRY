#!/usr/bin/env bash
# Copies the latest content from the old website (www.doctorahmedelmasry.com)
# into supabase/seed/seed.json and downloads all images into a work folder.
# Then run:  node scripts/import.mjs --images <work>/assets
#
# Usage: bash scripts/migrate/run.sh [work_dir]   (needs python3 + beautifulsoup4)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
WORK="${1:-$ROOT/.migrate}"
mkdir -p "$WORK"
cd "$WORK"
echo "1/3 crawling Arabic and English pages (takes a few minutes)…"
python3 -I "$HERE/crawl.py" 1 crawl_ar > crawl_ar.log 2>&1 &
python3 -I "$HERE/crawl.py" 2 crawl_en > crawl_en.log 2>&1 &
wait
tail -n1 crawl_ar.log crawl_en.log
echo "2/3 downloading images and files…"
python3 -I "$HERE/assets.py" assets crawl_ar/index.json crawl_en/index.json
echo "3/3 extracting content…"
python3 -I "$HERE/extract.py" "$WORK" "$ROOT/supabase/seed/seed.json"
echo
echo "Done. Now load it into Supabase:"
echo "  node scripts/import.mjs --images \"$WORK/assets\""
