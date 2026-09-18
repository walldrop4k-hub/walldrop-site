// WallDrop — mobile menu
//
// The desktop nav's Desktop/Mobile dropdowns are hover-driven mega
// menus and stay exactly that on desktop. Below 900px they're replaced
// entirely by #mobile-nav, a separate full-height overlay with its own
// open/close state and its own Desktop/Mobile accordions — see nav.njk
// and the ".mobile-nav" rules in style.css for why these are kept
// fully independent instead of reusing the desktop dropdown markup.

const hamburgerBtn = document.getElementById('hamburger-btn');
const mobileNav = document.getElementById('mobile-nav');
const mobileNavClose = document.getElementById('mobile-nav-close');

function openMobileNav() {
  mobileNav.classList.add('is-open');
  mobileNav.setAttribute('aria-hidden', 'false');
  hamburgerBtn.classList.add('is-active');
  hamburgerBtn.setAttribute('aria-expanded', 'true');
  document.body.classList.add('no-scroll');
}

function closeMobileNav() {
  mobileNav.classList.remove('is-open');
  mobileNav.setAttribute('aria-hidden', 'true');
  hamburgerBtn.classList.remove('is-active');
  hamburgerBtn.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('no-scroll');
}

hamburgerBtn.addEventListener('click', () => {
  if (mobileNav.classList.contains('is-open')) {
    closeMobileNav();
  } else {
    openMobileNav();
  }
});

mobileNavClose.addEventListener('click', closeMobileNav);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mobileNav.classList.contains('is-open')) {
    closeMobileNav();
  }
});

// Tapping an actual link inside the menu should close it, not leave it
// open behind the page it just navigated to.
mobileNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMobileNav);
});

// Desktop/Mobile accordions inside the mobile menu — tapping one opens
// its category list; the other one(s) close, so only one is open at a time.
const accordionToggles = mobileNav.querySelectorAll('[data-accordion-toggle]');

accordionToggles.forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const accordion = toggle.closest('.mobile-accordion');
    const isOpen = accordion.classList.contains('is-open');

    mobileNav.querySelectorAll('.mobile-accordion.is-open').forEach((open) => {
      open.classList.remove('is-open');
      open.querySelector('[data-accordion-toggle]').setAttribute('aria-expanded', 'false');
    });

    if (!isOpen) {
      accordion.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
    }
  });
});

// Floating header — stays the plain transparent pill look at the very
// top of the page, but gets a full-width backdrop (see .is-scrolled in
// style.css) once the page has actually scrolled, so content passing
// underneath doesn't show through the empty space around the pill.
const siteHeader = document.querySelector('.site-header');

function updateHeaderScrolled() {
  siteHeader.classList.toggle('is-scrolled', window.scrollY > 0);
}

updateHeaderScrolled();
window.addEventListener('scroll', updateHeaderScrolled, { passive: true });

// Fade sections (and the cards inside them) in as they scroll into view.
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  // threshold: 0 — a .reveal section wraps its whole card grid, so it can
  // be hundreds/thousands of px tall. A ratio threshold (e.g. 0.15) needs
  // that much of the WHOLE section visible before firing, which the first
  // on-screen row of cards never satisfies on short mobile viewports —
  // they'd sit stuck at opacity 0 until scrolled well past the fold.
  // threshold 0 fires as soon as any part of the section is on screen.
  { threshold: 0 }
);

revealEls.forEach((el) => revealObserver.observe(el));

// Desktop / Mobile format tabs (Trending now, Latest drops).
// We upload wallpapers in exactly two formats — 16:9 desktop and
// 9:16 mobile — so each tabbed section just swaps which grid is
// showing. On load we guess a sensible default from the screen
// width (roughly: is this a phone or a desktop?), but that's only
// ever used to set the INITIAL tab — once a visitor clicks a tab
// themselves, their choice is never overridden automatically again.
const PANEL_FADE_MS = 250;

function setActivePanel(group, key, format) {
  const buttons = group.querySelectorAll('.format-tab');
  buttons.forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.format === format);
  });

  // If this tab group has a "View all" link sitting next to it, point it
  // at whichever format is now active instead of always the desktop page.
  const titleActions = group.closest('.section-title-actions');
  const viewAllLink = titleActions ? titleActions.querySelector('[data-view-all]') : null;
  if (viewAllLink) {
    const href = format === 'desktop' ? viewAllLink.dataset.hrefDesktop : viewAllLink.dataset.hrefMobile;
    if (href) viewAllLink.setAttribute('href', href);
  }

  document.querySelectorAll(`[data-panel-group="${key}"]`).forEach((panel) => {
    const isMatch = panel.dataset.panel === `${key}-${format}`;
    if (isMatch) {
      panel.hidden = false;
      // Force layout so the browser registers the "hidden" starting
      // state before we flip to is-active — otherwise there's nothing
      // for the opacity transition to animate from.
      void panel.offsetWidth;
      panel.classList.add('is-active');
    } else if (panel.classList.contains('is-active')) {
      panel.classList.remove('is-active');
      window.setTimeout(() => {
        if (!panel.classList.contains('is-active')) panel.hidden = true;
      }, PANEL_FADE_MS);
    } else {
      panel.hidden = true;
    }
  });
}

const tabGroups = document.querySelectorAll('[data-tabs]');

// Initial default: desktop screens start on the Desktop tab, phones
// and narrow tablets start on the Mobile tab.
const initialFormat = window.innerWidth >= 900 ? 'desktop' : 'mobile';
tabGroups.forEach((group) => {
  setActivePanel(group, group.dataset.tabs, initialFormat);
});

// After that, tabs only ever respond to clicks — no resize listener,
// so a visitor's manual choice is never overridden mid-session.
tabGroups.forEach((group) => {
  const key = group.dataset.tabs;
  group.querySelectorAll('.format-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-active')) return;
      setActivePanel(group, key, btn.dataset.format);
    });
  });
});

// ==========================================================
// Category page — filter chips + sort dropdown (real filtering,
// not decorative). Selection is written to the URL as ?chip=&sort=
// so it's shareable and survives the back button.
// ==========================================================
const chipRow = document.getElementById('chip-row');
const wallpaperGrid = document.getElementById('wallpaper-grid');

if (chipRow && wallpaperGrid) {
  const sortSelect = document.getElementById('sort-select');
  const chipEmpty = document.getElementById('chip-empty');
  const chips = Array.from(chipRow.querySelectorAll('.chip'));
  const cards = Array.from(wallpaperGrid.querySelectorAll('.wallpaper-card'));

  function readFilterState() {
    const params = new URLSearchParams(window.location.search);
    return {
      chip: params.get('chip') || 'all',
      sort: params.get('sort') || 'latest',
    };
  }

  function writeFilterState(state, push) {
    const params = new URLSearchParams(window.location.search);
    if (state.chip && state.chip !== 'all') params.set('chip', state.chip);
    else params.delete('chip');
    if (state.sort && state.sort !== 'latest') params.set('sort', state.sort);
    else params.delete('sort');
    const query = params.toString();
    const url = window.location.pathname + (query ? `?${query}` : '');
    if (push) window.history.pushState(state, '', url);
    else window.history.replaceState(state, '', url);
  }

  function applyFilterState(state) {
    chips.forEach((chip) => {
      chip.classList.toggle('is-active', chip.dataset.chip === state.chip);
    });

    let visibleCount = 0;
    cards.forEach((card) => {
      const tags = (card.dataset.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
      const matches = state.chip === 'all' || card.dataset.subcategory === state.chip || tags.includes(state.chip);
      card.hidden = !matches;
      if (matches) visibleCount += 1;
    });
    if (chipEmpty) chipEmpty.hidden = visibleCount !== 0;

    // Sort by re-appending cards in the desired order — CSS grid follows
    // DOM order, so this is enough without touching layout markup.
    const ordered = cards.slice();
    if (state.sort === 'oldest') {
      ordered.sort((a, b) => new Date(a.dataset.date) - new Date(b.dataset.date));
    } else if (state.sort === 'random') {
      for (let i = ordered.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
      }
    } else {
      ordered.sort((a, b) => new Date(b.dataset.date) - new Date(a.dataset.date));
    }
    ordered.forEach((card) => wallpaperGrid.appendChild(card));
  }

  const initialFilterState = readFilterState();
  if (sortSelect) sortSelect.value = initialFilterState.sort;
  applyFilterState(initialFilterState);
  writeFilterState(initialFilterState, false);

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const state = readFilterState();
      state.chip = chip.dataset.chip;
      applyFilterState(state);
      writeFilterState(state, true);
    });
  });

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      const state = readFilterState();
      state.sort = sortSelect.value;
      applyFilterState(state);
      writeFilterState(state, true);
    });
  }

  window.addEventListener('popstate', () => {
    const state = readFilterState();
    if (sortSelect) sortSelect.value = state.sort;
    applyFilterState(state);
  });
}

// ==========================================================
// Shared card rendering — used by both the /search/ results page and
// the /favorites/ page (both render wallpaper cards client-side from a
// build-time JSON index) so there's one implementation of "wallpaper
// data object -> the same markup/classes as wallpaperCard in
// macros.njk" instead of two copies drifting apart.
// ==========================================================
const downloadIconSvg =
  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"></path><path d="M7 10l5 5 5-5"></path><path d="M4 19h16"></path></svg>';

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function mediaMarkup(src, alt, gradientClass, cssClass) {
  if (src) {
    return `<img class="${cssClass}" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='block';"><div class="${cssClass} ${gradientClass || 'grad-1'}" style="display:none;"></div>`;
  }
  return `<div class="${cssClass} ${gradientClass || 'grad-1'}"></div>`;
}

function renderWallpaperCard(item) {
  const ratio = item.category === 'desktop' ? 'ratio-16-9' : 'ratio-9-16';
  const tagLabel = item.subcategory ? item.subcategory.charAt(0).toUpperCase() + item.subcategory.slice(1) : '';
  // Cards show the thumbnail (falls back to the full image) — the full
  // image itself is only ever linked from the wallpaper's own download
  // button, not loaded into a grid tile.
  const cardSrc = item.thumbnail || item.image;
  return `<a href="${item.url}" class="wallpaper-card">
      <div class="thumb ${ratio}">
        ${mediaMarkup(cardSrc, item.title, item.gradientClass, 'thumb-bg')}
        <span class="tag">${escapeHtml(tagLabel)}</span>
        <span class="download-btn" aria-hidden="true">${downloadIconSvg}</span>
      </div>
      <div class="card-info">
        <h3 class="card-title">${escapeHtml(item.title)}</h3>
        <p class="card-res">${escapeHtml(item.resolution || '')}</p>
      </div>
    </a>`;
  }

function renderArticleCard(item) {
  return `<a href="${item.url}" class="article-card">
      <div class="thumb">${mediaMarkup(item.image, item.title, item.gradientClass, 'thumb-bg')}</div>
      <div class="card-info">
        <p class="card-eyebrow">${escapeHtml(item.category)}</p>
        <h3 class="card-title">${escapeHtml(item.title)}</h3>
        <p class="card-excerpt">${escapeHtml(item.excerpt || '')}</p>
      </div>
    </a>`;
}

// ==========================================================
// Search page — fetches the build-time /search-index.json and
// matches title / tags / category / subcategory for wallpapers,
// title / category / excerpt for articles.
// ==========================================================
const searchWallpapersEl = document.getElementById('search-results-wallpapers');

if (searchWallpapersEl) {
  const searchArticlesEl = document.getElementById('search-results-articles');
  const wallpapersSection = document.getElementById('search-wallpapers-section');
  const articlesSection = document.getElementById('search-articles-section');
  const emptyEl = document.getElementById('search-empty');
  const emptyTextEl = document.getElementById('search-empty-text');
  const heading = document.getElementById('search-heading');
  const subheading = document.getElementById('search-subheading');
  const pageInput = document.getElementById('search-page-input');

  function matchItem(item, needle) {
    const haystack = [item.title, item.category, item.subcategory, item.excerpt, ...(item.tags || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  }

  function runSearch(query) {
    const trimmed = (query || '').trim();
    if (pageInput) pageInput.value = trimmed;

    if (!trimmed) {
      if (heading) heading.textContent = 'Search wallpapers';
      if (subheading) subheading.textContent = 'Search by title, category, or tag.';
      wallpapersSection.hidden = true;
      articlesSection.hidden = true;
      emptyEl.hidden = true;
      return;
    }

    if (heading) heading.textContent = `Results for "${trimmed}"`;

    fetch('/search-index.json')
      .then((res) => res.json())
      .then((index) => {
        const needle = trimmed.toLowerCase();
        const matches = index.filter((item) => matchItem(item, needle));
        const wallpapers = matches.filter((item) => item.type === 'wallpaper');
        const articles = matches.filter((item) => item.type === 'article');

        if (matches.length === 0) {
          wallpapersSection.hidden = true;
          articlesSection.hidden = true;
          if (subheading) subheading.textContent = '';
          if (emptyTextEl) emptyTextEl.textContent = `No wallpapers found for "${trimmed}".`;
          emptyEl.hidden = false;
          return;
        }

        emptyEl.hidden = true;
        if (subheading) {
          const wallpaperCount = `${wallpapers.length} wallpaper${wallpapers.length === 1 ? '' : 's'}`;
          const articleCount = articles.length ? `, ${articles.length} article${articles.length === 1 ? '' : 's'}` : '';
          subheading.textContent = `${wallpaperCount}${articleCount} found.`;
        }

        if (wallpapers.length) {
          searchWallpapersEl.innerHTML = wallpapers.map(renderWallpaperCard).join('');
          wallpapersSection.hidden = false;
        } else {
          wallpapersSection.hidden = true;
        }

        if (articles.length) {
          searchArticlesEl.innerHTML = articles.map(renderArticleCard).join('');
          articlesSection.hidden = false;
        } else {
          articlesSection.hidden = true;
        }
      });
  }

  runSearch(new URLSearchParams(window.location.search).get('q'));
}

// ==========================================================
// Favorites — localStorage-only, no account (matches the site's
// "no signup" positioning). The heart button on wallpaper.njk toggles
// ids in this same key; the /favorites/ page cross-references those
// ids against the build-time /wallpapers-index.json and renders
// matches with the same renderWallpaperCard used above, so results
// look identical to every other wallpaper grid on the site.
// ==========================================================
const FAVORITES_KEY = 'walldrop_favorites';

function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    // localStorage disabled/unavailable — treat as "nothing saved" rather
    // than let the button or page break.
    return [];
  }
}

function setFavorites(ids) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch (err) {
    // Same as above — fail silently, the heart just won't persist.
  }
}

// Heart/save button on the wallpaper detail page.
const saveBtn = document.getElementById('save-btn');

if (saveBtn) {
  const wallpaperId = saveBtn.dataset.wallpaperId;

  function applySavedState(isSaved) {
    saveBtn.classList.toggle('is-saved', isSaved);
    saveBtn.setAttribute('aria-pressed', String(isSaved));
    saveBtn.setAttribute('aria-label', isSaved ? 'Remove from favorites' : 'Save to favorites');
  }

  applySavedState(getFavorites().includes(wallpaperId));

  saveBtn.addEventListener('click', () => {
    const favorites = getFavorites();
    const existingIndex = favorites.indexOf(wallpaperId);
    if (existingIndex === -1) {
      favorites.push(wallpaperId);
    } else {
      favorites.splice(existingIndex, 1);
    }
    setFavorites(favorites);
    applySavedState(existingIndex === -1);
  });
}

// The /favorites/ listing page itself.
const favoritesGrid = document.getElementById('favorites-grid');

if (favoritesGrid) {
  const favoritesEmpty = document.getElementById('favorites-empty');
  const savedIds = getFavorites();

  if (savedIds.length === 0) {
    favoritesEmpty.hidden = false;
  } else {
    fetch('/wallpapers-index.json')
      .then((res) => res.json())
      .then((index) => {
        const bySlug = new Map(index.map((w) => [w.slug, w]));
        // A saved id that no longer exists (e.g. deleted from the CMS
        // since it was saved) is skipped silently rather than rendering
        // a broken card.
        const matches = savedIds.map((id) => bySlug.get(id)).filter(Boolean);
        if (matches.length === 0) {
          favoritesEmpty.hidden = false;
          return;
        }
        favoritesGrid.innerHTML = matches.map(renderWallpaperCard).join('');
      })
      .catch(() => {
        favoritesEmpty.hidden = false;
      });
  }
}
