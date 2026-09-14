/**
 * P2 — the collections index filter.
 *
 * The grid is already in the HTML, one card per category; this only decides
 * which cards are shown. Written against the DOM rather than as a React island
 * because re-rendering twenty static cards in React would cost more bytes than
 * the entire page currently weighs.
 *
 * Filtering updates the URL, so a filtered view is shareable and the back
 * button behaves.
 */
const root = document.querySelector<HTMLElement>('[data-collections]');

if (root) {
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-facet]'));
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-card]'));
  const empty = root.querySelector<HTMLElement>('[data-empty]');
  const clear = root.querySelector<HTMLElement>('[data-clear]');
  const live = root.querySelector<HTMLElement>('[data-live]');

  const active = new Map<string, Set<string>>();

  const read = () => {
    const params = new URLSearchParams(location.search);
    active.clear();
    for (const key of ['material', 'for', 'price']) {
      const v = (params.get(key) ?? '').split(',').filter(Boolean);
      if (v.length) active.set(key, new Set(v));
    }
  };

  const write = () => {
    const params = new URLSearchParams(location.search);
    for (const key of ['material', 'for', 'price']) {
      const set = active.get(key);
      if (set && set.size) params.set(key, [...set].join(','));
      else params.delete(key);
    }
    const qs = params.toString();
    history.replaceState(null, '', location.pathname + (qs ? `?${qs}` : ''));
  };

  const matches = (card: HTMLElement) => {
    for (const [key, set] of active) {
      const values = (card.dataset[key === 'for' ? 'audience' : key] ?? '').split(' ');
      if (![...set].some((v) => values.includes(v))) return false;
    }
    return true;
  };

  const render = () => {
    let shown = 0;
    for (const card of cards) {
      const ok = matches(card);
      card.hidden = !ok;
      if (ok) shown++;
    }
    for (const chip of chips) {
      const on = active.get(chip.dataset.facet!)?.has(chip.dataset.value!) ?? false;
      chip.classList.toggle('is-on', on);
      chip.setAttribute('aria-pressed', String(on));
    }
    const any = [...active.values()].some((s) => s.size);
    if (empty) empty.hidden = shown > 0;
    if (clear) clear.hidden = !any;
    if (live) live.textContent = String(shown);
  };

  for (const chip of chips) {
    chip.addEventListener('click', () => {
      const key = chip.dataset.facet!;
      const value = chip.dataset.value!;
      const set = active.get(key) ?? new Set<string>();
      set.has(value) ? set.delete(value) : set.add(value);
      set.size ? active.set(key, set) : active.delete(key);
      write();
      render();
    });
  }

  clear?.addEventListener('click', () => {
    active.clear();
    write();
    render();
  });

  addEventListener('popstate', () => { read(); render(); });

  read();
  render();
}
