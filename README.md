# Kyunghun Nam — Matrix-Aware Optimization · v2

A single-page academic website built with plain HTML, CSS, and JavaScript. **No production dependencies, package manager, or build step.** Research content stays readable when JavaScript, clipboard permission, or browser storage is unavailable.

한국어 사용 안내: [README.ko.md](README.ko.md). Review, changes, and validation limits: [AUDIT.md](AUDIT.md).

## Start locally

Python 3.10 or later is needed only for the optional development tools:

```bash
python tools/serve.py
```

Open `http://127.0.0.1:8000/`. The configured project path also works. Stop with Ctrl+C. This local-only development server serves only the public-file allowlist and returns a real custom 404 response for unknown paths. It is not a production server. Opening `index.html` directly can preview the content, but is not a routing/clipboard/deployment test.

## What was preserved

The four sections are `#research`, `#foam`, `#questions`, and `#about`. Research positioning, biography, author order, email, profile links, FOAM metadata, the visible citation, and all nine original binary/SVG assets were preserved. No publication, CV, news, or unverified biographical claims were added. Academic metadata was carried forward from the uploaded source, not independently certified.

Legacy URLs still redirect: `research.html` → `#research`, `publications.html` → `#foam`, `notes.html` → `#questions`, and `contact.html` → `#about`.

## Deploy

The configured canonical base was retained from the uploaded source, **not inferred from the archive name**:

```text
https://namkyunghun.github.io/kyunghunnam.github.io/
```

Create a publish-only archive:

```bash
python tools/set_site_url.py --check
python tools/package_site.py
```

The result is `dist/site-publish.zip`. Extract its **contents** into the root of the publishing branch; `index.html` and `.nojekyll` must be at that root, not inside another folder. For GitHub Pages branch publishing, select the intended branch and `/(root)` in **Settings → Pages → Build and deployment → Deploy from a branch**. Preserve an existing custom-domain `CNAME` file when applicable. Do not replace unrelated repository files blindly.

The publish archive contains 22 public files. It excludes tests, tools, audit reports, configuration sources, and development dependencies. By contrast, the full-source archive contains everything needed to maintain and validate the website. Publishing the entire source tree from a branch may expose development documents as static files; use the publish-only archive when that is undesirable.

The supplied `.github/workflows/validate.yml` is **validation only**. It does not publish, change Pages settings, or gate a separate branch-based deployment automatically. No remote workflow or live deployment was executed while preparing this release.

GitHub Pages reference: `https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site`

## Change the hostname or repository path

Use the update command, not a manual edit to `site.config.json` alone:

```bash
python tools/set_site_url.py --url https://namkyunghun.github.io/
python tools/set_site_url.py --check
```

Or pass the actual HTTPS custom-domain base. The script synchronizes canonical/OG/Twitter/JSON-LD URLs, legacy canonical links, robots, sitemap, and nested-404 resource/home paths. The site remains ready to serve without a runtime config loader. Review the diff before deployment. This script does **not** configure DNS, repository names, Pages settings, HTTPS, or `CNAME` for you.

## Validate

Static structure, original assets, URL migration, HTTP responses, and packaging (Python standard library only):

```bash
python -m unittest discover -s tests -p 'test_site*.py' -v
python tools/set_site_url.py --check
node --check common.js
```

The original focused suite remains available: `python tests/test_site.py`. Node is needed only for the optional JavaScript syntax check, not for serving the site.

Browser tests (development only):

```bash
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
python tests/test_browser.py
```

The default browser mode starts a local HTTP server and navigates Chromium to it. On Linux, `python -m playwright install --with-deps chromium` can install required system libraries; CI uses that form. In an administrator-managed browser that blocks navigation, the restricted alternative is:

```bash
SITE_BROWSER_MODE=memory CHROMIUM_EXECUTABLE=/usr/bin/chromium python tests/test_browser.py
```

That last command is POSIX-shell syntax. In PowerShell, use `$env:SITE_BROWSER_MODE="memory"` and set `CHROMIUM_EXECUTABLE` only to an existing local Chromium executable; then run the Python command. Memory mode renders the real HTML/CSS/JS in an in-memory document. It is **not** real browser HTTP end-to-end validation. This release was validated in that restricted mode, with actual HTTP delivery tested separately. See `AUDIT.md` and `docs/validation/` for results and limits.

## Editing guide

| File | Responsibility |
| --- | --- |
| `index.html` | Research text, biography, links, metadata, native BibTeX disclosure |
| `styles.css` | Responsive design, light/dark, focus, reduced-motion, print styles |
| `common.js` | Theme, non-modal mobile navigation, active sections, copy fallback |
| `assets/papers/FOAM_ICML2026.pdf` | Original paper, byte-for-byte preserved |
| `assets/papers/foam.bib` | Downloadable version of the visible BibTeX citation |
| `site.config.json` | Canonical base snapshot; update through `tools/set_site_url.py` |
| `tools/site_utils.py` | Explicit allowlist of publishable files |
| `tools/serve.py` | Local preview with project-prefix and 404 handling |
| `tools/package_site.py` | Publish-only ZIP creator |
| `tests/` | Static, HTTP, integrity, and browser regressions |
| `.github/workflows/validate.yml` | Read-only CI checks; no deployment |

When adding a publication, update both visible content and JSON-LD. Keep the visible BibTeX and `.bib` download identical. Add every new public asset to the explicit allowlist. When intentionally replacing an original asset, review the replacement and update its expected SHA-256 in `tests/asset-baseline.json`; do not bypass a failing integrity test silently. The original content assertions in `tests/test_site.py` should change only alongside an intentional content decision.

There is no analytics, tracking, contact backend, service worker, external font download, or framework dependency in the shipped website. No license was invented for the supplied personal content or paper; redistribution permissions remain the owner's responsibility.
