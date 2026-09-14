/**
 * A5 — the search overlay. Code-split; this module is not downloaded until
 * someone actually opens search.
 *
 * The rule that matters here: article-number search is exact-first. A dealer
 * typing OM-24 is looking for a specific piece he saw in a sample box, and
 * fuzzy-matching a code is actively unhelpful. Exact and prefix matches rank
 * above everything; fuzzy results appear below a separator.
 */
import Fuse from 'fuse.js';
import { loadCatalogue, name, catName, band, designHref, href, locale, type Row, type Catalogue } from './catalogue-client.ts';
import { openOverlay, el, escapeHtml } from './overlay.ts';

const T = {
  en: { title: 'Search', placeholder: 'Article number, category or material', hint: 'Most looked at', fuzzy: 'Other close matches', none: 'Nothing matched that.', results: 'results', close: 'Close' },
  hi: { title: 'खोजें', placeholder: 'आर्टिकल नंबर, श्रेणी या सामग्री', hint: 'सबसे ज़्यादा देखे गए', fuzzy: 'मिलते-जुलते अन्य', none: 'कुछ नहीं मिला।', results: 'परिणाम', close: 'बंद करें' },
};

let fuse: Fuse<Row> | null = null;
let data: Catalogue | null = null;

function normaliseCode(q: string) {
  return q.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function codeMatches(rows: Row[], q: string): Row[] {
  const n = normaliseCode(q);
  if (n.length < 2) return [];
  const exact: Row[] = [];
  const prefix: Row[] = [];
  for (const r of rows) {
    const flat = normaliseCode(r.c);
    if (flat === n) exact.push(r);
    else if (flat.startsWith(n) || flat.replace(/^OM/, '').startsWith(n.replace(/^OM/, ''))) prefix.push(r);
  }
  return [...exact, ...prefix];
}

function card(row: Row): string {
  const cat = data?.categories.find((c) => c.g === row.g);
  return `<a class="sr" href="${designHref(row)}">
    <img class="sr__img" src="${row.t}" width="72" height="72" alt="" loading="lazy" />
    <span class="sr__body">
      <span class="sr__code code">${escapeHtml(row.c)}</span>
      <span class="sr__name">${escapeHtml(name(row))}</span>
      <span class="sr__meta">${cat ? escapeHtml(catName(cat)) : ''} · ${band(row.b)}</span>
    </span>
  </a>`;
}

export async function open(initial = '') {
  const L = locale();
  const t = T[L];

  const root = el('div', { class: 'so', role: 'dialog', 'aria-modal': 'true', 'aria-label': t.title });
  root.innerHTML = `
    <div class="so__scrim" data-overlay-dismiss></div>
    <div class="so__panel">
      <div class="so__head">
        <input class="so__input" type="search" autocomplete="off" spellcheck="false"
               placeholder="${escapeHtml(t.placeholder)}" aria-label="${escapeHtml(t.title)}" />
        <button class="so__close" type="button" data-close aria-label="${escapeHtml(t.close)}">&times;</button>
      </div>
      <div class="so__results" aria-live="polite"></div>
    </div>`;

  const overlay = openOverlay(root);
  root.querySelector('[data-close]')!.addEventListener('click', () => overlay.close());

  const input = root.querySelector<HTMLInputElement>('.so__input')!;
  const out = root.querySelector<HTMLElement>('.so__results')!;

  try {
    data = await loadCatalogue();
  } catch {
    out.innerHTML = `<p class="so__note">${escapeHtml(t.none)}</p>`;
    return;
  }

  fuse = new Fuse(data.products, {
    keys: [
      { name: 'ne', weight: 3 },
      { name: 'nh', weight: 3 },
      { name: 'g', weight: 2 },
      { name: 'm', weight: 1 },
      { name: 'co', weight: 1 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
  });

  /* Empty state shows the largest categories, not a blank box. */
  const empty = [...data.categories].sort((a, b) => b.n - a.n).slice(0, 5);
  const renderEmpty = () => {
    out.innerHTML = `<p class="eyebrow so__label">${escapeHtml(t.hint)}</p>
      <ul class="so__cats">${empty
        .map((c) => `<li><a href="${href('/collections/' + c.g)}">${escapeHtml(catName(c))} <span class="so__n">${c.n}</span></a></li>`)
        .join('')}</ul>`;
  };
  renderEmpty();

  const render = (q: string) => {
    if (q.trim().length === 0) return renderEmpty();
    const rows = data!.products;
    const byCode = codeMatches(rows, q);
    const seen = new Set(byCode.map((r) => r.c));
    const fuzzy = fuse!.search(q).map((r) => r.item).filter((r) => !seen.has(r.c));

    if (!byCode.length && !fuzzy.length) {
      out.innerHTML = `<p class="so__note">${escapeHtml(t.none)}</p>`;
      return;
    }
    const parts: string[] = [];
    if (byCode.length) parts.push(byCode.slice(0, 12).map(card).join(''));
    if (fuzzy.length) {
      if (byCode.length) parts.push(`<p class="eyebrow so__label so__sep">${escapeHtml(t.fuzzy)}</p>`);
      parts.push(fuzzy.slice(0, 20).map(card).join(''));
    }
    out.innerHTML = parts.join('');
  };

  let frame = 0;
  input.addEventListener('input', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => render(input.value));
  });
  /* Carried in from a page that had its own field — the 404's, so far. The
     caret goes to the end rather than selecting, because the visitor is
     mid-word and the next keystroke should extend it, not replace it. */
  if (initial) {
    input.value = initial;
    render(initial);
  }
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}
