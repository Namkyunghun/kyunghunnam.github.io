(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

  const storage = {
    get(key) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Storage can be unavailable in privacy-restricted contexts.
      }
    }
  };

  function addMediaListener(query, callback) {
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', callback);
    } else if (typeof query.addListener === 'function') {
      query.addListener(callback);
    }
  }

  function applyTheme(theme) {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    root.dataset.theme = normalized;

    const toggle = document.querySelector('[data-theme-toggle]');
    if (toggle) {
      const nextTheme = normalized === 'dark' ? 'light' : 'dark';
      toggle.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
      const label = toggle.querySelector('.theme-toggle-label');
      if (label) label.textContent = normalized === 'dark' ? 'Light theme' : 'Dark theme';
    }

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', normalized === 'dark' ? '#0a0e16' : '#f5f5f2');
  }

  function initTheme() {
    const saved = storage.get('theme');
    applyTheme(saved || (systemTheme.matches ? 'dark' : 'light'));

    const toggle = document.querySelector('[data-theme-toggle]');
    toggle?.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      storage.set('theme', next);
      applyTheme(next);
    });

    addMediaListener(systemTheme, (event) => {
      if (!storage.get('theme')) applyTheme(event.matches ? 'dark' : 'light');
    });
  }

  function initNavigation() {
    const toggle = document.querySelector('[data-nav-toggle]');
    const panel = document.querySelector('[data-nav-panel]');
    if (!toggle || !panel) return;

    const focusable = () => Array.from(
      panel.querySelectorAll('a[href], button:not([disabled])')
    );

    const closeMenu = ({ restoreFocus = false } = {}) => {
      panel.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
      if (restoreFocus) toggle.focus();
    };

    const openMenu = () => {
      panel.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
      window.requestAnimationFrame(() => focusable()[0]?.focus());
    };

    toggle.addEventListener('click', () => {
      if (toggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
      } else {
        openMenu();
      }
    });

    panel.querySelectorAll('a[href]').forEach((link) => {
      link.addEventListener('click', () => closeMenu());
    });

    document.addEventListener('keydown', (event) => {
      if (!panel.classList.contains('is-open')) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu({ restoreFocus: true });
        return;
      }

      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    document.addEventListener('pointerdown', (event) => {
      if (!panel.classList.contains('is-open')) return;
      if (panel.contains(event.target) || toggle.contains(event.target)) return;
      closeMenu();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 840) closeMenu();
    });
  }

  function initReveal() {
    const items = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!items.length || reducedMotion.matches || !('IntersectionObserver' in window)) return;

    root.classList.add('reveal-ready');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.08
    });

    items.forEach((item) => observer.observe(item));
  }

  function initFooterYear() {
    const year = String(new Date().getFullYear());
    document.querySelectorAll('.current-year').forEach((node) => {
      node.textContent = year;
    });
  }

  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    if (!copied) throw new Error('Copy command was rejected');
  }

  function initBibtexCopy() {
    const button = document.querySelector('[data-copy-bibtex]');
    if (!button) return;

    const status = document.querySelector('[data-copy-status]');
    let resetTimer = null;

    button.addEventListener('click', async () => {
      const targetId = button.getAttribute('data-copy-target');
      const target = targetId ? document.getElementById(targetId) : null;
      if (!target) return;

      try {
        await copyText(target.textContent.trim());
        button.textContent = 'Copied';
        if (status) status.textContent = 'BibTeX copied to clipboard.';
      } catch {
        button.textContent = 'Copy failed';
        if (status) status.textContent = 'Select the BibTeX text and copy it manually.';
      }

      if (resetTimer) window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        button.textContent = 'Copy BibTeX';
        if (status) status.textContent = '';
      }, 2600);
    });
  }

  function init() {
    initTheme();
    initNavigation();
    initReveal();
    initFooterYear();
    initBibtexCopy();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
