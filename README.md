# Kyunghun Nam — Personal Academic Website

Static GitHub Pages website for Kyunghun Nam. The site is implemented in vanilla HTML, CSS, and JavaScript and requires no build step.

## Research narrative

The website now presents one coherent research pipeline:

1. **Exact model structure** — modern decoder-only Transformers with causal masking, Pre-RMSNorm, RoPE, GQA, output projection, SwiGLU, cross-entropy, and residual scaling.
2. **Explicit second-order formulas** — parameter-block Hessians and stochastic-gradient second moments for single samples and mini-batches.
3. **Optimizer transformations** — how AdamW and Shampoo alter blockwise curvature and gradient statistics.
4. **Matrix-function systems** — inverse roots, eigendecompositions, damping, staleness, refresh schedules, polynomial iterations, and GPU utilization.
5. **End-to-end validation** — spectral heterogeneity, stability, wall-clock time, memory, and reproducibility.

A new `notes.html` page contains two edited research perspectives supplied by the author:

- Beyond AdamW: Matrix-Aware Optimization and the Matrix-Function Bottleneck
- ICML 2026 Reflections: Muon and the Return of Diverse Norms

## Technical corrections

- Canonical, Open Graph, sitemap, robots, and manifest paths now match the current GitHub Pages project deployment: `https://namkyunghun.github.io/kyunghunnam.github.io/`.
- GitHub links now point to `https://github.com/namkyunghun` and the repository link is `https://github.com/namkyunghun/kyunghunnam.github.io`.
- Social previews use a 1200×630 PNG, with SVG retained as the editable source.
- The mobile menu, publication list, and core content remain usable when JavaScript is disabled.
- Reveal and counter animations have `IntersectionObserver` fallbacks.
- Theme listeners support older browser APIs, clipboard copy has a fallback, and mobile navigation traps focus while open.
- The 404 page is marked `noindex`.
- Internal navigation now includes Research Notes and keyboard shortcut `G` then `N`.

## Files

```text
index.html
research.html
publications.html
notes.html
contact.html
404.html
styles.css
common.js
robots.txt
sitemap.xml
site.webmanifest
.nojekyll
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
```

## Deployment

Copy all files in this directory to the root of the `main` branch of:

```text
https://github.com/namkyunghun/kyunghunnam.github.io
```

GitHub Pages should serve the site from the repository root. No package installation or build command is required.

## Local preview

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`.

## Updating the deployment URL

The current canonical base is:

```text
https://namkyunghun.github.io/kyunghunnam.github.io/
```

If the site moves to a user-domain repository or custom domain, update the absolute URLs in the HTML metadata, `robots.txt`, `sitemap.xml`, and the JSON-LD blocks.

## Recommended manual additions

- Add a current CV PDF and link it from the homepage and contact page.
- Add ORCID, DBLP, Semantic Scholar, and OpenReview identifiers when available.
- Replace or supplement the text-only brand with a professional portrait if desired.
