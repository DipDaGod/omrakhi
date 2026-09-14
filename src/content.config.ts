import { defineCollection, reference, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

/** Price bands, not prices. Rates in this trade are negotiated. */
const priceBand = z.number().int().min(1).max(4);

const bilingual = (max?: number) =>
  z.object({
    en: max ? z.string().max(max) : z.string(),
    hi: max ? z.string().max(max) : z.string(),
  });

const material = z.enum([
  'thread', 'stone', 'metal', 'pearl', 'rudraksha', 'resin', 'terracotta', 'zari', 'wood',
]);

const audience = z.enum(['brother', 'bhaiya-bhabhi', 'lumba', 'kids', 'god']);

const categories = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/categories' }),
  schema: z.object({
    name: bilingual(),
    /** Fixed display order, set by business priority. There is no "sort by". */
    order: z.number().int(),
    /** One line, used on tiles and in the footer. */
    summary: bilingual(140),
    /** ~80 words. Not a 600-word SEO essay — see P3. */
    copy: bilingual(),
    materials: z.array(material).min(1),
    audience: z.array(audience).min(1),
    priceBand: z.object({ from: priceBand, to: priceBand }),
    moq: z.number().int().positive(),
    packTypes: z.array(z.enum(['carded', 'loose', 'boxed'])).min(1),
    /** Where this category actually sells strongest. An insider detail. */
    region: bilingual(80),
    /** Article number of the design used as the category tile photograph. */
    heroCode: z.string(),
    /** Chosen by hand, not by an algorithm. */
    related: z.array(reference('categories')).max(3),
    /** Categories below this threshold render as "a focused range". */
    limited: z.boolean().default(false),
  }),
});

const products = defineCollection({
  loader: file('./src/content/products.json', { parser: (t) => JSON.parse(t) }),
  schema: z.object({
    /** Article number. The primary label everywhere on the site. */
    id: z.string().regex(/^OM-\d{4}$/),
    category: reference('categories'),
    name: bilingual(80),
    materials: z.array(material).min(1),
    /** Plain colour words, used in generated alt text and the colour filter. */
    colours: z.array(z.string()).min(1),
    colourFamily: z.enum(['red', 'maroon', 'gold', 'silver', 'multi', 'pastel', 'green', 'blue']),
    sizeMm: z.number().int().positive(),
    pack: z.object({
      perCard: z.number().int().positive(),
      perBox: z.number().int().positive(),
      perCarton: z.number().int().positive(),
    }),
    packType: z.enum(['carded', 'loose', 'boxed']),
    moq: z.number().int().positive(),
    priceBand,
    new: z.boolean().default(false),
    /** Hand-set. Used to fill the home page when fewer than 6 designs are new. */
    priority: z.number().int().default(0),
    /** Set false at season rollover instead of deleting the record, so old
        WhatsApp links to ?d=OM-1140 can still be answered properly (P18). */
    available: z.boolean().default(true),
    /** Whether a second, closer photograph exists for the drawer. */
    detailPhoto: z.boolean().default(false),
  }),
});

const testimonials = defineCollection({
  loader: file('./src/content/testimonials.json', { parser: (t) => JSON.parse(t) }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    firm: z.string(),
    city: z.string(),
    /** What they actually buy. Worth more than a star rating. */
    buys: bilingual(80),
    years: z.number().int().positive(),
    quote: bilingual(320),
  }),
});

const countries = defineCollection({
  loader: file('./src/content/countries.json', { parser: (t) => JSON.parse(t) }),
  schema: z.object({
    id: z.string(),
    name: bilingual(60),
    /** Each page must carry genuinely specific content or it should not exist. */
    intro: bilingual(),
    categories: z.array(reference('categories')).min(1),
    whyThese: bilingual(),
    shipping: z.object({
      mode: bilingual(80),
      transit: bilingual(80),
      port: z.string(),
    }),
    customs: bilingual(),
    minOrderValueInr: z.number().int().positive(),
    dealerReference: z.string().optional(),
    /** Unverified facts are built but kept out of the index. See CONTENT.md. */
    draft: z.boolean().default(false),
  }),
});

const cities = defineCollection({
  loader: file('./src/content/cities.json', { parser: (t) => JSON.parse(t) }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    state: z.string(),
    intro: z.string(),
    categories: z.array(reference('categories')).min(1),
    whyThese: z.string(),
    /** The named wholesale market, where there is one. */
    market: z.string().optional(),
    transport: z.object({ mode: z.string(), transitDays: z.string() }),
    dealerCount: z.number().int().nonnegative(),
    /** Unverified facts are built but kept out of the index. See CONTENT.md. */
    draft: z.boolean().default(false),
  }),
});

const faqs = defineCollection({
  loader: file('./src/content/faqs.json', { parser: (t) => JSON.parse(t) }),
  schema: z.object({
    id: z.string(),
    question: bilingual(),
    answer: bilingual(),
  }),
});

export const collections = { categories, products, testimonials, countries, cities, faqs };
