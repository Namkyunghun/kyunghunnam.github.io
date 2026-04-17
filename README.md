# Personal Website — v2.1 Upgrade

A static personal academic site for Kyunghun Nam, built with vanilla HTML/CSS/JS and designed for GitHub Pages.

## What's new in v2.1

### Bug fixes
- **Missing `sitemap.xml`** — referenced in the previous README and `robots.txt` but not shipped. Now included.
- **Broken nav-toggle animation** — the hamburger → X transition used `nth-of-type(2)`, `(3)`, `(4)` on spans, but the DOM only has three visible spans. Fixed to `nth-of-type(1)`, `(2)`, `(3)`.
- **Asset path mismatch** — HTML referenced `assets/favicon.svg` while the file sat at the root. Files are now correctly placed in `/assets/`.
- **Theme-color meta tag** — was a single hardcoded value. Now uses `media="(prefers-color-scheme: ...)"` for accurate mobile browser chrome in both themes, and JS updates it at runtime when the user toggles themes.

### New features
- **News & Updates** section on the homepage — standard academic site staple covering recent milestones and publications.
- **BibTeX blocks** on each publication, with an inline "Copy" button that uses the clipboard API.
- **Per-article JSON-LD** (`ScholarlyArticle` schema) on publications for better search indexing.
- **Keyboard shortcuts**:
  - `t` — toggle theme
  - `/` — focus the publications search box
  - `Escape` (inside search) — clear query
  - `g` then `h` / `r` / `p` / `c` — navigate pages (home, research, publications, contact)
  - `?` — show a shortcut hint toast
- **Animated pulse** on the "Open to collaborations" status indicator.
- **Gradient accent bar** on publication cards on hover.
- **Underline accent** on author self-mention (`.is-me`).
- **Footer shortcut hint** (`? shortcuts`) that's discoverable but unobtrusive.

### UX polish
- Progress bar now uses `requestAnimationFrame` for smooth updates.
- Toast now has enter and exit animations; role updated to `status`.
- Anchor smooth-scrolling moves focus to the target (better keyboard accessibility).
- Search input gets `autocomplete="off"`, `spellcheck="false"`, leading icon, and trailing `/` hint.
- Filter chips now expose `aria-pressed` state properly.
- Hero title uses a subtle gradient text effect (disabled automatically under `prefers-reduced-motion` and in print).
- Print stylesheet expands link URLs and hides decorative chrome.

### Design
- Slightly deeper dark-mode surfaces for better contrast.
- New `--font-mono` variable for code/BibTeX/news dates.
- New `--danger` token for future use.
- More consistent hover micro-interactions across cards, buttons, and links.
- `.checklist` now uses an actual check glyph inside a pill; `.bullets` keeps the gradient dot.

## Files

```
index.html           — About / home (now with News section + JSON-LD Person schema)
research.html        — Research statement (nested data-reveal issue cleaned up)
publications.html    — Publications with BibTeX + ScholarlyArticle schema
contact.html         — Contact with copy-to-clipboard and animated status pill
styles.css           — Refactored, ~200 lines added for news, BibTeX, accents
common.js            — Refactored with rAF scroll, 2-key shortcuts, BibTeX copy
assets/favicon.svg
assets/og-card.svg
site.webmanifest
robots.txt
sitemap.xml          — NEW
README.md
```

## Deployment

Upload everything to the root of your GitHub Pages repository. No build step required.

```
your-repo/
├── index.html
├── research.html
├── publications.html
├── contact.html
├── styles.css
├── common.js
├── sitemap.xml
├── robots.txt
├── site.webmanifest
└── assets/
    ├── favicon.svg
    └── og-card.svg
```

## Next steps worth considering

- Add a CV PDF (link from homepage hero and contact page).
- Add a real photo for the OG social card (the SVG works for now but a JPG with your photo will look more personal on Twitter/LinkedIn shares).
- Consider an `/atom.xml` feed for the News section if you update it regularly.
- Add a `404.html` with a friendly redirect back to the home page.
- If you start publishing preprints, the CSS now includes a `badge--preprint` class ready to use.
