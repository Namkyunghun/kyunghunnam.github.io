# Personal Website — Preconditioned Optimizer Research Update

A static personal academic website for Kyunghun Nam, designed for GitHub Pages and implemented with vanilla HTML/CSS/JS.

## Main updates

- Unified the research narrative around the question: **“What makes a good optimizer?”**
- Reframed the research agenda around the working hypothesis that **good preconditioners can make good optimizers**.
- Updated the homepage and Research page to emphasize **preconditioned optimization methods** such as AdamW, Shampoo, SOAP, and related optimizer families.
- Added a coherent analysis pipeline: loss-landscape diagnosis → Hessian/Fisher/covariance/Gauss–Newton analysis → preconditioner design → low-cost numerical implementation → optimizer validation.
- Removed the prior workshop-topic material from the homepage, Research page, and Publications page.
- Removed scattered topics such as training-stack layers, PEFT, automation, and generic stability recipes from the main research framing.
- Preserved the ICML 2026 FOAM paper, local PDF link, publication filtering/search behavior, JavaScript behavior, CSS styling, sitemap, and static GitHub Pages deployment model.

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
- Add ORCID, OpenReview, Semantic Scholar, and DBLP links when ready.
- Consider adding a short downloadable research statement once the preconditioner-centered agenda is finalized.
