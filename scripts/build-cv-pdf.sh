#!/usr/bin/env bash
# Prints cv.html to assets/Lawrence_Njobo_CV.pdf with headless Chrome, so the PDF and the page never disagree.
# Run after any change to cv.html or its print styles: bash scripts/build-cv-pdf.sh
set -euo pipefail
cd "$(dirname "$0")/.."
PORT=8765
python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER' EXIT
sleep 1
CHROME=$(command -v google-chrome || command -v chromium || command -v chromium-browser)
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=4000 \
  --print-to-pdf=assets/Lawrence_Njobo_CV.pdf "http://127.0.0.1:$PORT/cv.html" 2>/dev/null
echo "wrote assets/Lawrence_Njobo_CV.pdf ($(pdfinfo assets/Lawrence_Njobo_CV.pdf 2>/dev/null | awk '/Pages/{print $2}') pages)"
