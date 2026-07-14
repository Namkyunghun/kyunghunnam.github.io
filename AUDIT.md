# Website Audit and Revision Report

## Executive assessment

The original source was visually polished and already included responsive layouts, dark mode, publication filtering, structured publication metadata, and accessible labels. The principal weaknesses were not basic styling; they were deployment correctness, progressive enhancement, research positioning, and maintainability.

## Findings and resolutions

| Severity | Finding | Resolution |
|---|---|---|
| High | Canonical URLs, Open Graph URLs, `robots.txt`, sitemap, and manifest `start_url` targeted a non-existent root domain rather than the live GitHub Pages project path. | Repointed all deployment metadata to the current project URL and made manifest paths relative. |
| High | GitHub links pointed to a non-existent `kyunghunnam` profile. | Replaced with the verified `namkyunghun` profile. |
| High | On mobile, the navigation was inaccessible without JavaScript because the menu was hidden behind a nonfunctional toggle. | Made the full menu visible by default and applied the collapsible overlay only when the `js` class is present. |
| High | All `data-reveal` content was hidden by CSS before JavaScript made it visible. A blocked script or unsupported observer could blank substantial parts of the site. | Limited hidden states to `.js` mode and added observer fallbacks. |
| Medium | The research narrative was broad and included several optimizer/statistical objects that no longer matched the most specific current project. | Reframed the site around explicit Transformer block Hessians and gradient second moments, AdamW/Shampoo preconditioned spectra, and matrix-function computation. |
| Medium | The supplied research post named “FRISM” as a matrix-function paper. The relevant ICML 2026 paper is PRISM; FRISM is an unrelated model-merging paper. | Used the verified name PRISM and linked the correct paper. |
| Medium | Social previews used SVG only, which is inconsistently supported by social platforms. | Added a 1200×630 PNG social card and explicit image dimensions/type. |
| Medium | `IntersectionObserver`, `MediaQueryList.addEventListener`, and secure-context clipboard APIs had no compatibility fallbacks. | Added fallbacks for all three. |
| Medium | Publication controls remained visible but nonfunctional without JavaScript. | Hide enhanced controls without JavaScript while keeping the complete publication list visible. |
| Low | The 404 page was indexable and had deployment metadata for the wrong domain. | Added `noindex,follow` and corrected metadata. |
| Low | Repeated header/footer markup makes future expansion error-prone. | Normalized the repeated markup in this revision; for a larger site, migrate to a static-site generator or templating step. |

## Content architecture changes

- Added a dedicated **Research Notes** page.
- Narrowed active research emphasis to **AdamW and Shampoo**.
- Presented Muon as an adjacent field trend rather than an active core project.
- Distinguished completed peer-reviewed work from current research directions.
- Replaced generic optimizer language with a three-part thesis: **geometry, numerical linear algebra, and training dynamics**.
- Added explicit terminology for **preconditioned Hessian** and **preconditioned gradient second moment**.

## Remaining risks and recommendations

1. The site still duplicates navigation and footer HTML across pages. This is acceptable for five static pages, but a templating system becomes preferable as content grows.
2. Google Fonts creates an external dependency. System fonts are already included as fallbacks; self-hosting was intentionally not added.
3. A professional portrait and current CV would improve academic identity and recruiter/collaborator usability.
4. The publication list should be updated when official PMLR paper URLs and page numbers become available.
5. Current research statements describe ongoing work and should be revised as theorem statements, empirical results, and preprints become public.


## Validation performed

- Parsed all six HTML pages and verified a single page title and H1 per document.
- Checked 126 links, 23 unique IDs, every internal file target, and every fragment anchor.
- Parsed all JSON-LD, the web manifest, sitemap XML, and SVG assets.
- Checked JavaScript syntax with Node.js.
- Verified the no-JavaScript navigation, visible-content fallback, reduced-motion path, and publication-list fallback in the stylesheet.
- Served the final directory locally and received HTTP 200 responses for all pages, scripts, styles, metadata files, the social card, and the included paper PDF.
- Generated and visually inspected the 1200×630 PNG social card.

Automated Chromium screenshots could not be completed in this execution environment because the sandbox blocks the browser process. A final manual check in current Chrome, Safari, and a mobile browser remains advisable immediately after deployment.
