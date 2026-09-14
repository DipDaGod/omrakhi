# Om Rakhi Udyog — website

The catalogue site for Om Rakhi Udyog, rakhi manufacturer and wholesale supplier,
P-15 Kalakar Street, 2nd Floor, Burrabazar, Kolkata 700007.

Built to the specification in [`docs/omrakhi.md`](docs/omrakhi.md). That file is the
brief; this file is how to run what was built from it.

```
npm install
npm run dev          # prepares images, then starts the dev server
npm run build        # images & OG cards → astro build → budget check → link check
npm test             # build, link check, then the browser smoke + a11y suite
npm run check        # astro check (TypeScript across .astro, .ts and .tsx)
```

## What this is

A static site. No backend, no database, no accounts, no cart, no payments.
Astro 5 renders everything to HTML at build time; React hydrates on exactly one
page type. The conversion event is a WhatsApp message with an article number in it.

| | |
|---|---|
| Pages built | 71 (see `npm run build` output) |
| Languages | English at `/`, Hindi at `/hi/`, full route parallelism |
| Collections | 12, driven by `src/content/categories/*.json` |
| Articles | 249, driven by `src/content/products.json` |
| JS on the home page | ~1KB gzipped |
| JS on a category page | ~71KB gzipped, against a 90KB budget |

## Layout of the repository

```
docs/omrakhi.md         the build specification
src/
  config/               fixed facts: the firm, the season, trade terms, proof numbers
  content/              the catalogue: categories, products, countries, cities, FAQs
  content.config.ts     the schemas those files are validated against
  styles/tokens.css     every colour, size, space and duration on the site
  i18n/                 UI strings, both languages, one key set
  lib/                  routing, season logic, formatting, image resolution
  components/           Astro components — static HTML, no JavaScript
  islands/              everything that runs in the browser
  layouts/Base.astro    <head>, header, footer, dock, schema
  pages/                routes
scripts/                image preparation, OG cards, budget and link checks
tests/smoke.mjs         browser tests: interaction, no-JS, mobile, accessibility
```

## Before this goes live

The site is complete and runs. Three categories of content still have to come
from the firm, and all of them are flagged in the code rather than guessed at.
**[`CONTENT.md`](CONTENT.md) is the list.** In short:

1. **Photography.** Every product photograph is currently a generated stand-in.
   Dropping a real `OM-1234.jpg` into `src/assets/products/<category>/` replaces
   one, with no code change.
2. **The catalogue itself.** The 249 articles are generated sample data with the
   right shape, not the firm's real range.
3. **Commercial facts.** Trade terms, proof numbers, testimonials, export and
   city market notes. Anything unconfirmed is either omitted from the page or
   built with `noindex` until it is verified.

Nothing on the site invents a number, a testimonial, or a capability. Where a
fact is missing, the section it belongs to is omitted rather than filled in.

## Architecture and the decisions behind it

[`ARCHITECTURE.md`](ARCHITECTURE.md) covers the parts worth knowing before
changing anything: why the shortlist is a module and not a React context, why
the category grid is rendered twice, where React is and is not used and why,
how the image pipeline resolves a photograph, and the two places where the build
deliberately departs from the letter of the specification.

## Positioning and art direction

Both were open questions in the brief. Both are now single switches:

- **Positioning** — `POSITIONING` in `src/config/site.ts`, set to
  `'legible-supplier'`. It changes the home hero copy and the nav order.
  The other two frames are implemented; changing one value switches to them.
- **Art direction** — `src/styles/tokens.css`, a direction called "ledger":
  warm paper ground, near-black ink, one deep vermilion accent, square corners,
  hairline rules, system type. Nothing outside that file hardcodes a value, so a
  different direction is a rewrite of one file.

## Performance

`npm run build` fails if a page exceeds its budget. LCP and CLS cannot be
measured in a build — run Lighthouse against `npm run preview` for those. The
numbers to hold: **LCP under 2.0s** on simulated 4G on a mid-tier Android, and
**CLS under 0.05**.

Note that the current weight figures are measured against stand-in photographs,
which compress far better than real ones. Re-run `npm run budgets` after the
first batch of real photography lands; that is when the image budget is actually
tested.

## Deployment

The build output in `dist/` is static files. Any CDN will serve it. Two things
to set:

- `WEB3FORMS_KEY` in the build environment, or the contact and custom forms post
  to a placeholder key and silently fail.
- `SITE.origin` in `src/config/site.ts` if the domain is ever not
  `omrakhiudyog.com` — canonical URLs, `hreflang` and the sitemap all derive
  from it.

## What was deliberately not built

- **`/journal` (P16).** The brief says to build it only if posts will actually be
  written, because a blog whose most recent entry is eighteen months old is the
  clearest possible signal of an abandoned site. Nothing is built until someone
  commits to writing four posts a year.
- **A dark mode.** A catalogue photographed on one fixed surface has one correct
  presentation, and a second mode would need a second set of photography.
- **Country and city pages as live content.** They are built, but every one is
  `draft: true` and therefore `noindex`, because their market claims have not
  been confirmed with the firm. Flipping the flag publishes them.
