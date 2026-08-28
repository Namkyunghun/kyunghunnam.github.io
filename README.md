# Kyunghun Nam — Matrix-Aware Optimization

A single-page academic website centered on the theory and design of matrix-aware optimizers. The site is implemented with vanilla HTML, CSS, and JavaScript and has no build step.

## Research positioning

The homepage presents one research program:

1. **Understand the operator** — characterize the geometry, convergence, stability, and spectral behavior of methods such as Shampoo, SOAP, and Muon.
2. **Quantify the error** — study staleness, damping, eigenspace drift, matrix-function approximation, scaling, and finite precision.
3. **Design better optimizers** — convert theoretical and numerical findings into adaptive, efficient, and reliable update rules.

FOAM (ICML 2026) is the only featured publication. It is presented as the first concrete example of this theory → error → design methodology.

## Information architecture

`index.html` contains four public sections:

- `#research` — research thesis and optimizer operator map
- `#foam` — FOAM paper, contributions, links, and BibTeX
- `#questions` — durable research questions
- `#about` — short biography, affiliation, contact, and profiles

Legacy URLs remain as small `noindex` redirect pages so previously shared links continue to work:

- `research.html` → `index.html#research`
- `publications.html` → `index.html#foam`
- `notes.html` → `index.html#questions`
- `contact.html` → `index.html#about`

## Files

```text
index.html
research.html          # legacy redirect
publications.html      # legacy redirect
notes.html             # legacy redirect
contact.html           # legacy redirect
404.html
styles.css
common.js
robots.txt
sitemap.xml
site.webmanifest
README.md
AUDIT.md
assets/
  favicon.svg
  favicon-192.png
  favicon-512.png
  apple-touch-icon.png
  og-card.svg
  og-card.png
  papers/
    FOAM_ICML2026.pdf
tests/
  test_site.py
```

## Local validation

Run the full static-site regression suite:

```bash
python tests/test_site.py
node --check common.js
```

Preview locally:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`.

## Deployment

Copy the deployable files to the root of the `main` branch of:

```text
https://github.com/namkyunghun/kyunghunnam.github.io
```

The canonical base remains:

```text
https://namkyunghun.github.io/kyunghunnam.github.io/
```

This project-path URL is retained deliberately. If the repository is renamed to `namkyunghun.github.io` or a custom domain is configured, update all absolute URLs in `index.html`, `404.html`, `robots.txt`, `sitemap.xml`, and JSON-LD.

## Content updates

- Replace `assets/papers/FOAM_ICML2026.pdf` when an official camera-ready PDF changes.
- Update FOAM metadata and BibTeX if final PMLR page numbers become available.
- Add a CV link only after a current CV file is supplied.
