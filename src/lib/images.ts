import type { ImageMetadata } from 'astro';
import lqipMap from '../data/lqip.json';

/**
 * A10 — resolving a photograph for an article number.
 *
 * A real photograph (<ARTICLE>.jpg) always wins over a generated stand-in, so
 * replacing a stand-in is a file drop with no code change. A product with
 * neither is excluded from the build with a warning (P3 edge states) — a
 * catalogue card with no photograph is worse than no card.
 *
 * Stand-ins are SHARED: three files for the whole catalogue rather than one
 * per article. Astro optimises every distinct source file into a dozen
 * variants (three formats across four widths), so 336 per-article stand-ins
 * emitted close to 4,000 files and dominated the build. Three emit 36. The
 * file is picked by a hash of the article number so a grid still reads as a
 * range rather than one flat wall. Real photography is per-article and none of
 * this applies to it.
 */

const products = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/products/**/*.{jpg,jpeg,png,webp}',
  { eager: true },
);

const site = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/site/*.{jpg,jpeg,png,webp}',
  { eager: true },
);

function real(
  map: Record<string, { default: ImageMetadata }>,
  dir: string,
  base: string,
): ImageMetadata | null {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const hit = map[`${dir}/${base}.${ext}`];
    if (hit) return hit.default;
  }
  return null;
}

/** How many shared stand-ins exist. Must match scripts/prepare-images.mjs. */
const STAND_INS = 3;

/**
 * Which shared stand-in an article gets. Deterministic, so a given article
 * looks the same on every build and between the grid and the drawer.
 * Must match the identical function in scripts/prepare-images.mjs.
 */
export function standInIndex(code: string): number {
  let h = 0;
  for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return h % STAND_INS;
}

function standIn(code: string): ImageMetadata | null {
  const f = products[`../assets/products/_stand-in/${standInIndex(code)}.placeholder.jpg`];
  return f ? f.default : null;
}

export function productImage(code: string, category: string): ImageMetadata | null {
  return real(products, `../assets/products/${category}`, code) ?? standIn(code);
}

export function productDetailImage(code: string, category: string): ImageMetadata | null {
  return real(products, `../assets/products/${category}`, `${code}-detail`) ?? standIn(`${code}-detail`);
}

/* The eleven editorial photographs stay one stand-in each: they are different
   shapes carrying different pages, and eleven sources is not a build problem. */
export function siteImage(name: string): ImageMetadata | null {
  return real(site, '../assets/site', name) ?? site[`../assets/site/${name}.placeholder.jpg`]?.default ?? null;
}

/** True when the file backing this slot is a generated stand-in. */
export function isStandIn(img: ImageMetadata | null): boolean {
  return !!img && /\.placeholder/.test(img.src);
}

/** Inlined 20px blur, so nothing on the page shifts while photographs load. */
export function lqip(code: string): string | undefined {
  const m = lqipMap as Record<string, string>;
  return m[code] ?? m[`_stand-in-${standInIndex(code)}`];
}

/**
 * Public delivery is capped at 1400px (README §11.2): enough to judge a piece,
 * weak as a manufacturing reference.
 */
export const MAX_DELIVERED_WIDTH = 1400;
export const GRID_WIDTHS = [320, 480, 768] as const;
export const DRAWER_WIDTHS = [480, 768, 1200, MAX_DELIVERED_WIDTH] as const;
