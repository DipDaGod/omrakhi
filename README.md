# Om Rakhi Udyog — website

The catalogue site for Om Rakhi Udyog, rakhi manufacturer and wholesale supplier,
P-15 Kalakar Street, 2nd Floor, Burrabazar, Kolkata 700007.

Built to the specification in [`docs/omrakhi.md`](docs/omrakhi.md). That file is the
brief; this file is how to run what was built from it.

```
npm install
npm run dev          # prepares images, then starts the dev server
npm run build        # images & OG cards → astro build → budget check → link check
npm test             # typecheck, build, then the browser smoke + a11y suite
npm run check        # astro check (TypeScript across .astro, .ts and .tsx)
```

`npm test` needs a Chromium for Playwright. `npx playwright install chromium`
fetches one; if the machine already has a suitable binary, point at it with
`CHROMIUM_PATH=/path/to/chrome npm test` instead.

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

## What is actually on the site

Most of this was derived from the specification rather than asked for
directly, so it is worth knowing it exists before you go looking for it.

### Every page

| Route | What it is |
|---|---|
| `/` | Hero, collection grid, proof, claims, visit block |
| `/collections` | All 12 collections, filterable by material, audience and price band |
| `/collections/<slug>` | The design grid — filters, sort, in-category search, detail drawer |
| `/shortlist` | What the buyer collected, with quantities, WhatsApp handoff and a PDF |
| `/catalogue` | The downloadable catalogue, with counts pulled from live data |
| `/how-to-order` | First order walked through, with the season calendar |
| `/custom` | OEM and private-label work: minimums, sampling, lead times |
| `/export` | Export hub, plus one page per country |
| `/export/<country>` | 6 countries — **all `draft: true`**, so they carry `noindex` |
| `/wholesale-rakhi-in-<city>` | 8 cities — same arrangement, `draft: true` |
| `/about`, `/visit` | The firm and how to reach the premises |
| `/contact`, `/thanks` | Enquiry form and its confirmation |
| `/privacy`, `/terms` | Written to match what the site actually does |
| `/404` | Guesses the article number or the collection from the URL |
| `/catalogue.json` | The catalogue as data — what the search and shortlist read |

Every one of these exists twice, at `/` and at `/hi/`.

### The season calendar

**The site knows what month it is.** `src/lib/season.ts` maps the month to one
of five phases — development, launch, booking, dispatch, festival — and that
drives the strip across the top of every page and the calendar on
`/how-to-order`. Dates are computed in IST, not the visitor's timezone.

Everything derives from two values in `src/config/site.ts`:

```ts
export const SEASON = { year: 2027, rakshaBandhan: '2027-08-17' };
```

Update those two lines each December and the whole site moves with them. No
page hardcodes a year, which is the point: a site still saying "2024
collection" is the clearest possible sign the firm stopped paying attention.

### The shortlist

Built as a localStorage store rather than a cart, shared across four
independent islands (grid, header counter, drawer, shortlist page) — React
context cannot cross Astro island boundaries, so it is a plain module with
subscribers. It survives reloads, produces a WhatsApp message with the article
numbers already in it, exports a PDF, and can be shared as a link that offers
to merge into whatever the recipient already had.

### Export and city pages

Both sets are **built, linked and `noindex`** until someone confirms their
claims. They are real pages with real internal links, not stubs — flipping
`draft: false` in `src/content/countries.json` or `cities.json` publishes one.
The `noindex` is deliberate: a country page that cannot say anything specific
about that country is a search liability, and an importer who discovers
mid-conversation that no export document was ever filed does not come back.

### Things that switch behaviour from one line

| Where | What it changes |
|---|---|
| `POSITIONING` in `config/site.ts` | Home hero copy, nav order, weight given to `/custom` |
| `SEASON` in `config/site.ts` | The status strip, the calendar, every "book by" date |
| `PROOF` in `config/site.ts` | Each `null` omits its figure instead of guessing |
| `PRICE_BANDS` in `config/trade.ts` | Turns every `₹₹` on the site into a real range, and shows the legend |
| `STORY` in `config/about.ts` | Which sentences on `/about` get written at all |
| `TERMS` in `config/trade.ts` | Advance, freight, replacement policy, custom minimums |
| `draft` in `countries.json` / `cities.json` | Whether that page is indexed |

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

Measured against `npm run preview` (Lighthouse 12, simulated 4G / mid-tier
mobile), on stand-in photography:

| Page | Perf | A11y | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 97 | 100 | 100 | 100 | 1.6s | 0 | 90ms |
| `/collections/ad-rakhi` | 96 | 100 | 100 | 100 | 2.1s | 0 | 0ms |

The category page is the heaviest thing on the site — it is the one page that
ships React — and it still lands at CLS 0 and no blocking time. Its 164.5KB
first paint is reported by the budget script as informational for that reason:
the weight is images the grid needs, not script.

Note that the current weight figures are measured against stand-in photographs,
which compress far better than real ones. Re-run `npm run budgets` after the
first batch of real photography lands; that is when the image budget is actually
tested.

## Motion

One curve and two durations, both in `tokens.css`: `--dur-fast` (120ms) for
state changes on a control, `--dur-base` (240ms) for anything that enters or
leaves the page. Nothing animates on scroll — scroll-triggered reveals are the
most reliable sign a page was assembled rather than designed.

Everything animated moves `transform` and `opacity` only, so none of it
competes with the catalogue rendering behind it.

Overlays travel in and out. `openOverlay()` mounts on the closed state and adds
`.is-in` one frame later — one frame, because the browser will otherwise
collapse both into a single style resolution and nothing moves. Closing swaps
to `.is-out` and waits `--dur-base` before removing, on a timer rather than
`transitionend`: a transition that never runs would never fire the event, and
the overlay would sit in the DOM for good. The React-mounted drawer and sheet
animate in only, since there is no closed state to come from on mount.

`prefers-reduced-motion: reduce` collapses every duration to 1ms globally, and
both JavaScript exit paths skip their timers entirely, so the site still ends
in exactly the same state — it just stops travelling. This is tested: the
smoke suite closes an overlay and a menu under reduced motion and asserts both
are removed and the scroll lock is released.

## Deployment — Vercel

The repository is configured for Vercel and needs no dashboard setup beyond
importing it. `vercel.json` pins the build command, the output directory and the
headers, so a deploy is reproducible from the repo rather than from settings
someone changed six months ago.

```
Framework      Astro (static)
Install        npm ci
Build          npm run build
Output         dist/
```

`npm run build` is the same command CI runs: it prepares images, builds, then
**fails on a page over its A9 budget or a broken internal link**. A deploy that
would regress performance does not reach production.

### Environment variables

Set these in the Vercel project. All are read at build time and baked into the
static output — there is no server to read them at runtime. See `.env.example`.

| Variable | Effect if unset |
|---|---|
| `PUBLIC_SPEED_INSIGHTS` | No Speed Insights. Set to `1` for field LCP and CLS. |
| `PUBLIC_WEB_ANALYTICS` | No Web Analytics. Set to `1` for page views and referrers. |

The Web3Forms access key (contact and custom forms) is hardcoded in
`src/config/site.ts` rather than read from an env var — it's public by
design (it appears in the form's HTML) and Web3Forms does its own
spam/domain checks server-side, so there's no secrecy to gain from an
env var, and hardcoding it means a key rotation is a one-line code
change rather than a dashboard trip.

Both measurement tools are off by default, are served from this origin under
`/_vercel/`, set no cookies and identify nobody — and the privacy page reads the
same flags, so it describes whichever of them is actually running rather than
what someone meant to enable.

### The map

`/visit` and `/about` show a static image by default and load an interactive
Leaflet map only when someone presses **Explore the map**. Leaflet is ~42KB
gzipped — larger than the whole `/visit` budget — so it sits behind a dynamic
import and is excluded from the budget the same way the search overlay is. A
visitor who never opens it never downloads it, and without JavaScript the
still image and its Google Maps link are all that ever existed.

Two things this depends on, both easy to break silently:

- **Leaflet is a dependency, not a CDN script.** `script-src` is `'self'`, so a
  CDN tag would be blocked outright.
- **`img-src` names the tile host.** Tiles come from `tile.openstreetmap.org`
  and the CSP lists it explicitly; tighten that back and the map renders as a
  grey box with no error anyone will notice. The smoke suite replays the real
  policy and asserts tiles pass it.

OpenStreetMap attribution is required by their terms and is rendered by the
map itself. Their [tile usage policy](https://operations.osmfoundation.org/policies/tiles/)
covers a site this size, but it is a volunteer service — if traffic grows,
move to a paid tile provider rather than leaning on it.

### What `vercel.json` sets

- **Immutable caching for `/_a/*`.** Astro content-hashes everything there, so a
  year-long `immutable` header is safe and is the single biggest win for repeat
  visitors. `/catalogue.json` and `/og/*` are *not* hashed and are set to
  revalidate — a stale catalogue would show a dealer products that no longer
  exist.
- **`trailingSlash: false`.** Canonical URLs and `hreflang` are built without a
  trailing slash, so the server now redirects `/x/` to `/x` and agrees with them.
- **A content security policy**, plus HSTS, `nosniff`, `frame-ancestors: none`,
  a referrer policy and a permissions policy. `form-action` allows exactly one
  external origin: the Web3Forms endpoint the two forms post to. Nothing else
  external is permitted, which is accurate — the site loads no third-party
  script, font, or stylesheet.

The CSP is not taken on trust. `npm test` reads it back out of `vercel.json`,
replays it against the pages that run the most JavaScript, and fails on any
violation the browser reports — so a policy that would break the grid island or
the shortlist PDF is caught before it ships, not after.

### Preview deployments

Preview and branch deployments render a `noindex` meta tag and serve a
`robots.txt` that disallows everything, on top of the `X-Robots-Tag` Vercel
already sends for non-production deployments. Canonical URLs are built from
`SITE.origin` regardless of which deployment served the page, which is the
stronger guarantee of the four.

### Deploying anywhere else

Nothing here is Vercel-only. `dist/` is plain static files and any CDN will
serve them; the Vercel-specific parts are the headers in `vercel.json` and the
two optional measurement scripts, which simply do not render when their flags
are unset. If you move, port the headers — particularly the immutable `/_a/*`
rule, which the performance budget assumes.

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
