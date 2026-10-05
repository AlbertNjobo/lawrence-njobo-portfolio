# lawrence-njobo.me

Static portfolio. No build step.

- Preview: `python3 -m http.server 8000`, then open http://localhost:8000
- Before committing: `python3 scripts/stamp-assets.py` (versions CSS/JS links so browsers never mix new HTML with old cached files), then `node scripts/check-site.mjs`
- Figures: [Hairline](https://hairline.lucasmarkes.com) (stock, via esm.sh) plus custom figures in `assets/figures/`. Every figure slot has a static SVG fallback in `assets/figures/fallback/`.
- Content source of truth: `soul.md` in Lawrence's Personal Documents. Do not add figures or claims that are not recorded there.
