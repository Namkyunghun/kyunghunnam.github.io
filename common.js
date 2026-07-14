(function () {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');

  const storage = {
    get(key) { try { return window.localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { window.localStorage.setItem(key, value); return true; } catch { return false; } }
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  function addMediaListener(query, callback) {
    if (typeof query.addEventListener === 'function') query.addEventListener('change', callback);
    else if (typeof query.addListener === 'function') query.addListener(callback);
  }

  function isTypingContext(target) {
    return target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
  }

  function showToast(message) {
    const region = document.querySelector('.toast-region');
    if (!region) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    region.appendChild(toast);
    window.setTimeout(() => {
      toast.classList.add('is-leaving');
      window.setTimeout(() => toast.remove(), 240);
    }, 2400);
  }

  function applyTheme(theme) {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    root.dataset.theme = normalized;
    const button = document.querySelector('[data-theme-toggle]');
    if (button) {
      const next = normalized === 'dark' ? 'light' : 'dark';
      button.setAttribute('aria-label', `Switch to ${next} mode (press T)`);
      button.setAttribute('aria-pressed', normalized === 'dark' ? 'true' : 'false');
      const icon = button.querySelector('.theme-toggle__icon');
      if (icon) icon.textContent = normalized === 'dark' ? '☀︎' : '◐';
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', normalized === 'dark' ? '#070d19' : '#f4f7fb');
  }

  function initTheme() {
    const saved = storage.get('theme');
    applyTheme(saved || (prefersDark.matches ? 'dark' : 'light'));
    const button = document.querySelector('[data-theme-toggle]');
    button?.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      storage.set('theme', next);
      applyTheme(next);
      showToast(`Theme changed to ${next} mode.`);
    });
    addMediaListener(prefersDark, (event) => {
      if (!storage.get('theme')) applyTheme(event.matches ? 'dark' : 'light');
    });
  }

  function initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navPanel = document.querySelector('.nav-panel');
    if (!navToggle || !navPanel) return;
    const focusable = () => Array.from(navPanel.querySelectorAll('a[href], button:not([disabled])'));
    const closeMenu = ({ restoreFocus = false } = {}) => {
      if (!document.body.classList.contains('nav-open')) return;
      document.body.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      if (restoreFocus) navToggle.focus();
    };
    navToggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', String(open));
      if (open) window.setTimeout(() => focusable()[0]?.focus(), 0);
    });
    navPanel.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu()));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu({ restoreFocus: true });
      if (event.key === 'Tab' && document.body.classList.contains('nav-open')) {
        const items = focusable();
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 840) closeMenu(); });
    document.addEventListener('click', (event) => {
      if (!document.body.classList.contains('nav-open')) return;
      if (!navPanel.contains(event.target) && !navToggle.contains(event.target)) closeMenu();
    });
  }

  function revealAll(items) { items.forEach((item) => item.classList.add('is-visible')); }

  function initReveal() {
    const items = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!items.length || prefersReducedMotion.matches || !('IntersectionObserver' in window)) { revealAll(items); return; }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -24px 0px' });
    items.forEach((item) => observer.observe(item));
  }

  function initScrollUI() {
    const progressBar = document.querySelector('.progress-bar');
    const backToTop = document.querySelector('.back-to-top');
    let rafId = null;
    const update = () => {
      rafId = null;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min((scrollTop / maxScroll) * 100, 100);
      document.body.classList.toggle('is-scrolled', scrollTop > 10);
      if (progressBar) progressBar.style.width = `${progress}%`;
      if (backToTop) backToTop.classList.toggle('is-visible', scrollTop > 500);
    };
    const onScroll = () => { if (rafId === null) rafId = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' }));
  }

  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        const id = anchor.getAttribute('href');
        if (!id || id === '#') return;
        let target;
        try { target = document.querySelector(id); } catch { return; }
        if (!target) return;
        event.preventDefault();
        const navHeight = document.querySelector('.site-nav')?.offsetHeight || 0;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
        window.scrollTo({ top, behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' });
        const hadTabindex = target.hasAttribute('tabindex');
        if (!hadTabindex) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        if (!hadTabindex) target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
        history.replaceState(null, '', id);
      });
    });
  }

  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('Copy command failed');
  }

  function initCopyButtons() {
    document.querySelectorAll('[data-copy-value]').forEach((button) => {
      button.addEventListener('click', async () => {
        const value = button.getAttribute('data-copy-value');
        if (!value) return;
        try { await copyText(value); showToast('Copied to clipboard.'); }
        catch { showToast('Clipboard copy was blocked by the browser.'); }
      });
    });
    document.querySelectorAll('.bibtex-copy').forEach((button) => {
      button.addEventListener('click', async () => {
        const code = button.closest('.bibtex-code');
        if (!code) return;
        const clone = code.cloneNode(true);
        clone.querySelectorAll('.bibtex-copy').forEach((element) => element.remove());
        try { await copyText(clone.textContent.trim()); showToast('BibTeX copied to clipboard.'); }
        catch { showToast('Clipboard copy was blocked by the browser.'); }
      });
    });
  }

  function initFooterYear() {
    const year = String(new Date().getFullYear());
    document.querySelectorAll('.current-year').forEach((element) => { element.textContent = year; });
  }

  function animateCounter(element) {
    const finalValue = Number(element.dataset.counter || element.textContent.trim());
    if (!Number.isFinite(finalValue)) return;
    if (prefersReducedMotion.matches) { element.textContent = String(finalValue); return; }
    const duration = 850;
    const startTime = performance.now();
    const step = (time) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = String(Math.round(finalValue * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function initCounters() {
    const counters = Array.from(document.querySelectorAll('[data-counter]'));
    if (!counters.length) return;
    if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) { counters.forEach((c) => { c.textContent = c.dataset.counter; }); return; }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { animateCounter(entry.target); observer.unobserve(entry.target); } });
    }, { threshold: 0.45 });
    counters.forEach((counter) => observer.observe(counter));
  }

  function initPublicationControls() {
    const list = document.getElementById('publication-list');
    if (!list) return;
    const searchInput = document.getElementById('publication-search');
    const sortSelect = document.getElementById('publication-sort');
    const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
    const summary = document.querySelector('[data-publication-summary]');
    const emptyState = document.getElementById('publication-empty');
    let activeFilter = 'all';
    const getCards = () => Array.from(list.querySelectorAll('.publication-card'));
    const apply = () => {
      const query = (searchInput?.value || '').trim().toLowerCase();
      const cards = getCards();
      let visibleCount = 0;
      cards.forEach((card) => {
        const haystack = [card.dataset.title, card.dataset.type, card.dataset.year, card.dataset.search, card.innerText].join(' ').toLowerCase();
        const visible = (activeFilter === 'all' || card.dataset.type === activeFilter) && (!query || haystack.includes(query));
        card.hidden = !visible;
        if (visible) visibleCount += 1;
      });
      if (summary) summary.textContent = `Showing ${visibleCount} of ${cards.length} publication${cards.length === 1 ? '' : 's'}.`;
      if (emptyState) emptyState.hidden = visibleCount !== 0;
    };
    const sortCards = () => {
      const value = sortSelect?.value || 'year-desc';
      const cards = getCards();
      cards.sort((a, b) => {
        const yearA = Number(a.dataset.year || 0), yearB = Number(b.dataset.year || 0);
        const titleA = (a.dataset.title || '').toLowerCase(), titleB = (b.dataset.title || '').toLowerCase();
        if (value === 'year-asc') return yearA - yearB || titleA.localeCompare(titleB);
        if (value === 'title-asc') return titleA.localeCompare(titleB) || yearB - yearA;
        return yearB - yearA || titleA.localeCompare(titleB);
      });
      cards.forEach((card) => list.appendChild(card));
      apply();
    };
    filterButtons.forEach((button) => button.addEventListener('click', () => {
      activeFilter = button.dataset.filter || 'all';
      filterButtons.forEach((other) => { const active = other === button; other.classList.toggle('is-active', active); other.setAttribute('aria-pressed', String(active)); });
      apply();
    }));
    searchInput?.addEventListener('input', apply);
    searchInput?.addEventListener('keydown', (event) => { if (event.key === 'Escape' && searchInput.value) { searchInput.value = ''; apply(); } });
    sortSelect?.addEventListener('change', sortCards);
    sortCards();
  }

  function initKeyboardShortcuts() {
    let pendingG = false;
    let pendingTimer = null;
    const clearPending = () => { pendingG = false; if (pendingTimer) window.clearTimeout(pendingTimer); pendingTimer = null; };
    document.addEventListener('keydown', (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isTypingContext(event.target)) return;
      const key = event.key.toLowerCase();
      if (pendingG) {
        const routes = { h: 'index.html', r: 'research.html', p: 'publications.html', n: 'notes.html', c: 'contact.html' };
        if (routes[key]) { event.preventDefault(); window.location.href = routes[key]; }
        clearPending();
        return;
      }
      if (key === 't') { event.preventDefault(); document.querySelector('[data-theme-toggle]')?.click(); }
      else if (key === '/') { const search = document.getElementById('publication-search'); if (search) { event.preventDefault(); search.focus(); } }
      else if (key === 'g') { pendingG = true; pendingTimer = window.setTimeout(clearPending, 1500); }
      else if (key === '?') { event.preventDefault(); showToast('Shortcuts: T theme · / publication search · G then H/R/P/N/C navigate.'); }
    });
  }

  function init() {
    initTheme(); initNavigation(); initReveal(); initScrollUI(); initSmoothAnchors(); initCopyButtons(); initFooterYear(); initCounters(); initPublicationControls(); initKeyboardShortcuts();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
