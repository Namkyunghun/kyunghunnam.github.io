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
      window.setTimeout(() => toast.remove(), 260);
    }, 2200);
  }

  // ===== Theme =====
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
    // Update theme-color meta for mobile browser chrome
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#070d19' : '#f4f7fb');
    }
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
      if (!storage.get('theme')) {
        applyTheme(event.matches ? 'dark' : 'light');
      }
    });
  }

  // ===== Navigation =====
  function initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navPanel = document.querySelector('.nav-panel');
    const navLinks = document.querySelectorAll('.nav-links a');
    if (!navToggle || !navPanel) return;

    const closeMenu = () => {
      document.body.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    };

    navToggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    navLinks.forEach((link) => link.addEventListener('click', closeMenu));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
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

  // ===== Reveal animations =====
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

  // ===== Scroll UI =====
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

  // ===== Smooth anchors =====
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
        // Move focus for accessibility
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }

  // ===== Copy buttons =====
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

    // BibTeX copy
    document.querySelectorAll('.bibtex-copy').forEach((button) => {
      button.addEventListener('click', async () => {
        const wrap = button.closest('.bibtex');
        if (!wrap) return;
        const code = wrap.querySelector('.bibtex-code');
        if (!code) return;
        // Get text content excluding the button
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

  // ===== Footer year =====
  function initFooterYear() {
    const year = String(new Date().getFullYear());
    document.querySelectorAll('.current-year').forEach((element) => {
      element.textContent = year;
    });
  }

  // ===== Counters =====
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
    const counters = document.querySelectorAll('[data-counter]');
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
    }, { threshold: 0.4 });

    counters.forEach((counter) => observer.observe(counter));
  }

  // ===== Publications =====
  function initPublications() {
    const list = document.querySelector('#publication-list');
    if (!list) return;

    const cards = Array.from(list.querySelectorAll('.publication-card'));
    const searchInput = document.querySelector('#publication-search');
    const sortSelect = document.querySelector('#publication-sort');
    const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
    const summary = document.querySelector('[data-publication-summary]');
    const emptyState = document.querySelector('#publication-empty');
    const countNodes = {
      all: document.querySelector('[data-count="all"]'),
      journal: document.querySelector('[data-count="journal"]'),
      workshop: document.querySelector('[data-count="workshop"]')
    };

    const counts = {
      all: cards.length,
      journal: cards.filter((card) => card.dataset.type === 'journal').length,
      workshop: cards.filter((card) => card.dataset.type === 'workshop').length
    };

    Object.entries(counts).forEach(([key, value]) => {
      if (countNodes[key]) {
        countNodes[key].dataset.counter = String(value);
        countNodes[key].textContent = String(value);
      }
    });

    let state = {
      filter: 'all',
      query: '',
      sort: 'year-desc'
    };

    const params = new URLSearchParams(window.location.search);
    if (params.has('type')) state.filter = params.get('type') || 'all';
    if (params.has('q')) state.query = params.get('q') || '';
    if (params.has('sort')) state.sort = params.get('sort') || 'year-desc';

    if (searchInput) searchInput.value = state.query;
    if (sortSelect) sortSelect.value = state.sort;

    function matches(card) {
      const haystack = [
        card.dataset.title,
        card.dataset.type,
        card.dataset.year,
        card.textContent
      ].join(' ').toLowerCase();

      const queryMatch = !state.query || haystack.includes(state.query.toLowerCase());
      const typeMatch = state.filter === 'all' || card.dataset.type === state.filter;
      return queryMatch && typeMatch;
    }

    function sortCards(visibleCards) {
      const sorted = [...visibleCards];
      sorted.sort((a, b) => {
        if (state.sort === 'title-asc') {
          return (a.dataset.title || '').localeCompare(b.dataset.title || '');
        }
        const yearA = Number(a.dataset.year || 0);
        const yearB = Number(b.dataset.year || 0);
        return state.sort === 'year-asc' ? yearA - yearB : yearB - yearA;
      });
      sorted.forEach((card) => list.appendChild(card));
    }

    function syncUrl() {
      const nextParams = new URLSearchParams();
      if (state.filter !== 'all') nextParams.set('type', state.filter);
      if (state.query) nextParams.set('q', state.query);
      if (state.sort !== 'year-desc') nextParams.set('sort', state.sort);
      const qs = nextParams.toString();
      const nextUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
      window.history.replaceState({}, '', nextUrl);
    }

    function render() {
      filterButtons.forEach((button) => {
        const isActive = button.dataset.filter === state.filter;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      const visible = cards.filter(matches);
      cards.forEach((card) => { card.hidden = !visible.includes(card); });
      sortCards(visible);

      if (summary) {
        summary.textContent = `Showing ${visible.length} of ${cards.length} publications.`;
      }
      if (emptyState) emptyState.hidden = visible.length > 0;
      syncUrl();
    }

    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        state.filter = button.dataset.filter || 'all';
        render();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        state.query = searchInput.value.trim();
        render();
      });
      // Escape to clear
      searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && searchInput.value) {
          event.preventDefault();
          searchInput.value = '';
          state.query = '';
          render();
        }
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        state.sort = sortSelect.value;
        render();
      });
    }

    render();
  }

  // ===== Keyboard shortcuts =====
  function initKeyboardShortcuts() {
    let gPressed = false;
    let gTimer = null;

    document.addEventListener('keydown', (event) => {
      if (isTypingContext(event.target)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      // Two-key page shortcuts: g h / g r / g p / g c
      if (gPressed) {
        gPressed = false;
        if (gTimer) { clearTimeout(gTimer); gTimer = null; }
        const routes = { h: 'index.html', r: 'research.html', p: 'publications.html', c: 'contact.html' };
        const route = routes[event.key.toLowerCase()];
        if (route) {
          event.preventDefault();
          window.location.href = route;
        }
        return;
      }

      if (event.key === 'g' || event.key === 'G') {
        gPressed = true;
        gTimer = window.setTimeout(() => { gPressed = false; }, 800);
        return;
      }

      if (event.key === 't' || event.key === 'T') {
        const themeButton = document.querySelector('[data-theme-toggle]');
        if (themeButton) {
          event.preventDefault();
          themeButton.click();
        }
      }

      if (event.key === '/') {
        const searchInput = document.querySelector('#publication-search');
        if (searchInput) {
          event.preventDefault();
          searchInput.focus();
        }
      }

      if (event.key === '?') {
        event.preventDefault();
        showToast('Shortcuts: T theme · / search · g+h/r/p/c navigate');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initReveal();
    initScrollUI();
    initSmoothAnchors();
    initCopyButtons();
    initFooterYear();
    initCounters();
    initPublications();
    initKeyboardShortcuts();
  });
})();
