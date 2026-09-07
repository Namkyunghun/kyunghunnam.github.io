/* Small, independent progressive enhancements. No runtime dependencies. */
(() => {
  'use strict';
  const root = document.documentElement;
  const media = (query) => window.matchMedia?.(query);
  const systemTheme = media('(prefers-color-scheme: dark)');
  const reducedMotion = media('(prefers-reduced-motion: reduce)');
  const validTheme = (value) => value === 'light' || value === 'dark';

  const storage = {
    get() {
      try { return window.localStorage.getItem('theme'); } catch { return null; }
    },
    set(value) {
      try {
        if (value === null) window.localStorage.removeItem('theme');
        else window.localStorage.setItem('theme', value);
      } catch { /* In-memory choice still works when persistence is unavailable. */ }
    }
  };

  function onMediaChange(query, handler) {
    if (query?.addEventListener) query.addEventListener('change', handler);
    else query?.addListener?.(handler);
  }

  function initTheme() {
    const saved = storage.get();
    let preference = validTheme(saved) ? saved : null;
    const toggle = document.querySelector('[data-theme-toggle]');
    const reset = document.querySelector('[data-theme-reset]');

    const apply = () => {
      const theme = preference || (systemTheme?.matches ? 'dark' : 'light');
      root.dataset.theme = theme;
      if (toggle) {
        const next = theme === 'dark' ? 'light' : 'dark';
        toggle.setAttribute('aria-label', `Switch to ${next} theme`);
        toggle.setAttribute('title', `Switch to ${next} theme`);
        const label = toggle.querySelector('.theme-toggle-label');
        if (label) label.textContent = `${next === 'dark' ? 'Dark' : 'Light'} theme`;
      }
      if (reset) reset.hidden = preference === null;
      document.querySelector('meta[name="theme-color"]')?.setAttribute(
        'content', theme === 'dark' ? '#0a0e16' : '#f5f5f2'
      );
    };

    toggle?.addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      storage.set(preference);
      apply();
    });
    reset?.addEventListener('click', () => {
      preference = null;
      storage.set(null);
      // The reset disappears: return focus to another operable control.
      toggle?.focus({ preventScroll: true });
      apply();
    });
    onMediaChange(systemTheme, () => { if (preference === null) apply(); });
    window.addEventListener('storage', (event) => {
      if (event.key !== 'theme' && event.key !== null) return;
      preference = validTheme(event.newValue) ? event.newValue : null;
      apply();
    });
    apply();
    if (toggle) toggle.hidden = false;
  }

  function initNavigation() {
    const toggle = document.querySelector('[data-nav-toggle]');
    const panel = document.querySelector('[data-nav-panel]');
    const nav = document.querySelector('.site-nav');
    if (!toggle || !panel || !nav) return;
    const mobile = media('(max-width: 840px)');
    const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

    function closeMenu(restoreFocus = false) {
      panel.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
      if (restoreFocus) toggle.focus({ preventScroll: true });
    }

    toggle.addEventListener('click', () => {
      if (isOpen()) { closeMenu(); return; }
      panel.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close navigation');
      // Disclosure, not a modal: focus stays on the button; Tab enters links.
    });
    nav.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) {
        event.preventDefault();
        closeMenu(true);
      }
    });
    nav.addEventListener('focusout', () => {
      window.setTimeout(() => {
        if (isOpen() && !nav.contains(document.activeElement)) closeMenu();
      }, 0);
    });
    document.addEventListener('pointerdown', (event) => {
      if (isOpen() && !nav.contains(event.target)) {
        closeMenu(panel.contains(document.activeElement));
      }
    });
    panel.querySelectorAll('a[href]').forEach((link) => {
      link.addEventListener('click', (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
            event.ctrlKey || event.shiftKey || event.altKey) return;
        const wasOpen = isOpen();
        closeMenu();
        const href = link.getAttribute('href');
        if (href?.startsWith('#')) {
          const target = document.getElementById(href.slice(1));
          // Native fragment navigation/history is retained; only transfer focus.
          target?.focus({ preventScroll: true });
        } else if (wasOpen) {
          toggle.focus({ preventScroll: true });
        }
      });
    });
    onMediaChange(mobile, () => {
      const focusedInPanel = panel.contains(document.activeElement);
      closeMenu(Boolean(mobile?.matches && focusedInPanel));
      if (!mobile?.matches && document.activeElement === toggle) {
        panel.querySelector('a')?.focus({ preventScroll: true });
      }
    });
    window.addEventListener('pageshow', () => closeMenu());
    toggle.hidden = false;
    toggle.setAttribute('aria-label', 'Open navigation');
    // Only hide the mobile panel after handlers have been installed successfully.
    root.classList.add('nav-ready');
  }

  function initSectionTracking() {
    const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
    const sections = links.map((link) => ({
      link, node: document.getElementById(link.getAttribute('href').slice(1))
    })).filter((entry) => entry.node);
    if (!sections.length) return;
    let pending = false;
    const update = () => {
      pending = false;
      const navHeight = document.querySelector('.site-header')?.offsetHeight || 76;
      let active = null;
      for (const entry of sections) {
        if (entry.node.getBoundingClientRect().top <= navHeight + 56) active = entry.link;
      }
      // The last section can be shorter than a viewport.
      if (window.scrollY > 0 && window.innerHeight + window.scrollY >= root.scrollHeight - 4) {
        active = sections[sections.length - 1].link;
      }
      for (const { link } of sections) {
        if (link === active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    };
    const schedule = () => {
      if (!pending) { pending = true; window.requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', schedule);
    window.addEventListener('pageshow', schedule);
    update();
  }

  function initReveal() {
    if (reducedMotion?.matches || !('IntersectionObserver' in window)) return;
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;
    // Content is always visible. Observation adds only an optional entrance effect.
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.06 });
    root.classList.add('reveal-ready');
    items.forEach((item) => observer.observe(item));
    onMediaChange(reducedMotion, () => {
      if (reducedMotion.matches) {
        observer.disconnect();
        root.classList.remove('reveal-ready');
      }
    });
  }

  function initFooterYear() {
    document.querySelectorAll('.current-year').forEach((node) => {
      node.textContent = String(new Date().getFullYear());
    });
  }

  async function copyText(value) {
    if (window.isSecureContext && typeof navigator.clipboard?.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(value);
        return;
      } catch { /* Permission denial also needs the compatibility path below. */ }
    }
    // Legacy compatibility only: the async Clipboard API is the preferred path.
    const previousFocus = document.activeElement;
    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.className = 'clipboard-field';
    document.body.appendChild(field);
    try {
      field.focus({ preventScroll: true });
      field.select();
      if (!document.execCommand('copy')) throw new Error('Clipboard unavailable');
    } finally {
      field.remove();
      previousFocus?.focus?.({ preventScroll: true });
    }
  }

  function initBibtexCopy() {
    const button = document.querySelector('[data-copy-bibtex]');
    const targetId = button?.getAttribute('data-copy-target');
    const target = targetId ? document.getElementById(targetId) : null;
    if (!button || !target) return;
    const status = document.querySelector('[data-copy-status]');
    let resetTimer = null;
    let copying = false;
    button.addEventListener('click', async () => {
      if (copying) return;
      copying = true;
      window.clearTimeout(resetTimer);
      button.setAttribute('aria-busy', 'true');
      try {
        await copyText(target.textContent.trim());
        button.textContent = 'Copied';
        if (status) status.textContent = 'BibTeX copied to clipboard.';
        resetTimer = window.setTimeout(() => {
          button.textContent = 'Copy BibTeX';
          if (status) status.textContent = '';
        }, 3000);
      } catch {
        // Keep a persistent, useful fallback; do not clear the instruction early.
        const details = target.closest('details');
        if (details) details.open = true;
        target.focus({ preventScroll: true });
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(target);
        selection?.removeAllRanges();
        selection?.addRange(range);
        button.textContent = 'Try copying again';
        if (status) status.textContent = 'Automatic copy is unavailable. The citation is selected: press Ctrl+C / ⌘C, or download the .bib file.';
      } finally {
        copying = false;
        button.removeAttribute('aria-busy');
      }
    });
    button.hidden = false;
  }

  function init() {
    // A failed optional enhancement must not prevent the others from starting.
    for (const setup of [initTheme, initNavigation, initSectionTracking, initReveal, initFooterYear, initBibtexCopy]) {
      try { setup(); } catch (error) { console.warn(`Optional enhancement ${setup.name} was skipped.`, error); }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
