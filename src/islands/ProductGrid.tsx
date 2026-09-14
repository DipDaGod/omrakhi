import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ProductView, GridLabels, SortLabels } from './types.ts';
import ProductCard from './ProductCard.tsx';
import DesignDrawer from './DesignDrawer.tsx';
import { useShortlist } from './useShortlist.ts';

/**
 * P3 — the category page's interactive layer.
 *
 * The full grid is already in the HTML, server-rendered by Astro; this island
 * takes over once it hydrates, so the page is complete, indexable and usable
 * with JS disabled or still loading. It hides the static grid on mount rather
 * than before, which is why there is no flash of an empty page.
 *
 * Filters are multi-select, instant, and synced to the URL, so a filtered view
 * is shareable and the back button behaves.
 */

type FacetKey = 'band' | 'colour' | 'pack';

const PARAM: Record<FacetKey, string> = { band: 'price', colour: 'colour', pack: 'pack' };

/**
 * Sort. 'default' is the catalogue's own order, which is curated rather than
 * arbitrary, so it stays the default and is never written to the URL.
 */
const SORTS = ['default', 'newest', 'priceLow', 'priceHigh', 'code'] as const;
type SortKey = (typeof SORTS)[number];
const readSort = (v: string | null): SortKey =>
  (SORTS as readonly string[]).includes(v ?? '') ? (v as SortKey) : 'default';

/* Ties fall back to article number so a sort is never unstable between
   renders — two designs in the same band would otherwise swap places. */
const byCode = (a: ProductView, b: ProductView) => a.code.localeCompare(b.code);
const COMPARE: Record<Exclude<SortKey, 'default'>, (a: ProductView, b: ProductView) => number> = {
  newest: (a, b) => Number(b.isNew) - Number(a.isNew) || byCode(a, b),
  priceLow: (a, b) => a.bandValue - b.bandValue || byCode(a, b),
  priceHigh: (a, b) => b.bandValue - a.bandValue || byCode(a, b),
  code: byCode,
};

export default function ProductGrid({
  products,
  labels,
  sortLabels,
  categoryName,
  whatsappBase,
  colourLabels,
  packLabels,
}: {
  products: ProductView[];
  labels: GridLabels;
  sortLabels: SortLabels;
  categoryName: string;
  whatsappBase: string;
  colourLabels: Record<string, string>;
  packLabels: Record<string, string>;
}) {
  const [ready, setReady] = useState(false);
  const [filters, setFilters] = useState<Record<FacetKey, string[]>>({ band: [], colour: [], pack: [] });
  const [newOnly, setNewOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('default');
  const [open, setOpen] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const { count } = useShortlist();
  const first = useRef(true);

  /* Read the URL once, then own it. */
  useEffect(() => {
    const url = new URL(location.href);
    const read = (k: string) => (url.searchParams.get(k) ?? '').split(',').filter(Boolean);
    setFilters({ band: read(PARAM.band), colour: read(PARAM.colour), pack: read(PARAM.pack) });
    setNewOnly(url.searchParams.get('new') === '1');
    setQuery(url.searchParams.get('q') ?? '');
    setSort(readSort(url.searchParams.get('sort')));
    setOpen(url.searchParams.get('d'));
    setReady(true);
    document.querySelector<HTMLElement>('[data-static-grid]')?.setAttribute('hidden', '');

    const onPop = () => {
      const u = new URL(location.href);
      setOpen(u.searchParams.get('d'));
      setFilters({
        band: (u.searchParams.get(PARAM.band) ?? '').split(',').filter(Boolean),
        colour: (u.searchParams.get(PARAM.colour) ?? '').split(',').filter(Boolean),
        pack: (u.searchParams.get(PARAM.pack) ?? '').split(',').filter(Boolean),
      });
      setNewOnly(u.searchParams.get('new') === '1');
      setSort(readSort(u.searchParams.get('sort')));
    };
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);

  /* Write the URL back. Filters replace; opening a design pushes, so Back
     closes the drawer rather than leaving the page. */
  useEffect(() => {
    if (!ready) return;
    const url = new URL(location.href);
    const set = (k: string, v: string) => (v ? url.searchParams.set(k, v) : url.searchParams.delete(k));
    set(PARAM.band, filters.band.join(','));
    set(PARAM.colour, filters.colour.join(','));
    set(PARAM.pack, filters.pack.join(','));
    set('new', newOnly ? '1' : '');
    set('q', query.trim());
    set('sort', sort === 'default' ? '' : sort);
    set('d', open ?? '');
    const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : '');
    if (next === location.pathname + location.search) return;
    if (first.current) { first.current = false; history.replaceState(null, '', next); }
    else history[open ? 'pushState' : 'replaceState'](null, '', next);
  }, [ready, filters, newOnly, query, sort, open]);

  const facets = useMemo(() => {
    const tally = (get: (p: ProductView) => string) => {
      const m = new Map<string, number>();
      for (const p of products) m.set(get(p), (m.get(get(p)) ?? 0) + 1);
      return m;
    };
    return {
      band: tally((p) => String(p.bandValue)),
      colour: tally((p) => p.colourFamily),
      pack: tally((p) => p.packType),
    };
  }, [products]);

  const shown = useMemo(() => {
    const q = query.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const kept = products.filter((p) => {
      if (filters.band.length && !filters.band.includes(String(p.bandValue))) return false;
      if (filters.colour.length && !filters.colour.includes(p.colourFamily)) return false;
      if (filters.pack.length && !filters.pack.includes(p.packType)) return false;
      if (newOnly && !p.isNew) return false;
      if (q && !p.code.replace(/[^A-Z0-9]/g, '').includes(q) && !p.name.toUpperCase().includes(query.trim().toUpperCase())) return false;
      return true;
    });
    return sort === 'default' ? kept : [...kept].sort(COMPARE[sort]);
  }, [products, filters, newOnly, query, sort]);

  const facetCount = filters.band.length + filters.colour.length + filters.pack.length + (newOnly ? 1 : 0);
  /* The query counts. clearAll() resets it, so leaving it out hid the only
     control that undoes a search behind "no facets are selected". */
  const activeCount = facetCount + (query.trim() ? 1 : 0);

  const toggleFacet = useCallback((key: FacetKey, value: string) => {
    setFilters((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));
  }, []);

  const clearAll = () => { setFilters({ band: [], colour: [], pack: [] }); setNewOnly(false); setQuery(''); setSort('default'); };

  /* Prev/next respects the active filter, so stepping through a filtered set
     never jumps to items the buyer already excluded. */
  const index = open ? shown.findIndex((p) => p.code === open) : -1;
  const current = index >= 0 ? shown[index] : products.find((p) => p.code === open) ?? null;
  const step = useCallback((delta: number) => {
    const next = shown[index + delta];
    if (next) setOpen(next.code);
  }, [shown, index]);

  const chip = (key: FacetKey, value: string, label: string) => {
    const n = facets[key].get(value) ?? 0;
    if (!n) return null;
    const on = filters[key].includes(value);
    return (
      <button key={`${key}:${value}`} type="button" className={`chip${on ? ' is-on' : ''}`}
        aria-pressed={on} onClick={() => toggleFacet(key, value)}>
        {label} <span className="chip__n">{n}</span>
      </button>
    );
  };

  const filterUI = (
    <>
      <div className="fg">
        <span className="fg__label eyebrow">{labels.filterPrice}</span>
        <div className="fg__row">{['1', '2', '3', '4'].map((v) => chip('band', v, '₹'.repeat(Number(v))))}</div>
      </div>
      <div className="fg">
        <span className="fg__label eyebrow">{labels.filterColour}</span>
        <div className="fg__row">{Object.entries(colourLabels).map(([v, l]) => chip('colour', v, l))}</div>
      </div>
      <div className="fg">
        <span className="fg__label eyebrow">{labels.filterPack}</span>
        <div className="fg__row">
          {Object.entries(packLabels).map(([v, l]) => chip('pack', v, l))}
          <button type="button" className={`chip${newOnly ? ' is-on' : ''}`} aria-pressed={newOnly}
            onClick={() => setNewOnly((v) => !v)}>{labels.newOnly}</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="pg__bar">
        <div className="pg__filters">{filterUI}</div>

        <button className="btn btn--quiet pg__sheetbtn" type="button" onClick={() => setSheet(true)}>
          {labels.filter}{facetCount ? ` (${facetCount})` : ''}
        </button>

        <label className="pg__sort">
          <span className="visually-hidden">{labels.sort}</span>
          <select value={sort} onChange={(e) => setSort(readSort(e.target.value))}>
            {SORTS.map((k) => <option key={k} value={k}>{sortLabels[k]}</option>)}
          </select>
        </label>

        {/* In-category search. A dealer who wrote "OM-24" in his notebook at
            your counter should find it in three keystrokes. */}
        <label className="pg__search">
          <span className="visually-hidden">{labels.inCategory}</span>
          <input type="search" value={query} inputMode="search" autoComplete="off"
            placeholder={labels.inCategory} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>

      {activeCount > 0 && (
        <p className="pg__count" aria-live="polite">
          {shown.length} {shown.length === 1 ? labels.design : labels.designs}
          {' · '}
          <button type="button" className="pg__clear" onClick={clearAll}>{labels.clearFilters}</button>
        </p>
      )}

      {shown.length === 0 ? (
        <div className="pg__empty">
          <p><strong>{labels.noResults}</strong></p>
          <p>{labels.noResultsHelp}</p>
          <button className="btn btn--secondary" type="button" onClick={clearAll}>{labels.clearFilters}</button>
        </div>
      ) : (
        <div className="grid" data-count={shown.length < 8 ? 'few' : 'many'}>
          {shown.map((p, i) => (
            <ProductCard key={p.code} p={p} labels={labels} eager={i < 4} onOpen={setOpen} />
          ))}
        </div>
      )}

      {sheet && (
        <div className="sheet" role="dialog" aria-modal="true" aria-label={labels.filter}>
          <div className="sheet__scrim" onClick={() => setSheet(false)} />
          <div className="sheet__panel">
            <header className="sheet__head">
              <strong>{labels.filter}</strong>
              <button type="button" onClick={() => setSheet(false)} aria-label={labels.close}>&times;</button>
            </header>
            <div className="sheet__body">{filterUI}</div>
            <footer className="sheet__foot">
              <button className="btn btn--quiet" type="button" onClick={clearAll}>{labels.clearFilters}</button>
              <button className="btn btn--primary" type="button" onClick={() => setSheet(false)}>
                {labels.apply} ({shown.length})
              </button>
            </footer>
          </div>
        </div>
      )}

      {count > 0 && (
        <div className="stickybar">
          <span>{count} {labels.shortlistCount}</span>
          <a className="btn btn--primary" href={labels.shortlistHref}>{labels.reviewShortlist}</a>
        </div>
      )}

      {current && (
        <DesignDrawer
          product={current}
          labels={labels}
          categoryName={categoryName}
          whatsappBase={whatsappBase}
          onClose={() => setOpen(null)}
          onStep={step}
          hasPrev={index > 0}
          hasNext={index >= 0 && index < shown.length - 1}
        />
      )}
    </>
  );
}
