import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { getCollection } from 'astro:content';
import { allCategories, allProducts, categoryCounts } from '../lib/catalogue.ts';
import { productImage } from '../lib/images.ts';

/**
 * The client-side catalogue. One file, both languages, fetched on demand by
 * the search overlay, the shortlist drawer and the shortlist page.
 *
 * It is fetched rather than bundled deliberately: 250 articles of metadata
 * would otherwise sit inside every page's JS and count against the A9 budget,
 * on pages where most visitors never open search at all.
 */
export const GET: APIRoute = async () => {
  const [products, categories, counts] = await Promise.all([
    allProducts(),
    allCategories(),
    categoryCounts(),
  ]);

  const rows = await Promise.all(
    products.map(async (p) => {
      const src = productImage(p.data.id, p.data.category.id)!;
      const thumb = await getImage({ src, width: 320, height: 320, fit: 'cover', format: 'webp' });
      return {
        c: p.data.id,
        g: p.data.category.id,
        ne: p.data.name.en,
        nh: p.data.name.hi,
        m: p.data.materials,
        co: p.data.colours,
        cf: p.data.colourFamily,
        b: p.data.priceBand,
        q: p.data.moq,
        pk: [p.data.pack.perCard, p.data.pack.perBox, p.data.pack.perCarton],
        pt: p.data.packType,
        s: p.data.sizeMm,
        n: p.data.new,
        t: thumb.src,
      };
    }),
  );

  return new Response(
    JSON.stringify({
      products: rows,
      categories: categories.map((c) => ({
        g: c.id,
        ne: c.data.name.en,
        nh: c.data.name.hi,
        n: counts.get(c.id) ?? 0,
      })),
      /* Retired articles, so an old WhatsApp link to ?d=OM-1140 can be
         answered specifically rather than with a bare 404 (P18). */
      retired: (await getCollection('products'))
        .filter((p) => !p.data.available)
        .map((p) => ({ c: p.data.id, g: p.data.category.id })),
    }),
    { headers: { 'content-type': 'application/json; charset=utf-8' } },
  );
};
