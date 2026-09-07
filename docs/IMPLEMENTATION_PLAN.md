# Website v2 implementation plan

## Goal and constraints
Improve the uploaded single-page academic site without adding a runtime framework, a build requirement, tracking, or unsupported biographical/publication claims. Keep all four sections, legacy URLs, author/profile links, and the original FOAM PDF. The canonical URL in the supplied source is authoritative; do not infer it from the ZIP filename.

## Design
Keep the ivory/ink/indigo technical-editorial identity, but reduce oversized headings and background noise. Put all research content inside `main`, keep a compact sticky navigation, make the operator illustration secondary, and improve mobile density. Use local system font stacks rather than downloading fonts. All content and resource links must work without JavaScript. Enhancements must fail open.

## Implementation sequence
1. Add browser regressions for landmarks, sticky navigation, failed JavaScript, keyboard escape/Tab, theme state, denied clipboard, motion preferences, contrast, and print. Run against unchanged source and record failures.
2. Refine `index.html`, `styles.css`, and `common.js`. Add downloadable BibTeX matching the visible citation; retain the native details element.
3. Repair nested 404 resolution and legacy redirects. Add a single URL configuration and an explicit URL-update/check tool; preserve a ready-to-serve static site.
4. Add an HTTP preview server, allowlisted publish packaging, static/HTTP tests, and read-only CI validation. Do not deploy or modify the remote repository.
5. Run static and browser tests, inspect desktop/mobile/dark screenshots, verify original asset hashes, document restrictions, and package source + publish ZIPs.

## Validation environment
The system Chromium has an administrator URLBlocklist that blocks browser navigation, including localhost. Use actual HTML/CSS/JS loaded into an in-memory browser document for visual/interaction tests, and a separate real local HTTP server for routes, MIME types, links and 404 status. Clearly distinguish these from end-to-end live-site testing. Ship a normal HTTP browser mode for execution in CI or an unrestricted local browser.
