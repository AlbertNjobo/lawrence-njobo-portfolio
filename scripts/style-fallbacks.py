"""Embed Hairline's stroke rules, resolved to the light palette, into fallback SVGs.

Dark mode inverts them in CSS ([data-theme="dark"] .fig__fallback).

Fallbacks are shown as <img>, which cannot see page CSS. Run after capturing.
Usage: python3 scripts/style-fallbacks.py assets/figures/fallback/*.svg
"""
import re, sys

LIGHT = {"plate": "#f5f5f3", "hi": "#131416", "edge": "#9a9da4", "mid": "#c3c5ca", "lo": "#e1e2e5"}


def rules(P):
    return (
        f"path,polygon,ellipse,line{{fill:{P['plate']};stroke:{P['mid']}}}"
        f".sil{{stroke:{P['edge']}}}.hi{{stroke:{P['hi']}}}.lo{{stroke:{P['lo']}}}"
        f".dot{{fill:{P['hi']}}}.dot.m{{fill:{P['edge']}}}.dot.off{{fill:{P['lo']}}}"
        f".ghost path{{stroke:{P['mid']}}}"
    )


STYLE = (
    "<style>"
    "path,polygon,ellipse,line{stroke-width:0.9;vector-effect:non-scaling-stroke;stroke-linejoin:round;stroke-linecap:round}"
    ".nf{fill:none}.fo{stroke:none}.dash{stroke-dasharray:1 3}.dot{stroke:none}.ghost path{fill:none}"
    + rules(LIGHT)
    + "</style>"
)

for path in sys.argv[1:]:
    svg = open(path).read()
    svg = re.sub(r"<style>.*?</style>", "", svg, flags=re.S)
    svg = re.sub(r"(<svg[^>]*>)", r"\1" + STYLE, svg, count=1)
    open(path, "w").write(svg)
    print("styled", path)
