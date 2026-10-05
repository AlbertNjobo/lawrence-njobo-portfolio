"""Stamp CSS and JS references with a content hash so browsers never pair new HTML with a cached old asset.

Rewrites /css/style.css, /js/site.js and /assets/figures/*.js references in every page to `?v=<hash>`.
Run before committing: python3 scripts/stamp-assets.py
"""
import hashlib
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = [ROOT / "index.html", ROOT / "credentials.html", *sorted((ROOT / "work").glob("*.html"))]
ASSET = re.compile(r'(?P<path>/(?:css/style\.css|js/site\.js|assets/figures/[\w-]+\.js))(?:\?v=[0-9a-f]+)?(?=")')


def digest(rel):
    return hashlib.sha256((ROOT / rel.lstrip("/")).read_bytes()).hexdigest()[:10]


for page in PAGES:
    html = page.read_text()
    stamped = ASSET.sub(lambda m: f"{m['path']}?v={digest(m['path'])}", html)
    if stamped != html:
        page.write_text(stamped)
        print("stamped", page.relative_to(ROOT))
