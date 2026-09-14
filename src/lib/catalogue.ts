import { getCollection, getEntry } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { productImage } from './images.ts';

/**
 * The one place the catalogue is read. Every page goes through here so that
 * "a design with no photograph is not in the catalogue" is enforced once
 * rather than remembered on fourteen pages.
 */

export type Product = CollectionEntry<'products'>;
export type Category = CollectionEntry<'categories'>;

let warned = false;

export async function allProducts(): Promise<Product[]> {
  const raw = await getCollection('products');
  const kept: Product[] = [];
  const dropped: string[] = [];
  for (const p of raw) {
    if (!p.data.available) continue;
    if (!productImage(p.data.id, p.data.category.id)) {
      dropped.push(p.data.id);
      continue;
    }
    kept.push(p);
  }
  if (dropped.length && !warned) {
    warned = true;
    console.warn(
      `\n  ⚠ ${dropped.length} article(s) excluded from the build: no photograph.\n` +
        `    ${dropped.slice(0, 12).join(', ')}${dropped.length > 12 ? '…' : ''}\n`,
    );
  }
  return kept;
}

/** Retired articles are kept so /shortlist and /404 can answer an old link. */
export async function retiredProduct(code: string): Promise<Product | undefined> {
  const all = await getCollection('products');
  return all.find((p) => p.data.id === code && !p.data.available);
}

export async function productsInCategory(slug: string): Promise<Product[]> {
  const all = await allProducts();
  return all
    .filter((p) => p.data.category.id === slug)
    .sort((a, b) => b.data.priority - a.data.priority || a.data.id.localeCompare(b.data.id));
}

/** Fixed order, set in data by business priority. There is no "sort by". */
export async function allCategories(): Promise<Category[]> {
  const cats = await getCollection('categories');
  return cats.sort((a, b) => a.data.order - b.data.order);
}

export async function categoryCounts(): Promise<Map<string, number>> {
  const all = await allProducts();
  const counts = new Map<string, number>();
  for (const p of all) counts.set(p.data.category.id, (counts.get(p.data.category.id) ?? 0) + 1);
  return counts;
}

/** Categories that would render an embarrassing count are labelled, not hidden. */
export const LIMITED_RANGE_THRESHOLD = 8;

export async function categoryWithCount(slug: string) {
  const category = await getEntry('categories', slug);
  if (!category) throw new Error(`Unknown category: ${slug}`);
  const products = await productsInCategory(slug);
  return { category, products, count: products.length };
}

/** P1 §5 — falls back to highest-priority designs rather than a short, sad row. */
export async function seasonHighlights(limit = 10): Promise<Product[]> {
  const all = await allProducts();
  const isNew = all.filter((p) => p.data.new);
  const pool = isNew.length >= 6 ? isNew : all;
  return [...pool].sort((a, b) => b.data.priority - a.data.priority).slice(0, limit);
}

export function totalPriceBand(products: Product[]): { from: number; to: number } | null {
  if (!products.length) return null;
  return {
    from: Math.min(...products.map((p) => p.data.priceBand)),
    to: Math.max(...products.map((p) => p.data.priceBand)),
  };
}
