// WallDrop — mobile menu toggle

const hamburgerBtn = document.getElementById('hamburger-btn');
const mainNav = document.getElementById('main-nav');

hamburgerBtn.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('is-open');
  hamburgerBtn.classList.toggle('is-active', isOpen);
  hamburgerBtn.setAttribute('aria-expanded', isOpen);
});

// On mobile, dropdowns open on hover normally, which doesn't work on
// touch screens. So on small screens we make the dropdown buttons
// toggle open/closed on tap instead.
const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

dropdownToggles.forEach((toggle) => {
  toggle.addEventListener('click', () => {
    if (window.innerWidth > 900) return; // desktop uses hover, skip
    const parent = toggle.closest('.has-dropdown');
    parent.classList.toggle('is-open');
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
