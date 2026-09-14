import type { ImageMetadata } from 'astro';
import lqipMap from '../data/lqip.json';

/**
 * A10 — resolving a photograph for an article number.
 *
 * A real photograph (<ARTICLE>.jpg) always wins over a generated stand-in
 * (<ARTICLE>.placeholder.jpg), so replacing a stand-in is a file drop with no
 * code change. A product with neither is excluded from the build with a
 * warning (P3 edge states) — a catalogue card with no photograph is worse than
 * no card.
 */

const products = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/products/**/*.{jpg,jpeg,png,webp}',
  { eager: true },
);

const site = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/site/*.{jpg,jpeg,png,webp}',
  { eager: true },
);

function lookup(
  map: Record<string, { default: ImageMetadata }>,
  dir: string,
  base: string,
): ImageMetadata | null {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const real = map[`${dir}/${base}.${ext}`];
    if (real) return real.default;
  }
  const stand = map[`${dir}/${base.replace(/(-detail)?$/, '')}.placeholder${base.endsWith('-detail') ? '-detail' : ''}.jpg`];
  return stand ? stand.default : null;
}

export function productImage(code: string, category: string): ImageMetadata | null {
  return lookup(products, `../assets/products/${category}`, code);
}

export function productDetailImage(code: string, category: string): ImageMetadata | null {
  return lookup(products, `../assets/products/${category}`, `${code}-detail`);
}

export function siteImage(name: string): ImageMetadata | null {
  return lookup(site, '../assets/site', name);
}

/** True when the file backing this slot is a generated stand-in. */
export function isStandIn(img: ImageMetadata | null): boolean {
  return !!img && /\.placeholder/.test(img.src);
}

/** Inlined 20px blur, so nothing on the page shifts while photographs load. */
export function lqip(code: string): string | undefined {
  return (lqipMap as Record<string, string>)[code];
}

/**
 * Public delivery is capped at 1400px (README §11.2): enough to judge a piece,
 * weak as a manufacturing reference.
 */
export const MAX_DELIVERED_WIDTH = 1400;
export const GRID_WIDTHS = [320, 480, 768] as const;
export const DRAWER_WIDTHS = [480, 768, 1200, MAX_DELIVERED_WIDTH] as const;
