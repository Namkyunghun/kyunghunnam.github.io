#!/usr/bin/env python3
"""Regression tests for the deployable static academic website."""

from __future__ import annotations

import json
import re
import struct
import unittest
import xml.etree.ElementTree as ET
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = json.loads((ROOT / "site.config.json").read_text(encoding="utf-8"))["url"]
FOAM_TITLE = (
    "FOAM: Frequency and Operator Error-Based Adaptive Damping Method "
    "for Reducing Staleness-Oriented Error for Shampoo"
)


class ParsedHTML(HTMLParser):
    def __init__(self, source: str) -> None:
        super().__init__(convert_charrefs=True)
        self.source = source
        self.tags: list[tuple[str, dict[str, str]]] = []
        self.text_parts: list[str] = []
        self._capture_stack: list[str] = []
        self.captured: dict[str, list[str]] = {}
        self.json_ld: list[str] = []
        self._script_type: str | None = None
        self._script_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = {key: value or "" for key, value in attrs}
        self.tags.append((tag, attr_map))
        if tag in {"title", "h1", "h2", "h3", "p", "a"}:
            self._capture_stack.append(tag)
            self.captured.setdefault(tag, []).append("")
        if tag == "script":
            self._script_type = attr_map.get("type")
            self._script_parts = []

    def handle_endtag(self, tag: str) -> None:
        if tag == "script":
            if self._script_type == "application/ld+json":
                self.json_ld.append("".join(self._script_parts).strip())
            self._script_type = None
            self._script_parts = []
        if self._capture_stack and self._capture_stack[-1] == tag:
            self._capture_stack.pop()

    def handle_data(self, data: str) -> None:
        if self._script_type is not None:
            self._script_parts.append(data)
        normalized = " ".join(data.split())
        if not normalized:
            return
        self.text_parts.append(normalized)
        if self._capture_stack:
            tag = self._capture_stack[-1]
            self.captured[tag][-1] = (self.captured[tag][-1] + " " + normalized).strip()

    @property
    def text(self) -> str:
        return unescape(" ".join(self.text_parts))

    def attrs(self, tag: str) -> list[dict[str, str]]:
        return [attrs for current, attrs in self.tags if current == tag]

    def attr_values(self, tag: str, name: str) -> list[str]:
        return [attrs[name] for attrs in self.attrs(tag) if name in attrs]

    def meta(self, *, name: str | None = None, property_name: str | None = None) -> str | None:
        for attrs in self.attrs("meta"):
            if name is not None and attrs.get("name") == name:
                return attrs.get("content")
            if property_name is not None and attrs.get("property") == property_name:
                return attrs.get("content")
        return None


def load_html(name: str = "index.html") -> ParsedHTML:
    source = (ROOT / name).read_text(encoding="utf-8")
    parser = ParsedHTML(source)
    parser.feed(source)
    return parser


def png_dimensions(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n" or data[12:16] != b"IHDR":
        raise AssertionError(f"Not a valid PNG: {path}")
    return struct.unpack(">II", data[16:24])


class SiteContentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.doc = load_html()
        cls.source = (ROOT / "index.html").read_text(encoding="utf-8")

    def test_title_description_and_primary_heading_define_research_identity(self) -> None:
        self.assertEqual(self.doc.captured.get("title"), ["Kyunghun Nam | Matrix-Aware Optimization"])
        description = self.doc.meta(name="description") or ""
        self.assertIn("matrix-aware optimizers", description.lower())
        self.assertEqual(
            self.doc.captured.get("h1"),
            ["Theory and Design of Matrix-Aware Optimizers"],
        )
        self.assertIn("matrix-aware optimization", self.doc.text.lower())
        self.assertIn(
            "Understand the operator. Quantify the error. Design better optimizers.",
            self.doc.text,
        )

    def test_navigation_targets_single_page_sections(self) -> None:
        hrefs = self.doc.attr_values("a", "href")
        for target in ("#research", "#foam", "#questions", "#about"):
            self.assertIn(target, hrefs)
        for legacy in ("research.html", "publications.html", "notes.html", "contact.html"):
            self.assertNotIn(legacy, hrefs)
        ids = set(self.doc.attr_values("section", "id")) | set(self.doc.attr_values("main", "id"))
        self.assertTrue({"research", "foam", "questions", "about"}.issubset(ids))

    def test_optimizer_map_distinguishes_shampoo_soap_and_muon(self) -> None:
        for method in ("Shampoo", "SOAP", "Muon"):
            self.assertIn(method, self.doc.text)
        self.assertIn("matrix inverse-root preconditioning", self.doc.text.lower())
        self.assertIn("shampoo eigenbasis", self.doc.text.lower())
        self.assertIn("newton–schulz", self.doc.text.lower())
        optimizer_cards = [
            attrs for attrs in self.doc.attrs("article") if "optimizer-card" in attrs.get("class", "").split()
        ]
        self.assertEqual(len(optimizer_cards), 3)

    def test_foam_is_the_only_publication(self) -> None:
        publications = [attrs for attrs in self.doc.attrs("article") if attrs.get("data-publication")]
        self.assertEqual(publications, [{"class": "foam-paper", "data-publication": "foam"}])
        self.assertIn(FOAM_TITLE, self.doc.text)
        self.assertIn("Kyunghun Nam and Sumyeong Ahn", self.doc.text)
        self.assertIn("ICML 2026", self.doc.text)
        self.assertNotIn("Dimension-Independent Convergence Rate", self.doc.text)
        self.assertNotIn("AdaGrad", self.doc.text)
        self.assertNotIn("peer-reviewed publications listed", self.doc.text)

    def test_foam_links_and_bibtex_are_present(self) -> None:
        hrefs = self.doc.attr_values("a", "href")
        required = {
            "assets/papers/FOAM_ICML2026.pdf",
            "https://arxiv.org/abs/2606.02365",
            "https://openreview.net/forum?id=ZwFJbTzJP9",
            "https://github.com/REAL-KENTECH/FOAM",
        }
        self.assertTrue(required.issubset(set(hrefs)))
        self.assertIn("data-copy-bibtex", self.source)
        self.assertIn("@inproceedings{nam2026foam", self.source)

    def test_json_ld_contains_one_person_and_one_foam_article(self) -> None:
        self.assertEqual(len(self.doc.json_ld), 1)
        payload = json.loads(self.doc.json_ld[0])
        graph = payload.get("@graph", [])
        people = [item for item in graph if item.get("@type") == "Person"]
        articles = [item for item in graph if item.get("@type") == "ScholarlyArticle"]
        self.assertEqual(len(people), 1)
        self.assertEqual(len(articles), 1)
        self.assertEqual(articles[0].get("headline"), FOAM_TITLE)
        knows_about = set(people[0].get("knowsAbout", []))
        self.assertTrue({"Shampoo", "SOAP", "Muon"}.issubset(knows_about))

    def test_internal_fragments_and_files_resolve(self) -> None:
        ids = set()
        for _, attrs in self.doc.tags:
            if attrs.get("id"):
                ids.add(attrs["id"])
        for tag in ("a", "link", "script", "img"):
            attr = "href" if tag in {"a", "link"} else "src"
            for value in self.doc.attr_values(tag, attr):
                if not value or value.startswith(("mailto:", "tel:", "javascript:")):
                    continue
                split = urlsplit(value)
                if split.scheme or split.netloc:
                    continue
                if value.startswith("#"):
                    self.assertIn(value[1:], ids, f"Missing fragment target {value}")
                    continue
                path_text = split.path
                if not path_text:
                    continue
                target = ROOT / path_text
                self.assertTrue(target.exists(), f"Missing internal target: {value}")
                if split.fragment and target.name == "index.html":
                    self.assertIn(split.fragment, ids, f"Missing fragment target {value}")


class SiteBehaviorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.doc = load_html()
        cls.html = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.css = (ROOT / "styles.css").read_text(encoding="utf-8")
        cls.js = (ROOT / "common.js").read_text(encoding="utf-8")

    def test_html_uses_only_minimal_interaction_hooks(self) -> None:
        for hook in ("data-theme-toggle", "data-nav-toggle", "data-nav-panel", "data-copy-bibtex"):
            self.assertIn(hook, self.html)
        for removed in ("progress-bar", "data-counter", "publication-search", "back-to-top", "toast-region"):
            self.assertNotIn(removed, self.html)

    def test_javascript_contains_required_progressive_enhancements(self) -> None:
        for function_name in (
            "initTheme",
            "initNavigation",
            "initReveal",
            "initFooterYear",
            "initBibtexCopy",
        ):
            self.assertRegex(self.js, rf"function\s+{function_name}\s*\(")
        for removed in (
            "initCounters",
            "initPublicationControls",
            "initKeyboardShortcuts",
            "progressBar",
            "backToTop",
            "showToast",
        ):
            self.assertNotIn(removed, self.js)

    def test_stylesheet_has_new_components_and_not_obsolete_dashboard_components(self) -> None:
        for selector in (
            ".optimizer-map",
            ".optimizer-card",
            ".research-step",
            ".foam-layout",
            ".question-card",
            ".about-grid",
        ):
            self.assertIn(selector, self.css)
        for selector in (
            ".progress-bar",
            ".stat-card",
            ".toolbar",
            ".publication-list",
            ".back-to-top",
            ".toast-region",
        ):
            self.assertNotIn(selector, self.css)
        self.assertIn("@media (max-width: 840px)", self.css)
        self.assertIn("@media (prefers-reduced-motion: reduce)", self.css)

    def test_reveal_animation_is_progressive_enhancement(self) -> None:
        self.assertIn(".reveal-ready [data-reveal]", self.css)
        self.assertNotRegex(self.css, r"\.js\s+\[data-reveal\]\s*\{[^}]*opacity\s*:\s*0")
        self.assertIn("reveal-ready", self.js)

    def test_mobile_menu_icon_uses_explicit_top_and_bottom_lines(self) -> None:
        self.assertEqual(self.html.count('class="nav-toggle-line nav-toggle-line--top"'), 1)
        self.assertEqual(self.html.count('class="nav-toggle-line nav-toggle-line--bottom"'), 1)
        self.assertIn('.nav-toggle-line--top', self.css)
        self.assertIn('.nav-toggle-line--bottom', self.css)
        self.assertNotIn(':first-of-type', self.css)
        self.assertNotIn(':last-of-type', self.css)


class SiteMetadataTests(unittest.TestCase):
    def test_legacy_pages_redirect_to_single_page_sections(self) -> None:
        expected = {
            "research.html": "index.html#research",
            "publications.html": "index.html#foam",
            "notes.html": "index.html#questions",
            "contact.html": "index.html#about",
        }
        for filename, target in expected.items():
            with self.subTest(filename=filename):
                doc = load_html(filename)
                source = (ROOT / filename).read_text(encoding="utf-8")
                self.assertEqual(doc.meta(name="robots"), "noindex,follow")
                refresh = next(
                    (
                        attrs.get("content", "")
                        for attrs in doc.attrs("meta")
                        if attrs.get("http-equiv", "").lower() == "refresh"
                    ),
                    "",
                )
                self.assertIn(target, refresh)
                canonical = next(
                    (
                        attrs.get("href", "")
                        for attrs in doc.attrs("link")
                        if attrs.get("rel") == "canonical"
                    ),
                    "",
                )
                self.assertTrue(canonical.endswith(target.replace("index.html", "")))
                self.assertIn(f'href="{target}"', source)
                self.assertIn("location.replace", source)
                self.assertLess(len(source), 3500)

    def test_sitemap_contains_only_the_homepage(self) -> None:
        tree = ET.parse(ROOT / "sitemap.xml")
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        locs = [node.text for node in tree.findall("sm:url/sm:loc", ns)]
        self.assertEqual(locs, [BASE_URL])

    def test_robots_and_manifest_match_current_deployment(self) -> None:
        robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
        self.assertIn(f"Sitemap: {BASE_URL}sitemap.xml", robots)
        manifest = json.loads((ROOT / "site.webmanifest").read_text(encoding="utf-8"))
        self.assertEqual(manifest["name"], "Kyunghun Nam — Matrix-Aware Optimization")
        self.assertIn("matrix-aware optimizers", manifest["description"].lower())
        self.assertEqual(manifest["start_url"], "./")

    def test_404_page_is_noindex_and_returns_to_home(self) -> None:
        doc = load_html("404.html")
        self.assertEqual(doc.meta(name="robots"), "noindex,follow")
        self.assertIn(urlsplit(BASE_URL).path + "index.html", doc.attr_values("a", "href"))
        self.assertIn("Matrix-Aware Optimization", doc.text)

    def test_documentation_describes_single_page_deployment_and_validation(self) -> None:
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        audit = (ROOT / "AUDIT.md").read_text(encoding="utf-8")
        self.assertIn("single-page", readme.lower())
        self.assertIn("python tests/test_site.py", readme)
        self.assertIn("FOAM is the only publication", audit)


class SiteAssetTests(unittest.TestCase):
    def test_social_card_svg_matches_new_positioning(self) -> None:
        svg = (ROOT / "assets/og-card.svg").read_text(encoding="utf-8")
        self.assertRegex(svg, r'<svg[^>]+width="1200"[^>]+height="630"')
        self.assertIn("Matrix-Aware Optimization", svg)
        self.assertIn("Theory", svg)
        self.assertIn("Error", svg)
        self.assertIn("Design", svg)
        self.assertEqual((ROOT / "og-card.svg").read_text(encoding="utf-8"), svg)

    def test_social_card_png_is_1200_by_630(self) -> None:
        self.assertEqual(png_dimensions(ROOT / "assets/og-card.png"), (1200, 630))

    def test_favicon_uses_matrix_mark_and_expected_sizes(self) -> None:
        svg = (ROOT / "assets/favicon.svg").read_text(encoding="utf-8")
        self.assertIn('data-brand="matrix-mark"', svg)
        self.assertEqual((ROOT / "favicon.svg").read_text(encoding="utf-8"), svg)
        self.assertEqual(png_dimensions(ROOT / "assets/favicon-192.png"), (192, 192))
        self.assertEqual(png_dimensions(ROOT / "assets/favicon-512.png"), (512, 512))
        self.assertEqual(png_dimensions(ROOT / "assets/apple-touch-icon.png"), (180, 180))

    def test_local_foam_pdf_is_preserved(self) -> None:
        paper = ROOT / "assets/papers/FOAM_ICML2026.pdf"
        self.assertTrue(paper.exists())
        self.assertGreater(paper.stat().st_size, 1_000_000)


if __name__ == "__main__":
    unittest.main(verbosity=2)
