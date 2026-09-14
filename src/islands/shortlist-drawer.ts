/**
 * A4 — the global shortlist drawer, opened from the header counter.
 *
 * Deliberately a glance, not a workspace: the list, quantities, and a link
 * through to /shortlist where the enquiry is actually composed.
 */
import { subscribe, getSnapshot, remove, setQty, type ShortlistItem } from './shortlist-store.ts';
import { loadCatalogue, name, band, href, locale, type Row } from './catalogue-client.ts';
import { openOverlay, el, escapeHtml } from './overlay.ts';

const T = {
  en: { title: 'Your shortlist', review: 'Review shortlist', empty: 'Nothing shortlisted yet.', remove: 'Remove', qty: 'Quantity', close: 'Close', pcs: 'pcs', gone: 'No longer available' },
  hi: { title: 'आपकी शॉर्टलिस्ट', review: 'शॉर्टलिस्ट देखें', empty: 'अभी कुछ शॉर्टलिस्ट नहीं है।', remove: 'हटाएँ', qty: 'मात्रा', close: 'बंद करें', pcs: 'पीस', gone: 'अब उपलब्ध नहीं' },
};

export async function open() {
  const L = locale();
  const t = T[L];

  const root = el('div', { class: 'sd', role: 'dialog', 'aria-modal': 'true', 'aria-label': t.title });
  root.innerHTML = `
    <div class="sd__scrim" data-overlay-dismiss></div>
    <aside class="sd__panel">
      <header class="sd__head">
        <h2 class="sd__title">${escapeHtml(t.title)}</h2>
        <button class="sd__close" type="button" data-close aria-label="${escapeHtml(t.close)}">&times;</button>
      </header>
      <div class="sd__list"></div>
      <footer class="sd__foot">
        <a class="btn btn--primary btn--block" href="${href('/shortlist')}">${escapeHtml(t.review)}</a>
      </footer>
    </aside>`;

  const overlay = openOverlay(root);
  root.querySelector('[data-close]')!.addEventListener('click', () => overlay.close());

  const list = root.querySelector<HTMLElement>('.sd__list')!;
  let byCode = new Map<string, Row>();

  const render = () => {
    const items = getSnapshot();
    if (!items.length) {
      list.innerHTML = `<p class="sd__empty">${escapeHtml(t.empty)}</p>`;
      return;
    }
    list.innerHTML = items.map((i: ShortlistItem) => {
      const row = byCode.get(i.code);
      if (!row) {
        return `<div class="sd__row sd__row--gone">
          <span class="sd__body"><span class="code">${escapeHtml(i.code)}</span>
          <span class="sd__meta">${escapeHtml(t.gone)}</span></span>
          <button class="sd__x" type="button" data-remove="${escapeHtml(i.code)}" aria-label="${escapeHtml(t.remove)} ${escapeHtml(i.code)}">&times;</button>
        </div>`;
      }
      return `<div class="sd__row">
        <img class="sd__img" src="${row.t}" width="56" height="56" alt="" loading="lazy" />
        <span class="sd__body">
          <span class="code sd__code">${escapeHtml(row.c)}</span>
          <span class="sd__meta">${escapeHtml(name(row))} · ${band(row.b)}</span>
        </span>
        <label class="sd__qty">
          <span class="visually-hidden">${escapeHtml(t.qty)} ${escapeHtml(row.c)}</span>
          <input type="number" min="1" step="1" value="${i.qty}" data-qty="${escapeHtml(i.code)}" inputmode="numeric" />
        </label>
        <button class="sd__x" type="button" data-remove="${escapeHtml(row.c)}" aria-label="${escapeHtml(t.remove)} ${escapeHtml(row.c)}">&times;</button>
      </div>`;
    }).join('');
  };

  render();
  const unsubscribe = subscribe(render);
  root.addEventListener('click', (e) => {
    const code = (e.target as HTMLElement).dataset.remove;
    if (code) remove(code);
  });
  list.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.dataset.qty) setQty(target.dataset.qty, parseInt(target.value, 10));
  });
  root.addEventListener('overlay:closed', () => unsubscribe());

  try {
    const cat = await loadCatalogue();
    byCode = new Map(cat.products.map((r) => [r.c, r]));
    render();
  } catch {
    /* Codes and quantities still render without the catalogue. */
  }
}
