# American Sentinel design contract

Approved 2026-10-30. Pages are built against this file. A page that needs a color, size, radius or spacing that isn't here proposes an addition to this file first.

## Direction

An editorial news site in the structure of theguardian.com: strong masthead and nav, a homepage of article cards in sections separated by thin rules, clear headline hierarchy, bylines, and long-form article pages. Structure and typography only; no Guardian logo, name or navy-and-yellow.

The American Sentinel began publishing in 1886, the year the Statue of Liberty was dedicated. The accent is **Liberty patina** (verdigris). Headlines are set in a **Clarendon** slab, the newspaper face of that century.

Principles:

- Content first. Long 19th-century texts must read comfortably for 20+ minutes.
- The one bold element is the masthead. Everything around it stays quiet.
- Article text is historical source material. Never change its wording, spelling or punctuation. Style the stored markup; don't rewrite it.
- Low motion. Nothing animates on load; hover changes color only.
- WCAG AA contrast, visible focus, `prefers-reduced-motion` respected.

Avoid (generic tells): cream backgrounds, ALL-CAPS eyebrow labels, `A · B · C` meta strings, `→` appended to links, monospace labels, numbered markers on content that isn't a sequence, one radius on everything, decorative shadows and gradients.

## Color

Defined in `app/app.css` as OKLCH tokens. Components use only the semantic utilities (`bg-page`, `text-secondary`, …), never raw values. Light is the default for every reader, whatever their device setting. Dark mode is the reader's choice: the "Dark mode" toggle in the masthead sets `<html data-theme="dark">` and a `theme` cookie, which the server reads so the chosen theme renders without a flash. (The admin follows the device setting.)

| Token | Light | Dark | Role |
|---|---|---|---|
| `page` | `#ffffff` | `#13110f` | Page and reading surface |
| `surface` | `#f8f6f5` | `#1b1916` | Panels: footnotes, book details, series rail |
| `hover` | `#f2f0ed` | `#1b1916` | Card and row hover |
| `rule` | `#e2dfdc` | `#35322f` | Thin section and card rules (decorative only) |
| `input` | `#66635e` | `#b4b0ac` | Form field borders (≥ 3:1) |
| `primary` | `#1c1a18` | `#edebe8` | Headlines and body text |
| `secondary` | `#66635e` | `#b4b0ac` | Dates, metadata, captions |
| `accent` | `#0b6056` | `#8ccdbe` | Links, kickers, the one filled button per view |
| `on-accent` | `#ffffff` | `#13110f` | Text on an `accent` fill |
| `accent-tint` | `#e1f5f1` | `#1b1916` | Current item highlight |
| `masthead` | `#083834` | `#042824` | Masthead and nav band |
| `on-masthead` | `#ffffff` | `#edebe8` | Wordmark |
| `on-masthead-muted` | `#e1f5f1` | `#8ccdbe` | Nav links on the masthead |
| `focus` | `#0b6056` | `#70bcab` | Focus outline |
| `focus-on-masthead` | `#8ccdbe` | `#70bcab` | Focus outline inside the masthead |
| `error` | `#b32e2a` | `#f2897e` | Form errors only |

Measured contrast:

| Pair | Light | Dark |
|---|---|---|
| primary on page | 17.32 | 15.77 |
| primary on surface | 16.11 | 14.69 |
| secondary on page | 6.00 | 8.76 |
| secondary on surface | 5.59 | 8.16 |
| secondary on hover | 5.27 | 8.16 |
| accent on page | 7.46 | 10.38 |
| accent on surface | 6.94 | 9.67 |
| accent on accent-tint | 6.60 | 9.67 |
| on-masthead on masthead | 12.87 | 13.22 |
| on-masthead-muted on masthead | 11.38 | 8.70 |
| on-accent on accent | 7.46 | 10.38 |
| error on page | 6.27 | 7.73 |
| focus vs page (3:1) | 7.46 | 8.46 |
| focus-on-masthead vs masthead (3:1) | 7.10 | 7.09 |
| input vs page (3:1) | 6.00 | 8.76 |

## Type

Self-hosted variable woff2 via `@fontsource-variable/*` (`font-display: swap`).

- **Besley** (Clarendon revival): headlines, wordmark. Weights 600–800.
- **Source Serif 4** (optical sizes, true italics): article body, standfirst, block quotes, footnotes.
- **Source Sans 3**: nav, kickers, bylines, metadata, buttons, forms.

| Role | Utility | Font | Phone → ≥ 1024px | Line-height | Weight |
|---|---|---|---|---|---|
| Wordmark | `text-wordmark` | Besley | 2.25 → 3.5rem | 1 | 800 |
| Lead headline | `text-display` | Besley | 2 → 2.75rem | 1.1 | 700, −0.02em |
| Article H1 | `text-headline-1` | Besley | 2 → 2.625rem | 1.1 | 700, −0.015em |
| Section title, lead card, article H2 | `text-headline-2` | Besley | 1.5 → 1.75rem | 1.2 | 600, −0.01em |
| Article H3 | `text-headline-3` | Besley | 1.25rem | 1.3 | 600 |
| Card headline | `text-headline-4` | Besley | 1.125 → 1.25rem | 1.25 | 600 |
| Standfirst | `text-standfirst` | Source Serif | 1.125 → 1.25rem | 1.45 | 500 |
| Body | `text-body` | Source Serif | 1.0625 → 1.125rem | 1.6 | 400 |
| Block quote | `text-quote` | Source Serif | 1 → 1.0625rem | 1.6 | 400 |
| Footnote | `text-footnote` | Source Serif | 0.9375rem | 1.5 | 400 |
| Nav | `text-nav` | Source Sans | 1 → 1.125rem | 1.2 | 700 |
| Kicker | `text-kicker` | Source Sans | 0.9375rem | 1.3 | 700, accent, sentence case |
| Byline | `text-byline` | Source Sans | 0.9375rem | 1.4 | 600 |
| Meta | `text-meta` | Source Sans | 0.875rem | 1.4 | 400; counts `tabular-nums` |
| Caption | `text-caption` | Source Sans | 0.8125rem | 1.4 | 400 |
| Button / label | `text-label` | Source Sans | 1rem | 1.2 | 600 |

- Article body measure: `max-w-[65ch]`.
- Headlines `text-wrap: balance`; paragraphs `text-wrap: pretty`.
- Article parts (styled in `.article-body`, wording untouched):
  - Block quote: 1.5em inset, 3px `rule` border on the start side, `text-quote`.
  - Scripture: styled separately only where stored markup identifies it.
  - Citations such as "(AMS, November 11, 1897)": left as stored, no markup added.
  - Footnotes: Word anchors (`#_ftn1` ↔ `#_ftnref1`) kept; references are superscript links with a 44px tap target; the footnote block sits on `surface`.

## Space, grid, shape

- Spacing steps: 4, 8, 12, 16, 24, 32, 48, 64, 96px (Tailwind `1, 2, 3, 4, 6, 8, 12, 16, 24`).
- Page: `max-w-[1300px]`, gutters 16px / 20px (≥ 640) / 24px (≥ 1024).
- Columns: 4 on phones, 12 from 1024px.
- Radius: 0 on cards, images and sections; 4px (`rounded-control`) on buttons and inputs.
- Rules: 1px `rule` between sections and cards. No shadows.

## Layouts

**Homepage.** Sections stacked, each with a title column (3 of 12) and cards (9 of 12), a 1px rule on top. The first section's lead card spans the widest column with `text-display`. On phones the title sits above its cards in one column.

**Article page.** Kicker, H1, standfirst full width. From 1140px: byline column (left) · body at 65ch · "More in this series" rail (right). Below 1140px the byline sits under the standfirst and the rail moves below the article. Footnotes on `surface` after the body.

**Book page.** Cover (2:3) beside title, author, summary, then actions: "Download PDF" (the filled `accent` button) and "Download audiobook" (outlined), then pages, size and download count (`tabular-nums`). Description below at 65ch.

**Series page.** Title, description, count. A click-to-load YouTube player (thumbnail first, `youtube-nocookie.com` only on click). Presentations in an `<ol>` with part number, 16:9 thumbnail, title, date, duration. Numbering is used here because a series is a sequence.

## Motion

None on load. Hover and focus change color only, `transition-colors` at 150ms, disabled under `prefers-reduced-motion`. No smooth scrolling under reduced motion.
