/**
 * A4 — the shortlist.
 *
 * Implemented as a plain module-level store rather than a React provider.
 * Astro islands do not share a React tree, so a provider could not reach the
 * header counter, the grid cards, the drawer and the sticky bar at once — but
 * they do share this module. Each island subscribes as a leaf, which is what
 * the "an island is a leaf" rule in PART C actually requires.
 *
 * Storage is localStorage, key versioned so a schema change cannot crash a
 * returning visitor. No account, no sync, no backend.
 */

export const STORAGE_KEY = 'orru:shortlist:v1';
/** Past about forty designs a WhatsApp message stops being readable. */
export const SOFT_CAP = 40;

export type ShortlistItem = { code: string; qty: number };

let items: ShortlistItem[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function read(): ShortlistItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i) => i && typeof i.code === 'string')
      .map((i) => ({ code: i.code, qty: Number.isFinite(i.qty) && i.qty > 0 ? Math.floor(i.qty) : 1 }));
  } catch {
    // A corrupted or unreadable store is an empty store, never a crash.
    return [];
  }
}

function write() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* Private mode, or quota. The list still works for this session. */
  }
}

function emit() {
  for (const l of listeners) l();
}

/** Called once by whichever island mounts first. */
export function hydrate() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  items = read();
  // Another tab changing the list should be reflected here.
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    items = read();
    emit();
  });
  emit();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  hydrate();
  return () => listeners.delete(listener);
}

export function getSnapshot(): ShortlistItem[] {
  return items;
}

export function getServerSnapshot(): ShortlistItem[] {
  return EMPTY;
}
const EMPTY: ShortlistItem[] = [];

export function isHydrated() {
  return hydrated;
}

export function has(code: string): boolean {
  return items.some((i) => i.code === code);
}

export function add(code: string, qty: number) {
  if (has(code)) return;
  items = [...items, { code, qty: Math.max(1, Math.floor(qty) || 1) }];
  write();
  emit();
}

export function remove(code: string) {
  items = items.filter((i) => i.code !== code);
  write();
  emit();
}

export function toggle(code: string, qty: number): boolean {
  const nowIn = !has(code);
  nowIn ? add(code, qty) : remove(code);
  return nowIn;
}

export function setQty(code: string, qty: number) {
  const n = Math.max(1, Math.floor(qty) || 1);
  items = items.map((i) => (i.code === code ? { ...i, qty: n } : i));
  write();
  emit();
}

export function clear() {
  items = [];
  write();
  emit();
}

export function mergeIn(incoming: ShortlistItem[]) {
  const seen = new Set(items.map((i) => i.code));
  items = [...items, ...incoming.filter((i) => !seen.has(i.code))];
  write();
  emit();
}

/* --- Shareable URL: /shortlist?i=OM2418x100,OM3302x50 --------------------- */

export function encodeItems(list: ShortlistItem[]): string {
  return list.map((i) => `${i.code.replace(/-/g, '')}x${i.qty}`).join(',');
}

export function decodeItems(param: string): ShortlistItem[] {
  return param
    .split(',')
    .map((chunk) => {
      const m = /^([A-Za-z]{2})(\d{4})x(\d+)$/.exec(chunk.trim());
      if (!m) return null;
      return { code: `${m[1].toUpperCase()}-${m[2]}`, qty: Math.max(1, parseInt(m[3], 10)) };
    })
    .filter((i): i is ShortlistItem => i !== null);
}
