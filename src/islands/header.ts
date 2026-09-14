/**
 * Header behaviour. Plain TypeScript, not a React island.
 *
 * The home page's JS budget is 40KB gzipped (A9) and has no interactivity
 * beyond these controls. Hydrating React to run a counter, a slim-bar class
 * and a menu toggle would spend the entire budget on furniture, so these are
 * written against the DOM directly. React is reserved for the page-level
 * islands that genuinely need it: the grid, the drawer and the forms.
 */
import { subscribe, getSnapshot } from './shortlist-store.ts';

/* --- Slim bar after 200px -------------------------------------------------- */
const header = document.querySelector<HTMLElement>('[data-header]');
if (header) {
  let slim = false;
  const onScroll = () => {
    const should = window.scrollY > 200;
    if (should === slim) return;
    slim = should;
    header.toggleAttribute('data-slim', slim);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* --- Shortlist counter ----------------------------------------------------- */
const countBtn = document.querySelector<HTMLElement>('[data-shortlist-open]');
const countEl = document.querySelector<HTMLElement>('[data-shortlist-count]');
if (countBtn && countEl) {
  const render = () => {
    const n = getSnapshot().length;
    countEl.textContent = String(n);
    countBtn.hidden = n === 0;
  };
  subscribe(render);
  render();
}

/* --- Mobile menu: full-screen overlay, focus-trapped ----------------------- */
const menu = document.querySelector<HTMLElement>('#mobile-menu');
const menuOpen = document.querySelector<HTMLElement>('[data-menu-open]');
const menuClose = document.querySelector<HTMLElement>('[data-menu-close]');

function focusables(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea'),
  ).filter((el) => el.offsetParent !== null);
}

if (menu && menuOpen && menuClose) {
  /* Matches --dur-base. The menu is toggled through the hidden attribute
     rather than mounted, so closing has to hold the element for the length of
     the exit and only then hide it. */
  const EXIT_MS = 240;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer = 0;

  const close = () => {
    menu.classList.remove('is-in');
    document.documentElement.style.removeProperty('overflow');
    menuOpen.setAttribute('aria-expanded', 'false');
    menuOpen.focus();
    clearTimeout(timer);
    if (reduced()) menu.hidden = true;
    else timer = window.setTimeout(() => { menu.hidden = true; }, EXIT_MS);
  };
  menuOpen.addEventListener('click', () => {
    clearTimeout(timer);
    menu.hidden = false;
    document.documentElement.style.setProperty('overflow', 'hidden');
    menuOpen.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => menu.classList.add('is-in'));
    focusables(menu)[0]?.focus();
  });
  menuClose.addEventListener('click', close);
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return close();
    if (e.key !== 'Tab') return;
    const items = focusables(menu);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}

/* --- Search overlay: code-split, loaded on first open ---------------------- */
/* Most visitors never search on a sixty-item site, so nothing search-related
   is downloaded until someone asks for it. */
let searchLoading: Promise<{ open: (initial?: string) => void }> | null = null;
export function loadSearch() {
  if (!searchLoading) searchLoading = import('./search-overlay.ts').then((m) => ({ open: m.open }));
  return searchLoading;
}
for (const trigger of document.querySelectorAll<HTMLElement>('[data-search-open]')) {
  trigger.addEventListener('click', () => void loadSearch().then((m) => m.open()));
  trigger.addEventListener('pointerenter', () => void loadSearch(), { once: true });
}
addEventListener('keydown', (e) => {
  const target = e.target as HTMLElement | null;
  const typing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
  if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    void loadSearch().then((m) => m.open());
  }
});

/* --- Shortlist drawer: also code-split ------------------------------------- */
let drawerLoading: Promise<{ open: () => void }> | null = null;
for (const trigger of document.querySelectorAll<HTMLElement>('[data-shortlist-open]')) {
  trigger.addEventListener('click', () => {
    if (!drawerLoading) drawerLoading = import('./shortlist-drawer.ts').then((m) => ({ open: m.open }));
    void drawerLoading.then((m) => m.open());
  });
}
