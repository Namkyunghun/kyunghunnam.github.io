# Personal Website — ICML 2026 Upgrade

A static personal academic website for Kyunghun Nam, designed for GitHub Pages and implemented with vanilla HTML/CSS/JS.

## Main updates

- Corrected Ph.D. start timing to **September 2025**.
- Added **FOAM: Frequency and Operator Error-Based Adaptive Damping Method for Reducing Staleness-Oriented Error for Shampoo** as an **ICML 2026 accepted paper**.
- Added local PDF at `assets/papers/FOAM_ICML2026.pdf` and linked the official code repository: `https://github.com/REAL-KENTECH/FOAM.git`.
- Updated homepage news, hero highlight, publication counts, publication filtering, BibTeX, and JSON-LD metadata.
- Added a stronger Research page with selected projects, including FOAM, AdaGrad with heavy-ball momentum, SAM, and preconditioner spectral analysis.
- Added `sitemap.xml` and `404.html`.
- Preserved the no-build static deployment model.

## Files

```text
index.html
research.html
publications.html
contact.html
404.html
styles.css
common.js
robots.txt
sitemap.xml
site.webmanifest
README.md
assets/
  favicon.svg
  og-card.svg
  papers/
    FOAM_ICML2026.pdf
```

## Deployment

Upload the full directory contents to the root of your GitHub Pages repository:

```text
your-repo/
├── index.html
├── research.html
├── publications.html
├── contact.html
├── 404.html
├── styles.css
├── common.js
├── robots.txt
├── sitemap.xml
├── site.webmanifest
└── assets/
    ├── favicon.svg
    ├── og-card.svg
    └── papers/
        └── FOAM_ICML2026.pdf
```

No build step is required.

## Recommended next manual additions

- Add an updated CV PDF once available and link it from the hero/contact sections.
- Replace `assets/og-card.svg` with a `1200x630` PNG/JPG social preview image if you want more robust LinkedIn/Twitter previews.
- Add ORCID, OpenReview, Semantic Scholar, and DBLP links when ready.
