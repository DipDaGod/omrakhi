/**
 * P5 — /shortlist.
 *
 * Fully client-rendered: there is no server-side state to render. A skeleton
 * covers the localStorage read, or the page flashes empty on every load.
 *
 * Written as a plain module rather than a React island for the same reason as
 * the search overlay: the page's JS budget is 60KB gzipped (PART F) and the
 * React client runtime alone is most of that. Nothing here needs a framework —
 * it is a list, three quantity inputs and three export buttons.
 */
import {
  subscribe, getSnapshot, remove, setQty, clear, mergeIn, decodeItems, encodeItems,
  SOFT_CAP, type ShortlistItem,
} from './shortlist-store.ts';
import { loadCatalogue, name, band, href, locale, type Row } from './catalogue-client.ts';
import { escapeHtml } from './overlay.ts';

const root = document.querySelector<HTMLElement>('[data-shortlist-page]');

if (root) {
  const page = root;
  const L = locale();
  const T = JSON.parse(root.dataset.labels!) as Record<string, string>;
  const listEl = root.querySelector<HTMLElement>('[data-list]')!;
  const emptyEl = root.querySelector<HTMLElement>('[data-empty]')!;
  const filledEl = root.querySelector<HTMLElement>('[data-filled]')!;
  const skeleton = root.querySelector<HTMLElement>('[data-skeleton]')!;
  const countEl = root.querySelector<HTMLElement>('[data-count]')!;
  const capEl = root.querySelector<HTMLElement>('[data-cap]')!;
  const sharedEl = root.querySelector<HTMLElement>('[data-shared]')!;
  const waBtn = root.querySelector<HTMLAnchorElement>('[data-wa]')!;
  const pdfBtn = root.querySelector<HTMLButtonElement>('[data-pdf]')!;
  const copyBtn = root.querySelector<HTMLButtonElement>('[data-copy]')!;
  const clearBtn = root.querySelector<HTMLButtonElement>('[data-clearall]')!;
  const whatsapp = root.dataset.whatsapp!;

  let byCode = new Map<string, Row>();
  let catNames = new Map<string, string>();
  let retired = new Set<string>();

  /* A shared link offers to merge, never silently overwrites the list the
     visitor already has. */
  const shared = new URLSearchParams(location.search).get('i');
  if (shared) {
    const incoming = decodeItems(shared);
    if (incoming.length) {
      sharedEl.hidden = false;
      sharedEl.querySelector('[data-shared-count]')!.textContent = String(incoming.length);
      sharedEl.querySelector('[data-shared-add]')!.addEventListener('click', () => {
        mergeIn(incoming);
        sharedEl.hidden = true;
        history.replaceState(null, '', location.pathname);
      });
      sharedEl.querySelector('[data-shared-ignore]')!.addEventListener('click', () => {
        sharedEl.hidden = true;
        history.replaceState(null, '', location.pathname);
      });
    }
  }

  function lines(items: ShortlistItem[]): string[] {
    return items.map((i) => {
      const row = byCode.get(i.code);
      return row ? `${i.code} — ${i.qty} ${T.pcs}` : `${i.code} — ${i.qty} ${T.pcs} (${T.gone})`;
    });
  }

  function messageText(items: ShortlistItem[]): string {
    return [`${T.enquiryHeading}`, ...lines(items), '', T.ratesPlease].join('\n');
  }

  function render() {
    const items = getSnapshot();
    skeleton.hidden = true;
    countEl.textContent = String(items.length);
    emptyEl.hidden = items.length > 0;
    filledEl.hidden = items.length === 0;
    capEl.hidden = items.length <= SOFT_CAP;

    listEl.innerHTML = items.map((i) => {
      const row = byCode.get(i.code);
      const gone = retired.has(i.code) || (byCode.size > 0 && !row);
      const thumb = row ? `<img class="sl__img" src="${row.t}" width="64" height="64" alt="" loading="lazy" />`
        : '<span class="sl__img sl__img--gone"></span>';
      const meta = gone
        ? `<span class="sl__gone">${escapeHtml(T.gone)}</span>`
        : `<span class="sl__meta">${row ? escapeHtml(catNames.get(row.g) ?? '') + ' · ' + band(row.b) : ''}</span>`;
      const link = row ? `${href('/collections/' + row.g)}?d=${row.c}` : '#';
      return `<li class="sl__row${gone ? ' sl__row--gone' : ''}">
        ${thumb}
        <span class="sl__body">
          <a class="code sl__code" href="${link}">${escapeHtml(i.code)}</a>
          <span class="sl__name">${row ? escapeHtml(name(row)) : ''}</span>
          ${meta}
        </span>
        <label class="sl__qty">
          <span class="visually-hidden">${escapeHtml(T.qty)} ${escapeHtml(i.code)}</span>
          <input type="number" min="1" step="1" inputmode="numeric" value="${i.qty}" data-qty="${escapeHtml(i.code)}" />
        </label>
        <button class="sl__x" type="button" data-remove="${escapeHtml(i.code)}" aria-label="${escapeHtml(T.remove)} ${escapeHtml(i.code)}">&times;</button>
      </li>`;
    }).join('');

    waBtn.href = `${whatsapp}?text=${encodeURIComponent(messageText(items))}`;
    /* The list encodes into the URL so a buyer can send the link to a partner. */
    const enc = encodeItems(items);
    const share = page.querySelector<HTMLButtonElement>('[data-share]');
    if (share) share.dataset.url = `${location.origin}${location.pathname}?i=${enc}`;
  }

  render();
  subscribe(render);

  listEl.addEventListener('click', (e) => {
    const code = (e.target as HTMLElement).dataset.remove;
    if (code) remove(code);
  });
  listEl.addEventListener('change', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.dataset.qty) setQty(el.dataset.qty, parseInt(el.value, 10));
  });

  /* Losing a twenty-item shortlist to a mistap is the one unrecoverable error
     on this site, so this is the only destructive action that confirms. */
  clearBtn.addEventListener('click', () => {
    if (confirm(T.confirmClear)) clear();
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(messageText(getSnapshot()));
      copyBtn.textContent = T.copied;
      setTimeout(() => (copyBtn.textContent = T.copyAsText), 1800);
    } catch { /* no clipboard permission */ }
  });

  const shareBtn = root.querySelector<HTMLButtonElement>('[data-share]');
  shareBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shareBtn.dataset.url ?? '');
      shareBtn.textContent = T.copied;
      setTimeout(() => (shareBtn.textContent = T.copyLink), 1800);
    } catch { /* no clipboard permission */ }
  });

  /* pdf-lib is large and most visitors never press this, so it is imported
     when the button is pressed and not before. */
  pdfBtn.addEventListener('click', async () => {
    const original = pdfBtn.textContent;
    pdfBtn.disabled = true;
    pdfBtn.textContent = T.building;
    try {
      const { buildShortlistPdf } = await import('./shortlist-pdf.ts');
      const bytes = await buildShortlistPdf(getSnapshot(), byCode, catNames, T);
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `om-rakhi-udyog-shortlist.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      alert(T.pdfFailed);
    } finally {
      pdfBtn.disabled = false;
      pdfBtn.textContent = original;
    }
  });

  loadCatalogue()
    .then((cat) => {
      byCode = new Map(cat.products.map((r) => [r.c, r]));
      catNames = new Map(cat.categories.map((c) => [c.g, L === 'hi' ? c.nh : c.ne]));
      /* An item that has left the catalogue is shown greyed and labelled,
         never silently dropped — a season rollover produces exactly this. */
      retired = new Set(getSnapshot().map((i) => i.code).filter((c) => !byCode.has(c)));
      render();
    })
    .catch(() => { /* codes and quantities still render */ });
}
