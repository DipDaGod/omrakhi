# Architecture

What is worth knowing before changing anything. Everything here follows from the
specification in [`docs/omrakhi.md`](docs/omrakhi.md); where this build departs
from the letter of it, that is stated and argued rather than left to be
discovered.

---

## 1. The shortlist is a module, not a React context

The brief lists `ShortlistProvider` among the React islands. A provider cannot
work here.

The shortlist has to be visible in four places at once: the counter in the
header, the heart on every card in the grid, the drawer that opens from the
counter, and the sticky bar at the bottom of a category page. Astro islands do
not share a React tree — each one mounts its own root — so a context provider
could not reach past whichever island contained it.

What they do share is the module graph. `src/islands/shortlist-store.ts` is a
plain module holding the list, reading and writing `localStorage`, and notifying
subscribers. React islands subscribe through `useSyncExternalStore`
(`useShortlist.ts`); the header and drawer subscribe directly. Every consumer is
a leaf, which is what PART C's "an island is a leaf" rule actually requires.

Storage key is `orru:shortlist:v1`. The version in the key means a future schema
change cannot crash a returning visitor — an unreadable store reads as empty.

## 2. Where React is, and where it is not

The brief locks in "Astro 5 + React islands". React is used where the
interaction genuinely warrants it and where the budget allows it — which turns
out to be one page type.

The React client runtime is about 67KB gzipped. The budgets in A9 and PART F
are:

| Page | Budget | React viable? |
|---|---|---|
| `/collections/[category]` | 90KB | yes — 71KB with the grid, drawer and cards |
| `/shortlist` | 60KB | no |
| `/contact`, `/custom` | 40KB | no |
| `/` | 40KB | no |
| `/collections` | 50KB | no, with nothing left over |

So:

- **React islands**: `ProductGrid`, `ProductCard`, `DesignDrawer` — the category
  page, where filtering, a URL-addressable overlay, prev/next through a filtered
  set and per-card state are real state problems.
- **Plain TypeScript modules**: the header controls, the search overlay, the
  shortlist drawer, the shortlist page, the collections filter, the 404's
  retired-article lookup, form validation. Each is a few hundred bytes to a few
  kilobytes and does one job.
- **No JavaScript at all**: the forms submit without it, and the category grid
  renders and reads without it.

The alternative — aliasing React to Preact/compat to fit everything under
budget — was considered and rejected. A9 says a build that exceeds the budget
fails; it does not say to substitute the framework. Using React exactly where it
fits and writing fifty lines of DOM code where it does not keeps both locked
decisions intact.

## 3. The category grid is rendered twice, on purpose

`src/pages/[...locale]/collections/[category].astro` emits the complete grid as
static HTML inside `[data-static-grid]`, and separately hands the same products
to the `ProductGrid` island as props. On mount the island hides the static copy.

This costs one duplicated DOM subtree — around 5KB gzipped for sixty items — and
buys three things the brief requires: the page is complete and indexable without
JavaScript, it is usable while the island is still downloading, and a search
engine sees the products rather than an empty container.

Props are prepared at build time in `src/lib/imgview.ts`, so the island receives
finished `srcset` strings and never needs to know the image pipeline exists.

## 4. Images

`scripts/prepare-images.mjs` runs before every build and does two jobs.

**Stand-ins.** A real photograph lives at
`src/assets/products/<category>/<ARTICLE>.jpg`. Where one does not exist yet the
script writes `<ARTICLE>.placeholder.jpg` so the site builds and can be reviewed.
Real files are never overwritten, and `src/lib/images.ts` always prefers a real
file over a stand-in — so replacing a stand-in is a file drop, not a code change.
Stand-ins are gitignored.

**The LQIP manifest.** Every product photograph is reduced to a 20px blurred JPEG
and inlined as base64 in `src/data/lqip.json`. That, plus explicit width and
height on every `<img>`, is what holds CLS under 0.05 while photographs stream in.

At build time Astro emits AVIF and WebP at 320/480/768px for grid thumbnails and
up to 1400px for the drawer. 1400px is a deliberate ceiling: enough to judge a
piece, weak as a manufacturing reference.

A product with no photograph — real or stand-in — is excluded from the build with
a warning, in `src/lib/catalogue.ts`. A catalogue card with no photograph is
worse than no card.

## 5. Routing and language

English is at `/`, Hindi at `/hi/`. Both come from one template per page:
`src/pages/[...locale]/…`, where `locale` is `undefined` for English and `'hi'`
for Hindi. There is no duplicated page file anywhere.

`src/lib/routes.ts` owns the mapping. `alternateHref()` produces the same page in
the other language, which is what the header toggle links to and what the
`hreflang` tags declare — so switching language on a category page lands on that
category, not the homepage. Canonical URLs go through the same helper, so
canonical and `hreflang` can never disagree about a trailing slash.

City pages (P15) are English only for now. They pass `locales={['en']}` to the
layout, which suppresses both the `hreflang` alternates and the language toggle —
a toggle that 404s is worse than no toggle.

One route name is unusual: `ROUTES.exportHub`, not `ROUTES.export`. The Astro
compiler hoists `export` statements out of a component's frontmatter by scanning
for the token, and `ROUTES.export` at the start of a line was enough to truncate
the frontmatter and produce an unparseable file. The rename is a workaround for
that, not a preference.

Two related compiler constraints, both hit during this build: a `<` comparison
inside a multi-statement template expression is parsed as the start of a tag, and
attributes cannot be placed on the `<>` fragment shorthand. Comparisons are
computed in frontmatter (`isEager`, `gridDensity`, `bandValues`) for that reason.

## 6. Client-side catalogue data

The search overlay, the shortlist drawer and the shortlist page all need product
metadata in the browser. They fetch `/catalogue.json`, generated by
`src/pages/catalogue.json.ts`: 249 articles in both languages with thumbnails,
plus the category list and the retired-article list the 404 page uses.

It is fetched rather than bundled so that it does not sit inside every page's
JavaScript and count against the budget on pages where most visitors never open
search at all. `src/islands/catalogue-client.ts` fetches it once per page load
and shares the promise.

## 7. Staleness defences

A static site built in April and still serving in June would tell a dealer the
wrong thing about the season — which is exactly what the status strip exists to
prevent. Three things are therefore corrected in the visitor's present rather
than the build's, each by a handful of inline JavaScript with no island:

- **The season strip** renders the build-time phase, and all five phase messages
  are inlined; a script picks the right one on load.
- **The contact dock's** out-of-hours label is recomputed against IST.
- **The hours table** highlights the current day.

Everything else derives from two values — `SEASON.year` and
`SEASON.rakshaBandhan` in `src/config/site.ts`. The calendar on `/how-to-order`,
the "book by" date on `/custom` and the strip all hang off them. Nothing else on
the site contains a year.

## 8. Unverified content is built, but not indexed

Export country pages and city pages carry a `draft` flag in their data. A draft
page is still built and still linked, so the template is exercised and the
content can be reviewed — but it renders a visible notice and a `noindex` tag
until the facts are confirmed with the firm.

This is the same instinct as the empty `testimonials.json`: rather than inventing
a plausible quote, the home page omits the section entirely, which is what P1's
edge states require.

## 9. Checks that run on every build

- `scripts/check-budgets.mjs` — JavaScript per page type, gzipped, following
  static imports only. Dynamically imported chunks (search, the shortlist
  drawer, pdf-lib) are excluded, because a visitor who never opens search never
  pays for it. Also measures first-paint weight on a 2-up phone grid.
- `scripts/check-links.mjs` — every internal link resolves, and no page is an
  orphan. PART D requires everything to be reachable from the footer.
- `tests/smoke.mjs` (`npm test`) — drives a real browser: island handover,
  filters, the drawer and its URL, the shortlist across four islands, search
  ranking, the shared-shortlist link, the retired-article 404, the mobile menu
  and bottom sheet, horizontal-scroll checks at 390px, the no-JS path, and an
  axe-core pass on eight pages for the A8 floor.
