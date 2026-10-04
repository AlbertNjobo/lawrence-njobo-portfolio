# lawrence-njobo.me

Static portfolio. No build step.

- Preview: `python3 -m http.server 8000`, then open http://localhost:8000
- Check: `node scripts/check-site.mjs`
- Figures: [Hairline](https://hairline.lucasmarkes.com) (stock, via esm.sh) plus custom figures in `assets/figures/`. Every figure slot has a static SVG fallback in `assets/figures/fallback/`.
- Content source of truth: `soul.md` in Lawrence's Personal Documents. Do not add figures or claims that are not recorded there.
