# Design

The site follows the layout of the Staks Framer template (licensed), rebuilt in static HTML and CSS. Every token lives at the top of `css/style.css`.

## World

- Ink on a white page that lifts off a dark contact footer: `.sheet` has rounded bottom corners over the `--foot` background.
- One grid everywhere: a page gutter of 20, 40 or 80px, then a 320px label column (`--label-col`) and the content column. Mono labels with a 60px rule (`.label`, `.eyebrow`, `.creds__group`, `.cv__section h2`) sit in the label column and act as section headings.
- Statements at 31px (`--fs-statement`) open sections. Everything else is list rows divided by hairlines (`.rows`, `.timeline`, `.creds`, `.facts`, `.post`).
- Light by default. Dark only through the nav toggle, remembered in localStorage.

## Type

- Outfit 400, 500 and 700 for everything readable. IBM Plex Mono 500 for labels, dates, tags and the Sentinel panel only. Both are self-hosted in `assets/fonts/`.
- Display at 61px (`--fs-display`, line-height 1.1), statement at 31px (1.4), large body at 20px, body at 16px.

## Colour

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--page` | #ffffff | #16181b | the sheet |
| `--panel` | #f5f5f5 | #1d2024 | the Expertise panel, case-study image stages |
| `--ink` | #121416 | #eef0f2 | text, buttons |
| `--ink-soft` / `--ink-mute` | #45484c / #5f6368 | #bcc0c5 / #9aa0a7 | secondary text, dates |
| `--foot` | #121416 | #070809 | footer |

The discipline tags are cyan `#30e0ff`, yellow `#f9ff44` and amber `#ffce47`. Lime `#a0ff44` is for the hero highlight, the footer call to action and text selection. All of these always carry ink text. Work tiles sit on soft tints (`.tint-*`) of the same hues.

## Signature moves

- **The name:** the hero's `h1` is "Lawrence Njobo" at up to 128px (`.hero__name`), held in a Figma-blue selection frame (`.frame`, `--select` #0d99ff), the way Kush Bothra frames his own name. The positioning sentence follows at up to 44px, with "learn differently" under the lime highlighter (`.sel`). The same name closes every footer as a full-width wordmark (`.footer__mark`, sized at 15cqi), which unrolls upwards when reached.
- **Selection handles** also appear round a project tile on hover or focus.
- **Sticker:** one tilted yellow sticker in the hero, borrowed from the same site. Keep it to one.
- **Opening motion:** the headline rises in, the highlighter sweeps across, then the frame and sticker land.
- **Scroll:** section heads rise 80px and fade in, as on Staks (`.reveal`). Children of a `[data-stagger]` group cascade 80ms apart, at most six steps. Project images unroll from their bottom edge (`data-stagger="clip"`) and drift ±28px against the scroll where `animation-timeline: view()` is supported. Content is visible without JavaScript, and reduced motion turns all of it off.
- **Cursor label:** on a mouse, "View case study" follows the pointer over project images (`.work__cursor`).
- **Tools strip:** two rows of mono chips drift in opposite directions. It pauses on hover and wraps statically under reduced motion.

## Components

- `.btn` is ink with a white label and an 8px radius. `.btn--lime` is used in the footer only.
- `.link-quiet` is an underlined text link with a 44px tap target. External links get an arrow from `.ext`, added by `js/site.js`.
- Project screenshots sit at 84% width inside a tinted 4:3 stage, with a soft shadow.
