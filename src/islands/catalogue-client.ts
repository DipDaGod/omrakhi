/** Shared client-side access to /catalogue.json. Fetched once per page load. */

export type Row = {
  c: string; g: string; ne: string; nh: string;
  m: string[]; co: string[]; cf: string; b: number; q: number;
  pk: [number, number, number]; pt: string; s: number; n: boolean; t: string;
};
export type Cat = { g: string; ne: string; nh: string; n: number };
export type Retired = { c: string; g: string };
export type Catalogue = { products: Row[]; categories: Cat[]; retired: Retired[] };

let pending: Promise<Catalogue> | null = null;

export function loadCatalogue(): Promise<Catalogue> {
  if (!pending) {
    pending = fetch('/catalogue.json')
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<Catalogue>;
      })
      .catch((err) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}

export function locale(): 'en' | 'hi' {
  return document.documentElement.lang.startsWith('hi') ? 'hi' : 'en';
}

export function name(row: Row): string {
  return locale() === 'hi' ? row.nh : row.ne;
}

export function catName(cat: Cat): string {
  return locale() === 'hi' ? cat.nh : cat.ne;
}

/** Locale-aware href, matching src/lib/routes.ts. */
export function href(path: string): string {
  const prefix = locale() === 'hi' ? '/hi' : '';
  return prefix + path;
}

export function band(n: number): string {
  return '₹'.repeat(Math.max(1, Math.min(4, n)));
}

export function designHref(row: Row): string {
  return `${href('/collections/' + row.g)}?d=${row.c}`;
}
