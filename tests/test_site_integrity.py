"""Structural, privacy, citation and deployment integrity checks (stdlib only)."""
from __future__ import annotations
import hashlib
import json
import re
import unittest
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, urljoin

ROOT = Path(__file__).resolve().parents[1]

class Inventory(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.tags=[]
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

class IntegrityTests(unittest.TestCase):
    def test_main_contains_heading_and_sections_are_named(self):
        text=(ROOT/'index.html').read_text()
        self.assertLess(text.index('<main'), text.index('<h1'))
        doc=Inventory(text)
        sections=[a for t,a in doc.tags if t=='section']
        ids={a['id'] for _,a in doc.tags if 'id' in a}
        for section in sections:
            self.assertIn(section.get('aria-labelledby'), ids)

    def test_ids_are_unique_and_aria_targets_exist(self):
        for path in ROOT.glob('*.html'):
            with self.subTest(path=path.name):
                doc=Inventory(path.read_text())
                ids=[a['id'] for _,a in doc.tags if 'id' in a]
                self.assertEqual(len(ids),len(set(ids)))
                for _, attrs in doc.tags:
                    for name in ('aria-controls','aria-labelledby','aria-describedby'):
                        for target in attrs.get(name,'').split():
                            self.assertIn(target, ids)

    def test_no_remote_runtime_dependencies(self):
        for path in ROOT.glob('*.html'):
            for tag,attrs in Inventory(path.read_text()).tags:
                if tag in ('script','img'):
                    self.assertFalse(urlsplit(attrs.get('src','')).netloc)
                if tag=='link' and attrs.get('rel') in ('stylesheet','preconnect','preload'):
                    self.assertFalse(urlsplit(attrs.get('href','')).netloc)

    def test_downloadable_bibtex_matches_visible_citation(self):
        text=(ROOT/'index.html').read_text()
        visible=re.search(r'<pre id="foam-bibtex"[^>]*><code>(.*?)</code></pre>',text,re.S)[1].strip()
        self.assertEqual(visible,(ROOT/'assets/papers/foam.bib').read_text().strip())

    def test_original_pdf_is_byte_for_byte_unchanged(self):
        expected=json.loads((ROOT/'tests/asset-baseline.json').read_text())
        for name,digest in expected.items():
            with self.subTest(asset=name):
                self.assertEqual(hashlib.sha256((ROOT/name).read_bytes()).hexdigest(),digest)

    def test_scripting_controls_start_hidden(self):
        doc=Inventory((ROOT/'index.html').read_text())
        for _,attrs in doc.tags:
            if any(key in attrs for key in ('data-theme-toggle','data-nav-toggle','data-copy-bibtex','data-theme-reset')):
                self.assertIn('hidden',attrs)

    def test_external_links_announce_new_context(self):
        for path in ROOT.glob('*.html'):
            for tag,attrs in Inventory(path.read_text()).tags:
                if tag=='a' and attrs.get('target')=='_blank':
                    self.assertIn('noopener',attrs.get('rel',''))
                    self.assertIn('noreferrer',attrs.get('rel',''))
                    self.assertEqual(attrs.get('aria-describedby'),'external-link-note')

    def test_404_resources_resolve_from_nested_unknown_path(self):
        base=json.loads((ROOT/'site.config.json').read_text())['url']
        nested=base+'some/missing/page'
        doc=Inventory((ROOT/'404.html').read_text())
        self.assertFalse(any(t=='base' for t,_ in doc.tags))
        for tag,attrs in doc.tags:
            attr='href' if tag in ('a','link') else 'src' if tag=='script' else None
            if attr and attr in attrs and not attrs[attr].startswith('#'):
                self.assertTrue(urljoin(nested,attrs[attr]).startswith(base))

    def test_static_publish_and_preview_tools_exist(self):
        for name in ('serve.py','set_site_url.py','package_site.py'):
            self.assertTrue((ROOT/'tools'/name).is_file(),name)
        self.assertTrue((ROOT/'.nojekyll').is_file())

    def test_scholarly_article_is_part_of_a_publication_volume(self):
        text=(ROOT/'index.html').read_text()
        graph=json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>',text,re.S)[1])['@graph']
        article=next(n for n in graph if n['@type']=='ScholarlyArticle')
        self.assertEqual(article['isPartOf']['@type'],'PublicationVolume')
        self.assertEqual(article['encoding']['encodingFormat'],'application/pdf')

if __name__=='__main__': unittest.main(verbosity=2)
