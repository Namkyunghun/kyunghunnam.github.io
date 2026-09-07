"""Local HTTP routing, URL migration and release packaging tests."""
from __future__ import annotations
import importlib
import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
import urllib.error
import urllib.request
from urllib.parse import urlsplit, urljoin
import zipfile

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))

class ToolTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.root=Path(self.temp.name)/'site'
        shutil.copytree(ROOT,self.root,ignore=shutil.ignore_patterns('__pycache__','dist','.git'))
    def tearDown(self): self.temp.cleanup()

    def test_url_change_synchronizes_and_passes_checks(self):
        tool=importlib.import_module('set_site_url')
        tool.update_site_url(self.root,'https://example.org/lab/')
        self.assertEqual(tool.check_site_url(self.root),[])
        self.assertIn('href="/lab/styles.css"',(self.root/'404.html').read_text())
        self.assertNotIn('https://namkyunghun.github.io/kyunghunnam.github.io/',(self.root/'index.html').read_text())
        self.assertIn('https://github.com/namkyunghun',(self.root/'index.html').read_text())

    def test_root_domain_migration_uses_root_base(self):
        tool=importlib.import_module('set_site_url')
        tool.update_site_url(self.root,'https://example.org')
        self.assertEqual(tool.check_site_url(self.root),[])
        self.assertIn('href="/styles.css"',(self.root/'404.html').read_text())

    def test_invalid_url_cannot_modify_files(self):
        tool=importlib.import_module('set_site_url')
        original=(self.root/'index.html').read_bytes()
        for url in ('javascript:alert(1)','https://user:password@example.org/',
                    'https://example.org/?q=a','https://example.org/../private/','https://example.org/#here'):
            with self.subTest(url=url),self.assertRaises(ValueError):
                tool.update_site_url(self.root,url)
        self.assertEqual((self.root/'index.html').read_bytes(),original)

    def test_configuration_checker_detects_mismatch(self):
        tool=importlib.import_module('set_site_url')
        p=self.root/'robots.txt';p.write_text('User-agent: *\nAllow: /\n')
        self.assertTrue(tool.check_site_url(self.root))

    def test_publish_zip_has_no_source_or_private_material(self):
        tool=importlib.import_module('package_site')
        (self.root/'.env').write_text('DO_NOT_PUBLISH=secret')
        output=Path(self.temp.name)/'publish.zip'
        tool.package_site(self.root,output)
        with zipfile.ZipFile(output) as z:
            names=z.namelist()
            self.assertIn('index.html',names)
            self.assertIn('.nojekyll',names)
            self.assertIn('assets/papers/FOAM_ICML2026.pdf',names)
            for forbidden in ('README.md','site.config.json','.env','tests/test_site.py','tools/serve.py'):
                self.assertNotIn(forbidden,names)

class HTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from serve import start_server
        from site_utils import public_files,configured_url
        cls.server,cls.thread=start_server(ROOT,port=0)
        cls.base=f'http://127.0.0.1:{cls.server.server_port}'
        cls.prefix=urlsplit(configured_url(ROOT)).path
        cls.files=public_files(ROOT)
    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown();cls.server.server_close();cls.thread.join(timeout=2)
    def request(self,path,method='GET'):
        try:
            response=urllib.request.urlopen(urllib.request.Request(self.base+path,method=method),timeout=5)
        except urllib.error.HTTPError as err:
            response=err
        with response: return response.status,dict(response.headers),response.read()

    def test_every_public_asset_at_root_and_project_prefix(self):
        for prefix in ('/',self.prefix):
            for path in self.files:
                with self.subTest(path=prefix+path):
                    status,headers,body=self.request(prefix+path)
                    self.assertEqual(status,200)
                    self.assertEqual(body,(ROOT/path).read_bytes())
                    self.assertEqual(headers['X-Content-Type-Options'],'nosniff')

    def test_nested_unknown_route_is_real_404(self):
        for prefix in ('/',self.prefix):
            status,headers,body=self.request(prefix+'a/missing/page')
            self.assertEqual(status,404)
            text=body.decode()
            self.assertIn('noindex,follow',text)
            self.assertIn(f'href="{prefix}styles.css"',text)
            self.assertIn('text/html',headers['Content-Type'])

    def test_head_has_no_body_and_correct_length(self):
        status,headers,body=self.request(self.prefix+'styles.css',method='HEAD')
        self.assertEqual(status,200)
        self.assertEqual(body,b'')
        self.assertEqual(int(headers['Content-Length']),(ROOT/'styles.css').stat().st_size)

    def test_private_and_traversal_routes_are_not_served(self):
        for path in ('/.env','/README.md','/tests/test_site.py','/tools/serve.py','/%2e%2e/README.md'):
            with self.subTest(path=path): self.assertEqual(self.request(path)[0],404)

    def test_download_content_types(self):
        for path,mime in (('assets/papers/FOAM_ICML2026.pdf','application/pdf'),
                          ('assets/papers/foam.bib','application/x-bibtex'),
                          ('site.webmanifest','application/manifest+json')):
            self.assertIn(mime,self.request('/'+path)[1]['Content-Type'])

if __name__=='__main__':unittest.main(verbosity=2)
