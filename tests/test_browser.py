"""Browser regressions. Default: real HTTP; SITE_BROWSER_MODE=memory: in-memory DOM.

Memory mode is for managed browsers which block all URL navigation. It injects
unchanged site HTML, CSS and JavaScript, not a screenshot or a reconstructed UI.
Storage/clipboard denial tests simulate the browser APIs intentionally.
"""
from __future__ import annotations
import os
import re
import sys
import unittest
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
MODE = os.environ.get("SITE_BROWSER_MODE", "http")

class BrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        kwargs = {"headless": True}
        if os.environ.get("CHROMIUM_EXECUTABLE"):
            kwargs["executable_path"] = os.environ["CHROMIUM_EXECUTABLE"]
        cls.browser = cls.playwright.chromium.launch(**kwargs)
        if MODE == "http":
            sys.path.insert(0, str(ROOT / "tools"))
            from serve import start_server
            cls.server, cls.thread = start_server(ROOT, port=0)
            cls.url = f"http://127.0.0.1:{cls.server.server_port}/"

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, "server"):
            cls.server.shutdown()
            cls.server.server_close()
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.context = self.browser.new_context(viewport={"width": 1440, "height": 1000}, reduced_motion="reduce")
        self.page = self.context.new_page()
        self.errors = []
        self.page.on("pageerror", lambda err: self.errors.append(str(err)))

    def tearDown(self):
        self.context.close()

    def load(self, *, script=True, before="", filename="index.html"):
        if MODE == "memory":
            html = (ROOT / filename).read_text(encoding="utf-8")
            html = re.sub(r'<link\b[^>]*(?:rel="(?:stylesheet|preconnect)")[^>]*>', '', html)
            html = re.sub(r'<script\b[^>]*\bsrc="[^"]+"[^>]*>\s*</script>', '', html)
            css = (ROOT / 'styles.css').read_text(encoding='utf-8')
            html = html.replace('<head>', '<head><style>' + css + '</style><script>' + before + '</script>', 1)
            self.page.set_content(html, wait_until="domcontentloaded")
            if script:
                self.page.add_script_tag(content=(ROOT / 'common.js').read_text(encoding='utf-8'))
        else:
            if before:
                self.page.add_init_script(before)
            if not script:
                self.page.route("**/common.js", lambda route: route.abort())
            self.page.goto(self.url + (filename if filename != 'index.html' else ''), wait_until="networkidle")
        self.page.wait_for_timeout(60)

    @staticmethod
    def storage_script(value=None, blocked=False):
        import json
        if blocked:
            return "Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}});"
        return """{
            let stored = %s;
            Object.defineProperty(window,'localStorage',{value:{
              getItem(){return stored},setItem(k,v){stored=v},removeItem(){stored=null}
            },configurable:true});
        }""" % json.dumps(value)

    def open_menu(self):
        self.page.set_viewport_size({"width": 390, "height": 844})
        self.page.locator('[data-nav-toggle]').click()
        self.page.wait_for_timeout(60)

    def test_main_contains_the_primary_heading(self):
        self.load()
        self.assertEqual(self.page.locator('main h1').count(), 1)

    def test_primary_action_is_within_desktop_first_screen(self):
        self.load()
        box = self.page.locator('.hero-actions .button-primary').bounding_box()
        self.assertLess(box['y'] + box['height'], 900)

    def test_navigation_stays_visible_below_hero(self):
        self.load()
        self.page.evaluate('window.scrollTo(0, 1500)')
        self.page.wait_for_timeout(60)
        self.assertGreaterEqual(self.page.locator('.site-nav').bounding_box()['y'], -1)

    def test_no_horizontal_overflow_with_open_bibtex(self):
        self.load()
        self.page.locator('details').evaluate('(el) => el.open = true')
        for width in (320, 390, 560, 768, 840, 1024, 1440, 1920):
            with self.subTest(width=width):
                self.page.set_viewport_size({"width": width, "height": 900})
                self.page.wait_for_timeout(80)
                self.assertTrue(self.page.evaluate('document.documentElement.scrollWidth <= innerWidth'))

    def test_failed_common_script_keeps_mobile_links_visible(self):
        self.page.set_viewport_size({"width": 390, "height": 844})
        self.load(script=False)
        self.assertTrue(self.page.locator('.nav-links a[href="#research"]').is_visible())
        self.assertFalse(self.page.locator('[data-theme-toggle]').is_visible())
        self.assertFalse(self.page.locator('[data-nav-toggle]').is_visible())

    def test_invalid_saved_theme_follows_dark_system(self):
        self.page.emulate_media(color_scheme="dark")
        self.load(before=self.storage_script('invalid-value'))
        self.assertEqual(self.page.locator('html').get_attribute('data-theme'), 'dark')

    def test_storage_denial_retains_current_session_choice(self):
        self.page.emulate_media(color_scheme="light")
        self.load(before=self.storage_script(blocked=True))
        self.page.locator('[data-theme-toggle]').click()
        self.page.emulate_media(color_scheme="dark")
        self.page.wait_for_timeout(80)
        self.page.emulate_media(color_scheme="light")
        self.page.wait_for_timeout(60)
        self.assertEqual(self.page.locator('html').get_attribute('data-theme'), 'dark')
        self.assertEqual(self.errors, [])

    def test_theme_change_synchronizes_across_tabs(self):
        self.load(before=self.storage_script(None))
        self.page.evaluate("window.dispatchEvent(new StorageEvent('storage',{key:'theme',newValue:'dark'}))")
        self.assertEqual(self.page.locator('html').get_attribute('data-theme'), 'dark')

    def test_theme_reset_returns_to_system(self):
        self.page.emulate_media(color_scheme="light")
        self.load(before=self.storage_script('dark'))
        self.assertEqual(self.page.locator('[data-theme-reset]').count(), 1)
        self.page.locator('[data-theme-reset]').click()
        self.assertEqual(self.page.locator('html').get_attribute('data-theme'), 'light')
        self.page.emulate_media(color_scheme="dark")
        self.page.wait_for_timeout(60)
        self.assertEqual(self.page.locator('html').get_attribute('data-theme'), 'dark')

    def test_mobile_escape_returns_focus_to_toggle(self):
        self.load()
        self.open_menu()
        self.page.locator('.nav-links a').first.focus()
        self.page.keyboard.press('Escape')
        self.assertEqual(self.page.locator('[data-nav-toggle]').get_attribute('aria-expanded'), 'false')
        self.assertTrue(self.page.locator('[data-nav-toggle]').evaluate('(el) => el === document.activeElement'))

    def test_mobile_tab_can_leave_disclosure(self):
        self.load()
        self.open_menu()
        self.page.locator('[data-theme-toggle]').focus()
        self.page.keyboard.press('Tab')
        self.page.wait_for_timeout(60)
        self.assertFalse(self.page.locator('[data-nav-panel]').evaluate('(el) => el.contains(document.activeElement)'))
        self.assertEqual(self.page.locator('[data-nav-toggle]').get_attribute('aria-expanded'), 'false')

    def test_anchor_navigation_moves_focus_to_section(self):
        self.load()
        self.open_menu()
        self.page.locator('.nav-links a[href="#research"]').click()
        self.page.wait_for_timeout(60)
        self.assertEqual(self.page.evaluate('document.activeElement.id'), 'research')
        self.assertEqual(self.page.locator('[data-nav-toggle]').get_attribute('aria-expanded'), 'false')

    def test_section_navigation_announces_current_location(self):
        self.load()
        self.page.locator('#research').evaluate('(el) => window.scrollTo(0, el.offsetTop - 100)')
        self.page.wait_for_timeout(120)
        self.assertEqual(self.page.locator('.nav-links a[href="#research"]').get_attribute('aria-current'), 'location')
        self.page.evaluate('window.scrollTo(0,0)')
        self.page.wait_for_timeout(120)
        self.assertEqual(self.page.locator('.nav-links [aria-current]').count(), 0)

    def test_reveal_observer_cannot_hide_content(self):
        self.page.emulate_media(reduced_motion="no-preference")
        self.load(before="window.IntersectionObserver=class {observe(){}unobserve(){}disconnect(){}};")
        self.assertTrue(self.page.locator('[data-reveal]').evaluate_all(
            "els => els.every(el => getComputedStyle(el).opacity !== '0')"))

    def test_theme_control_has_touch_target(self):
        self.load()
        box = self.page.locator('[data-theme-toggle]').bounding_box()
        self.assertGreaterEqual(box['height'], 44)
        self.assertGreaterEqual(box['width'], 44)

    def test_dark_primary_button_text_contrast(self):
        self.load(before=self.storage_script('dark'))
        ratio = self.page.locator('.hero-actions .button-primary').evaluate(r"""el => {
          const style=getComputedStyle(el);
          const lum=color=>{let c=color.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>x/255); c=c.map(x=>x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4));return c[0]*.2126+c[1]*.7152+c[2]*.0722};
          const a=lum(style.color),b=lum(style.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
        }""")
        self.assertGreaterEqual(ratio, 4.5)

    def test_print_overrides_saved_dark_theme(self):
        self.load(before=self.storage_script('dark'))
        self.page.emulate_media(media='print')
        self.page.wait_for_timeout(80)
        self.assertEqual(self.page.evaluate('getComputedStyle(document.body).backgroundColor'), 'rgb(255, 255, 255)')
        self.assertEqual(self.page.locator('.foam-section').evaluate('(el) => getComputedStyle(el).backgroundColor'), 'rgb(255, 255, 255)')

    def test_clipboard_denial_uses_legacy_fallback(self):
        self.load(before="""Object.defineProperty(window,'isSecureContext',{value:true});
            Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new DOMException('Denied','NotAllowedError'))}});
            document.execCommand=()=>true;""")
        self.page.locator('details').evaluate('(el) => el.open=true')
        self.page.locator('[data-copy-bibtex]').click()
        self.assertEqual(self.page.locator('[data-copy-bibtex]').inner_text(), 'Copied')
        self.assertEqual(self.page.locator('textarea').count(), 0)
        self.assertTrue(self.page.locator('[data-copy-bibtex]').evaluate('(el) => el === document.activeElement'))

    def test_total_clipboard_failure_selects_visible_citation(self):
        self.load(before="""Object.defineProperty(window,'isSecureContext',{value:true});
            Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(Error('Denied'))}});
            document.execCommand=()=>{throw Error('Denied')};""")
        self.page.locator('details').evaluate('(el) => el.open=true')
        self.page.locator('[data-copy-bibtex]').click()
        self.assertIn('@inproceedings', self.page.evaluate('String(window.getSelection())'))
        self.assertEqual(self.page.locator('textarea').count(), 0)
        self.assertEqual(self.errors, [])

    def test_runtime_has_no_uncaught_errors(self):
        self.load()
        self.assertEqual(self.errors, [])

    def test_no_javascript_supports_navigation_and_native_citation(self):
        self.context.close()
        self.context = self.browser.new_context(java_script_enabled=False, color_scheme="dark", viewport={"width":390,"height":844})
        self.page = self.context.new_page()
        self.load(script=False)
        self.assertTrue(self.page.locator('.nav-links a[href="#foam"]').is_visible())
        self.assertFalse(self.page.locator('[data-nav-toggle]').is_visible())
        self.assertFalse(self.page.locator('[data-theme-toggle]').is_visible())
        self.page.locator('summary').click()
        self.assertTrue(self.page.locator('#foam-bibtex').is_visible())
        self.assertTrue(self.page.locator('.citation-download').is_visible())
        self.assertEqual(self.page.evaluate('getComputedStyle(document.body).backgroundColor'), 'rgb(10, 14, 22)')

    def test_skip_link_moves_keyboard_focus_into_main(self):
        self.load()
        self.page.locator('.skip-link').focus()
        self.page.keyboard.press('Enter')
        self.page.wait_for_timeout(60)
        self.assertEqual(self.page.evaluate('document.activeElement.id'),'main')

    def test_clicked_section_is_below_nav_and_marked_current(self):
        self.load()
        self.page.locator('.nav-links a[href="#research"]').click()
        self.page.wait_for_timeout(100)
        section=self.page.locator('#research').bounding_box()
        nav=self.page.locator('.site-header').bounding_box()
        self.assertGreaterEqual(section['y'],nav['y']+nav['height']-1)
        self.assertLess(section['y'],nav['y']+nav['height']+64)
        self.assertEqual(self.page.locator('.nav-links a[href="#research"]').get_attribute('aria-current'),'location')

    def test_resize_clears_mobile_menu_state(self):
        self.load()
        self.open_menu()
        self.page.set_viewport_size({"width":1280,"height":900})
        self.page.wait_for_timeout(100)
        self.assertEqual(self.page.locator('[data-nav-toggle]').get_attribute('aria-expanded'),'false')
        self.assertTrue(self.page.locator('.nav-links').is_visible())

    def test_failed_observer_does_not_disable_citation(self):
        self.page.emulate_media(reduced_motion="no-preference")
        self.load(before="window.IntersectionObserver=class {constructor(){throw Error('Not available')}};")
        self.page.locator('details').evaluate('(el)=>el.open=true')
        self.assertTrue(self.page.locator('[data-copy-bibtex]').is_visible())
        self.assertEqual(self.errors,[])

    def test_modern_clipboard_receives_exact_citation(self):
        self.load(before="""Object.defineProperty(window,'isSecureContext',{value:true});
            Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copiedCitation=text;}}});
            document.execCommand=()=>{throw Error('Legacy fallback should not run')};""")
        self.page.locator('details').evaluate('(el)=>el.open=true')
        self.page.locator('[data-copy-bibtex]').click()
        self.assertEqual(self.page.evaluate('window.copiedCitation'),(ROOT/'assets/papers/foam.bib').read_text().strip())
        self.assertEqual(self.page.locator('[data-copy-bibtex]').inner_text(),'Copied')

    def test_double_text_size_has_no_horizontal_overflow(self):
        self.load()
        self.page.add_style_tag(content='html { font-size: 200%; }')
        self.page.wait_for_timeout(100)
        self.assertTrue(self.page.evaluate('document.documentElement.scrollWidth <= innerWidth'))

    def test_unavailable_match_media_does_not_break_enhancements(self):
        self.load(before='window.matchMedia=undefined;')
        self.assertTrue(self.page.locator('[data-theme-toggle]').is_visible())
        self.assertEqual(self.errors,[])

if __name__ == '__main__':
    print(f'Browser mode: {MODE}', flush=True)
    unittest.main(verbosity=2)
