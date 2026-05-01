
(function () {
  const root = document.documentElement;
  root.classList.add('js');

  const storage = {
    get(key) {
      try { return window.localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); } catch { return null; }
    }
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  function isTypingContext(target) {
    return target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    );
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
    root.dataset.theme = theme;
    const button = document.querySelector('[data-theme-toggle]');
    if (button) {
      const next = theme === 'dark' ? 'light' : 'dark';
      button.setAttribute('aria-label', `Switch to ${next} mode (press T)`);
      button.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      const icon = button.querySelector('.theme-toggle__icon');
      if (icon) icon.textContent = theme === 'dark' ? '☀︎' : '◐';
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', theme === 'dark' ? '#070d19' : '#f4f7fb');
  }

  function initTheme() {
    const saved = storage.get('theme');
    applyTheme(saved || (prefersDark.matches ? 'dark' : 'light'));

    const button = document.querySelector('[data-theme-toggle]');
    if (!button) return;

    button.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      storage.set('theme', next);
      applyTheme(next);
      showToast(`Theme changed to ${next} mode.`);
    });

    prefersDark.addEventListener('change', (event) => {
      if (!storage.get('theme')) applyTheme(event.matches ? 'dark' : 'light');
    });
  }

  function initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navPanel = document.querySelector('.nav-panel');
    const navLinks = document.querySelectorAll('.nav-links a');
    if (!navToggle || !navPanel) return;

    const firstFocusable = () => navPanel.querySelector('a, button');

    const closeMenu = ({ restoreFocus = false } = {}) => {
      if (!document.body.classList.contains('nav-open')) return;
      document.body.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      if (restoreFocus) navToggle.focus();
    };

    navToggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) window.setTimeout(() => firstFocusable()?.focus(), 0);
    });

    navLinks.forEach((link) => link.addEventListener('click', () => closeMenu()));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu({ restoreFocus: true });
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 840) closeMenu();
    });

    document.addEventListener('click', (event) => {
      if (!document.body.classList.contains('nav-open')) return;
      const clickedInside = navPanel.contains(event.target) || navToggle.contains(event.target);
      if (!clickedInside) closeMenu();
    });
  }

  function initReveal() {
    const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!revealItems.length || prefersReducedMotion.matches) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' });

    revealItems.forEach((item) => observer.observe(item));
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

    const onScroll = () => {
      if (rafId === null) rafId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (backToTop) {
      backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' });
      });
    }
  }

  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        const id = anchor.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        event.preventDefault();
        const navHeight = document.querySelector('.site-nav')?.offsetHeight || 0;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
        window.scrollTo({ top, behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' });
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }

  function initCopyButtons() {
    document.querySelectorAll('[data-copy-value]').forEach((button) => {
      button.addEventListener('click', async () => {
        const value = button.getAttribute('data-copy-value');
        if (!value) return;
        try {
          await navigator.clipboard.writeText(value);
          showToast('Copied to clipboard.');
        } catch {
          showToast('Clipboard copy was blocked by the browser.');
        }
      });
    });

    document.querySelectorAll('.bibtex-copy').forEach((button) => {
      button.addEventListener('click', async () => {
        const code = button.closest('.bibtex-code');
        if (!code) return;
        const clone = code.cloneNode(true);
        clone.querySelectorAll('.bibtex-copy').forEach((el) => el.remove());
        const value = clone.textContent.trim();
        try {
          await navigator.clipboard.writeText(value);
          showToast('BibTeX copied to clipboard.');
        } catch {
          showToast('Clipboard copy was blocked.');
        }
      });
    });
  }

  function initFooterYear() {
    const year = String(new Date().getFullYear());
    document.querySelectorAll('.current-year').forEach((element) => {
      element.textContent = year;
    });
  }

  function animateCounter(element) {
    const finalValue = Number(element.dataset.counter || element.textContent.trim());
    if (!Number.isFinite(finalValue)) return;
    if (prefersReducedMotion.matches) {
      element.textContent = String(finalValue);
      return;
    }

    const duration = 900;
    const startTime = performance.now();

    const step = (time) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(finalValue * eased);
      element.textContent = String(value);
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  function initCounters() {
    const counters = Array.from(document.querySelectorAll('[data-counter]'));
    if (!counters.length) return;

    if (prefersReducedMotion.matches) {
      counters.forEach((counter) => { counter.textContent = counter.dataset.counter; });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
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

    const matchesQuery = (card, query) => {
      if (!query) return true;
      const haystack = [
        card.dataset.title,
        card.dataset.type,
        card.dataset.year,
        card.dataset.search,
        card.textContent
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    };

    const apply = () => {
      const query = (searchInput?.value || '').trim().toLowerCase();
      const cards = getCards();
      let visibleCount = 0;

      cards.forEach((card) => {
        const filterOk = activeFilter === 'all' || card.dataset.type === activeFilter;
        const queryOk = matchesQuery(card, query);
        const visible = filterOk && queryOk;
        card.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      if (summary) summary.textContent = `Showing ${visibleCount} of ${cards.length} publications.`;
      if (emptyState) emptyState.hidden = visibleCount !== 0;
    };

    const sortCards = () => {
      const value = sortSelect?.value || 'year-desc';
      const cards = getCards();
      cards.sort((a, b) => {
        const yearA = Number(a.dataset.year || 0);
        const yearB = Number(b.dataset.year || 0);
        const titleA = (a.dataset.title || '').toLowerCase();
        const titleB = (b.dataset.title || '').toLowerCase();
        if (value === 'year-asc') return yearA - yearB || titleA.localeCompare(titleB);
        if (value === 'title-asc') return titleA.localeCompare(titleB) || yearB - yearA;
        return yearB - yearA || titleA.localeCompare(titleB);
      });
      cards.forEach((card) => list.appendChild(card));
      apply();
    };

    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        activeFilter = button.dataset.filter || 'all';
        filterButtons.forEach((other) => {
          const active = other === button;
          other.classList.toggle('is-active', active);
          other.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        apply();
      });
    });

    searchInput?.addEventListener('input', apply);
    searchInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && searchInput.value) {
        searchInput.value = '';
        apply();
      }
    });
    sortSelect?.addEventListener('change', sortCards);
    sortCards();
  }

  function initKeyboardShortcuts() {
    let pendingG = false;
    let pendingTimer = null;

    const clearPending = () => {
      pendingG = false;
      if (pendingTimer) window.clearTimeout(pendingTimer);
      pendingTimer = null;
    };

    document.addEventListener('keydown', (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isTypingContext(event.target)) return;

      const key = event.key.toLowerCase();
      if (pendingG) {
        const routes = { h: 'index.html', r: 'research.html', p: 'publications.html', c: 'contact.html' };
        if (routes[key]) {
          event.preventDefault();
          window.location.href = routes[key];
        }
        clearPending();
        return;
      }

      if (key === 't') {
        event.preventDefault();
        document.querySelector('[data-theme-toggle]')?.click();
      } else if (key === '/') {
        const search = document.getElementById('publication-search');
        if (search) {
          event.preventDefault();
          search.focus();
        }
      } else if (key === 'g') {
        pendingG = true;
        pendingTimer = window.setTimeout(clearPending, 1500);
      } else if (key === '?') {
        event.preventDefault();
        showToast('Shortcuts: T theme · / search publications · G then H/R/P/C navigate.');
      }
    });
  }

  function init() {
    initTheme();
    initNavigation();
    initReveal();
    initScrollUI();
    initSmoothAnchors();
    initCopyButtons();
    initFooterYear();
    initCounters();
    initPublicationControls();
    initKeyboardShortcuts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
