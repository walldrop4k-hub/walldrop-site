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
  { threshold: 0.15 }
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
