# omrakhi.md — Website Build Specification

Page-by-page spec for the Om Rakhi Udyog site. This is the document you hand to whoever (or
whatever) writes the code. `README.md` holds the business background and the reasoning behind
the project; this file holds what actually gets built.

**Fixed facts to use throughout:**

```
Name        Om Rakhi Udyog
Address     P-15 Kalakar Street, 2nd Floor, Burrabazar, Kolkata 700007
Landmark    near ICICI Bank
Phone       +91 93309 11943        tel:+919330911943
WhatsApp    +91 93309 11943        wa.me/919330911943
Instagram   instagram.com/omrakhiudyog
IndiaMART   indiamart.com/om-rakhi-udyog
```

**Decisions already locked:**

- **Full open catalogue.** Every published design shows a photo, an article number, materials,
  pack config and price band. No watermarks, no gating. (Consequences in README §11.2.)
- **No backend.** Static build, deployed to a CDN. No database, no accounts, no cart, no payments.
- **Astro 5 + React islands.** Static HTML by default, React hydrated only where a page is
  genuinely interactive. Rationale in README §6.1.
- **WhatsApp is the conversion event.** Not a purchase — a message with an article number in it.

**Decisions still open, and where they land in this document:**

- **Positioning** (specialist / legible supplier / on-ramp) changes the home hero copy, the
  emphasis on `/how-to-order`, and whether `/custom` is a headline page or a footnote. Every
  page below marks where positioning injects with **`[POS]`**.
- **Art direction** (README §7.4) supplies concrete values for the design tokens in §A0. Every
  page below is written against the *token names*, not against specific colours, so the
  direction can be dropped in late without rewriting page specs. Marked **`[ART]`**.

---

## How each page is specified

Every page below follows the same template, so it can be read top to bottom or grepped for
one route:

| Field | Meaning |
|---|---|
| **Route** | The URL. `[param]` means generated from data. |
| **Instances** | How many actual pages this spec produces. |
| **Job** | The single thing this page exists to do. If a section doesn't serve it, cut the section. |
| **Arrives from** | How a real person lands here. Determines what they already know. |
| **Layout** | Section order, with a wireframe where the arrangement isn't obvious. |
| **Sections** | Each block: what's in it, and *why it's there*. |
| **Design decisions** | Choices specific to this page, each with its reason. |
| **Interactive** | Which React islands hydrate here, and what stays static HTML. |
| **Data** | Content collections consumed. |
| **Meta** | Title pattern, description pattern, structured data. |
| **Edge states** | Empty, partial, error, no-JS. |
| **Mobile** | What changes below 640px. |
| **Done when** | Acceptance criteria. |

---

# PART A — Global systems

These exist on every page. Specify them once, correctly, and most pages become short.

## A0. Design tokens

One file, `src/styles/tokens.css`, holds every value. Nothing in a component hardcodes a colour,
a font size, or a spacing value. **`[ART]`** fills these in once a direction is chosen.

```css
:root {
  /* Colour — role names, not colour names, so the art direction can change without renaming */
  --ink            /* primary text, headings */
  --ink-muted      /* secondary text, captions, article numbers */
  --ground         /* page background */
  --ground-raised  /* cards, drawers, anything above the page */
  --accent         /* the one loud colour. CTAs, active states, category tags */
  --accent-quiet   /* accent at low emphasis — hairlines, underlines, borders */
  --plinth         /* the surface product photos sit on */
  --line           /* hairlines and dividers */
  --ok  --warn     /* status only: in stock, low stock */

  /* Type */
  --font-display   /* one family */
  --font-text      /* one family */
  --font-deva      /* Devanagari, may be the same family if it covers both scripts */

  /* Type scale — modular, ratio fixed by [ART] */
  --step--1 --step-0 --step-1 --step-2 --step-3 --step-4

  /* Spacing — one scale, used everywhere */
  --space-3xs … --space-3xl

  /* Structure */
  --radius         /* one value for the whole site, or 0 */
  --hairline       /* border width */
  --measure        /* max line length for body copy, ≤70ch */
  --container      /* max content width */
  --grid-gutter

  /* Motion */
  --ease           /* one easing curve */
  --dur-fast --dur-base   /* two durations, that's all */
}
```

**Rules that hold regardless of art direction:**

- One display family, one text family. Never three.
- Body copy never exceeds `--measure`. A 1400px-wide paragraph is unreadable and reads as
  unedited.
- One `--radius` for the entire site. Mixed corner radii are the clearest tell of a page
  assembled from a component kit.
- No drop shadows as decoration. Shadow only where something genuinely floats above the page
  (drawer, sticky bar, modal) and then one shadow token, not per-component values.
- `prefers-reduced-motion: reduce` kills every transition and animation. Non-negotiable.
- Dark mode: **not building one.** A product catalogue photographed on a fixed surface has one
  correct presentation. A dark mode would require a second set of product photography.

## A1. Header

**Present on:** every page. **Static HTML** except the search trigger and shortlist counter.

```
desktop ┌────────────────────────────────────────────────────────────────────┐
        │ [wordmark]   Collection  Order  Custom  Export  About  Visit       │
        │                                    ⌕  EN|हि  ♡3  [Call]  [WhatsApp]│
        └────────────────────────────────────────────────────────────────────┘

mobile  ┌────────────────────────────────┐
        │ [wordmark]        ⌕   ♡3   ☰   │
        └────────────────────────────────┘
```

| Element | Why |
|---|---|
| Wordmark, links home | Standard, and the only place the full name needs to appear on inner pages. |
| **Collection** first in the nav | Every competitor puts categories first, and they're right — a dealer's first instinct is to look at goods, not to read about you. |
| **Order** (= `/how-to-order`) second | A first-time buyer's actual next question. Putting a process page this high is unusual in this trade and is itself a positioning signal. **`[POS]`** — moves to first position if "legible supplier" is chosen. |
| Search icon | Opens the search overlay (A5). Not an inline input — an inline search box in a header invites a dead-end query on a 60-item site. |
| Language toggle | Two states, EN and हि. Never a dropdown for two options. |
| Shortlist counter (♡ with badge) | Persistent visibility is what makes the shortlist feature get used. Hidden when empty — a zero badge is noise. |
| **Call** and **WhatsApp** as two distinct buttons | Phone-first buyers exist in large numbers in this trade and are often older. Forcing them through WhatsApp loses them. `tel:` is one tap. |

**Behaviour:** sticky on scroll, but collapses to a slim bar after 200px so it doesn't eat a
phone screen. No hide-on-scroll-down/show-on-scroll-up — it's fiddly and the contact buttons need
to be permanently reachable.

**Mobile menu:** full-screen overlay, not a slide-in drawer. Contains the nav links, the full
category list (dealers navigate by category, so surfacing all 12–20 saves a hop), language
toggle, phone, WhatsApp, Instagram, address.

## A2. Footer

**Present on:** every page. Fully static.

Four columns desktop, stacked mobile:

1. **Identity** — wordmark, one-line description ("Rakhi manufacturer and wholesale supplier,
   Burrabazar, Kolkata"), Instagram link, IndiaMART link.
2. **Collection** — every category, linked. Not "see all". The full list. This is real SEO
   internal-linking value and it's the fastest navigation on the site.
3. **Buying** — How to order, Custom & private label, Export, Catalogue, Visit us, Contact.
4. **Reach us** — address across three lines with the landmark, phone as a `tel:` link,
   WhatsApp, email, season and off-season hours.

Bottom rule: copyright, privacy, terms. Nothing else. **No newsletter signup** — it's a B2B
catalogue site, there is no newsletter, and an inert signup box is the single most obvious
sign of an unfinished template (see README §2.2).

## A3. Contact dock (floating)

Bottom-right on desktop, bottom-full-width bar on mobile. One WhatsApp button, one call button.

- **Contextual prefill.** The WhatsApp deep link carries a message built from the current page:
  on `/collections/ad-rakhi` it prefills *"Enquiry about your AD Rakhi collection"*; on a design
  drawer it prefills the article number. Because the single biggest friction in a B2B enquiry
  is the buyer having to explain what he's looking at.
- **Hours awareness.** Outside shop hours the label reads "Message us — we reply from 10am".
  Prevents the buyer concluding he's being ignored at 11pm.
- Hidden on `/shortlist`, where the page's own send button is the primary action and a second
  floating WhatsApp button would compete with it.

## A4. Shortlist system

The one feature no competitor in this trade has. Full rationale in README §5.1.

**Storage:** `localStorage`, key `orru:shortlist:v1`, shape `[{code, qty}]`. Versioned key so a
schema change doesn't crash returning visitors. No account, no sync, no backend.

**Entry points:** a heart/plus control on every product card and inside every design drawer.

**Feedback:** adding animates the item toward the header counter, once, quickly. This is the one
place on the site where non-user-triggered motion earns its keep — it tells the user where the
thing went, which is otherwise invisible.

**Global drawer:** clicking the header counter opens a drawer with the current list, quantities,
and a "Review shortlist" link to `/shortlist`. The drawer is for a quick glance; the page is for
composing the enquiry.

**Cap:** soft warning at 40 items. Beyond that the WhatsApp message exceeds what's readable and
the buyer should just ask for the full catalogue.

## A5. Search overlay

Opens from the header icon or `/` keypress. A React island, code-split, loaded on first open —
never on page load, since most visitors never search.

- Fuse.js over a prebuilt JSON index of article number, category, material, colour, and name in
  both languages.
- **Article-number search must be exact-first.** A dealer typing `OM-24` is looking for a
  specific piece he saw in a sample box. Fuzzy matching on a code is actively unhelpful — exact
  and prefix matches rank above everything, fuzzy results appear under a separator.
- Empty state shows the five most-viewed categories, not a blank box.
- Results are product cards with add-to-shortlist inline, so a search can go straight to enquiry.

## A6. Language

English default at `/`, Hindi at `/hi/`. Full route parallelism — every page exists in both.

- Article numbers, pack configurations and price bands never translate.
- Category names carry both: `name_en` and `name_hi` in the data.
- The toggle preserves the current route, so switching language on a category page doesn't dump
  you on the homepage. This is a small thing that is wrong on most bilingual Indian sites.
- `hreflang` tags both ways, `x-default` to English.
- Bengali is a possible third, deferred. The data schema should allow it without migration.

## A7. Seasonal status strip

A single line above the header, dismissible, driven by one value in a config file.

| Season | Message |
|---|---|
| Sep–Nov | "2027 collection in development. Photographs from December." |
| Dec–Jan | "2027 collection now live. Pre-booking open." |
| Feb–Apr | "Booking open for 2027. Visit us at Kalakar Street." |
| May–Jul | "Dispatch season. Call before ordering to check availability." |
| Aug | "Raksha Bandhan 17 August. Limited stock — call first." |

Why it matters: a dealer's most urgent unspoken question is *"is this site current?"* A site
that visibly knows what month it is answers that in one line. This is also the cheapest possible
defence against the staleness problem that makes every competitor's site say "2024 Collection"
in 2026.

## A8. Accessibility floor

Applies everywhere, not negotiable per page:

- Visible keyboard focus ring, using `--accent`, on every interactive element.
- All product images have alt text generated from the data: *"Pearl and kundan rakhi, article
  OM-2418, maroon and gold"*. Never "product image".
- Colour contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text and UI borders.
- Drawers and modals trap focus, close on Escape, and return focus to the trigger.
- `prefers-reduced-motion` respected.
- Skip-to-content link as the first focusable element.
- Every form field has a real `<label>`, not a placeholder standing in for one.

## A9. Performance budget

Enforced in CI; a build that exceeds it fails.

| Metric | Budget | Why |
|---|---|---|
| JS on home | < 40KB gzipped | Home has no interactivity except header controls. |
| JS on a category page | < 90KB gzipped | Filters + shortlist + drawer. |
| LCP, simulated 4G, mid-tier Android | < 2.0s | The realistic device for this audience. |
| Category page total weight, 40 products | < 600KB | Patchy mobile data in a market. |
| CLS | < 0.05 | Every image has explicit dimensions and an LQIP placeholder. |

## A10. Image handling

The site is photographs. This is the hardest engineering problem here.

- Source: pre-resized JPEG, max 2000px, committed to `src/assets/products/[category]/`.
- Build emits AVIF + WebP at 320 / 480 / 768 / 1200px, plus an inlined base64 LQIP.
- **Public delivery capped at 1400px** — enough to judge a piece, weak as a manufacturing
  reference. (README §11.2.)
- Grid thumbnails are square 1:1, cropped from the source at build. Consistent crop is what
  makes a 40-item grid read as a professional catalogue rather than a phone gallery.
- Below-fold images lazy-load; the first row on any page is eager.
- Explicit width and height on every `<img>`. No layout shift, ever.

---

# PART B — Pages

## P1. `/` — Home

**Instances:** 1 (×2 languages)
**Job:** convert a stranger who just heard your name into someone browsing the collection or
opening WhatsApp. He'll give it twenty seconds.
**Arrives from:** Google search for the firm name, a WhatsApp forward, an Instagram bio link,
the IndiaMART listing, a business card.

```
┌──────────────────────────────────────────────────────────────┐
│ status strip                                                 │
│ header                                                       │
├──────────────────────────────────────────────────────────────┤
│ 1  HERO — one statement + two buttons + real product imagery  │
├──────────────────────────────────────────────────────────────┤
│ 2  CATEGORY GRID — 12–20 photographic tiles                   │
├──────────────────────────────────────────────────────────────┤
│ 3  PROOF BAR — years · designs · states                       │
├──────────────────────────────────────────────────────────────┤
│ 4  WHO WE SUPPLY — 4–5 buyer types                            │
├──────────────────────────────────────────────────────────────┤
│ 5  THIS SEASON — 6–10 designs with article numbers            │
├──────────────────────────────────────────────────────────────┤
│ 6  WHY DEALERS WORK WITH US — 3–4 defensible claims           │
├──────────────────────────────────────────────────────────────┤
│ 7  TESTIMONIALS — 2–3, named, with firm and city              │
├──────────────────────────────────────────────────────────────┤
│ 8  VISIT US — address, landmark, map, hours                   │
├──────────────────────────────────────────────────────────────┤
│ footer                                                       │
└──────────────────────────────────────────────────────────────┘
```

### Sections

**1. Hero.** One headline stating what the firm is and where. One supporting line. Two buttons:
*Browse the collection* (primary) and *WhatsApp us* (secondary). Imagery is real product
photography — either a single large hero shot or a tight grid of six, depending on **`[ART]`**.

*Why not a carousel:* every competitor stacks five to seven JPEG banners with text baked into
the image. They're unreadable on a phone, invisible to search engines, impossible to translate,
and a maintenance tax every December. One statement in real text beats seven in Photoshop.

**`[POS]`** The headline is where positioning lives:
- *Specialist* — "Pearl, kundan and designer rakhi. Made on Kalakar Street."
- *Legible supplier* — "Every design, every rate, every pack size. Before you call."
- *On-ramp* — "Start a rakhi business. Low minimums, from a Burrabazar manufacturer."

**2. Category grid.** The most-clicked element on the page, so it sits directly under the hero,
above the credibility content. Each tile: a real photograph of a representative piece, the
category name, the design count. Counts are generated from data, never hand-written, so they
can't go stale.

*Why this high:* a dealer's first action is to look at goods. Making him scroll past an About
paragraph to reach them is a self-inflicted wound.

**3. Proof bar.** Three or four hard numbers on one line: years in the trade, designs this
season, states supplied. Real numbers only. A specific "42 dealers across 7 states" is more
persuasive to a buyer who will meet those dealers than an unverifiable "9,000+".

**4. Who we supply.** Retailers · Distributors · Exporters · Online sellers · Gift chains.
Lets a visitor self-identify in one glance and tells him he's in the right place. Each item
links to the most relevant page (exporters → `/export`, online sellers → `/how-to-order`).

**5. This season.** Six to ten designs, each with its article number visible, each with
add-to-shortlist. Proves the catalogue is real and current, and gives an impatient visitor
something to shortlist without navigating anywhere.

**6. Why dealers work with us.** Three or four claims. Each must survive a phone call. Candidates
that are worth something in this trade: consistent pack configuration, barcoded and modern-trade
ready, dispatch dates you actually hit, replacement policy on damaged goods, sample boxes sent
before booking. Avoid "quality" and "trust" — they're the default noise of every competitor page.

**7. Testimonials.** Two or three. Each carries the dealer's name, firm name, city, and what
they buy. *"Mahalakshmi Enterprise, Mysore — stone and lumba, eight years"* is worth ten
anonymous five-star quotes. Photograph optional; if you don't have one, use no avatar rather
than a generic silhouette.

**8. Visit us.** Address, landmark, a static map image linking to Google Maps, season hours,
and a "WhatsApp before you come" prompt. Burrabazar is genuinely hard to navigate for a
stranger; treating that as a real problem rather than a formality is a trust signal.

### Design decisions

- **No hero carousel.** Reasons above.
- **Products before prose.** Credibility content sits below the category grid, not above it.
- **No statistics with animated count-ups.** They delay the number, they're a generated-page
  cliché, and they break for reduced-motion users.
- **One motion moment on the whole page**, at most: a single orchestrated hero reveal on load.
  Nothing fades in on scroll. Scroll-triggered section reveals are the most reliable tell that
  a page was assembled rather than designed.
- **The map is a static image, not an embedded iframe.** A Google Maps embed costs ~500KB and
  a third-party connection on the most important page of the site, to display something the
  user will open in the Maps app anyway.

### Interactive

Islands: header controls, category-tile hover state (CSS only, no JS), shortlist buttons in
section 5. Everything else is static HTML. Target: under 40KB of JS.

### Data
`categories` (all), `products` (filtered `new: true`, limit 10), `testimonials` (limit 3), `site` config.

### Meta
- Title: `Om Rakhi Udyog — Rakhi Manufacturer & Wholesale Supplier, Kolkata`
- Description: one sentence naming the trade, the location, and the buyer type.
- Schema: `Organization` + `LocalBusiness` with address, phone, opening hours, Instagram as `sameAs`.
- OG image: a generated composite of six product photographs. Matters enormously — nearly all
  link sharing in this trade happens through WhatsApp, and WhatsApp renders the OG card.

### Edge states
If fewer than 6 designs are marked `new`, section 5 falls back to the highest-priority designs
rather than rendering a short, sad row. If there are no testimonials, section 7 is omitted
entirely — never a placeholder.

### Mobile
Category grid goes 2-up. Proof bar wraps to a 2×2. Section 5 becomes a horizontal scroller with
a visible scrollbar hint. Contact dock becomes a full-width bottom bar.

### Done when
LCP under 2.0s on throttled 4G; every number on the page comes from data; no lorem ipsum; the
page is intelligible with images disabled.

---

## P2. `/collections` — Collections index

**Instances:** 1 (×2)
**Job:** get a buyer to the right category in one click, and show the breadth of the range at a
glance.
**Arrives from:** header nav, home category grid "see all", footer, search.

### Layout
Page header (one paragraph, honest, ~60 words, plus total design count) → filter chips →
category grid → a "not sure what you need?" block linking to `/how-to-order` and WhatsApp.

### Sections

**Filter chips.** Horizontal row, multi-select, client-side, instant:
- *Material* — thread · stone · metal · pearl · rudraksha · resin · terracotta
- *For* — brother · bhaiya-bhabhi · lumba · kids · god
- *Price band* — ₹ · ₹₹ · ₹₹₹ · ₹₹₹₹

*Why chips rather than a sidebar:* on a set of 12–20 categories a full filter sidebar is
over-engineering, and sidebars collapse badly to mobile. Chips work identically on both.

**Category grid.** Each card: photograph, name (both scripts where relevant), design count,
one-line description, price band, and the region where it sells strongest. That last field is
an insider detail — a dealer from Mysore seeing "strongest in South India" next to Handicraft
Rakhi immediately knows you understand his market.

### Design decisions

- **Design counts are live from data.** A category that drops below a threshold gets marked
  "limited range" rather than showing an embarrassing count.
- **Cards are photograph-led, not icon-led.** Icons for rakhi categories are meaningless; the
  difference between kundan and meenakari is entirely visual.
- **No "sort by".** With 20 items, sorting is a control nobody uses. Fixed order, set in data by
  business priority.
- Filtering updates the URL (`?material=stone`) so a filtered view is shareable and
  back-button-safe.

### Interactive
One island: the filter/grid component. Renders server-side with all categories; the island
handles filtering. So the page is complete and indexable without JS.

### Data
`categories` (all), derived counts from `products`.

### Meta
Title `Rakhi Collections — Om Rakhi Udyog`. Schema: `CollectionPage` + `BreadcrumbList`.

### Edge states
Filter combination with zero results: a message naming the filters and a "clear filters" button.
Never an empty grid with no explanation.

### Mobile
Chips scroll horizontally with edge fade. Grid 2-up.

---

## P3. `/collections/[category]` — Category page

**Instances:** 12–20 (×2). **The most important template on the site.**

**Job:** let a buyer scan the full range in a category, shortlist what he wants, and leave with
article numbers.
**Arrives from:** home grid, collections index, header mega-menu, footer, search, Google (these
pages carry most of the site's organic traffic).

```
┌──────────────────────────────────────────────────────────────┐
│ breadcrumb: Collection / AD Rakhi                            │
│                                                              │
│ AD Rakhi                          64 designs · ₹₹–₹₹₹        │
│ [80 words of real copy: what it is, where it sells, what     │
│  makes yours worth stocking]                                 │
│ MOQ 100 pcs per design · carded and loose available          │
├──────────────────────────────────────────────────────────────┤
│ [price ▾] [colour ▾] [pack ▾] [new only]          ⌕ in category│
├──────────────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                          │
│ │photo │ │photo │ │photo │ │photo │                          │
│ │OM-241│ │OM-242│ │OM-243│ │OM-244│    ← article no. is the   │
│ │₹₹ ♡  │ │₹₹ ♡  │ │₹₹₹ ♡ │ │₹₹ ♡  │       card's primary label│
│ └──────┘ └──────┘ └──────┘ └──────┘                          │
│              … 64 items, 4-up desktop, 2-up mobile           │
├──────────────────────────────────────────────────────────────┤
│ Related: Kundan Rakhi · Stone Chain Rakhi · Pendant Rakhi    │
├──────────────────────────────────────────────────────────────┤
│ ▓▓ sticky: 3 designs shortlisted   [Send on WhatsApp] ▓▓     │
└──────────────────────────────────────────────────────────────┘
```

### Sections

**Header.** Category name, design count, price band range, MOQ, pack types available, and
roughly 80 words of genuine copy.

*Why 80 words and not 600:* competitors run 500–600 word SEO essays on every category page,
repeated nearly verbatim across categories, several still dated 2024. It reads as machine-made,
it pushes the products below the fold, and modern search doesn't reward it. Eighty words that
tell a dealer where this category sells and why yours is worth stocking does more work.

**Filter rail.** Price band, colour family, pack type, new-this-season. Multi-select, instant,
URL-synced.

**In-category search.** Small input filtering by article number within this category. A dealer
who wrote "OM-24" in his notebook at your counter should find it in three keystrokes.

**Product grid.** The core. Card anatomy, in visual priority order:

1. Square photograph, consistent crop.
2. **Article number** — the largest text on the card. Not the design name.
3. Price band.
4. Pack config, small.
5. Shortlist control.
6. "New" tag if applicable.

*Why the article number dominates:* dealers order by number. They do not order by "Pearl cluster
rakhi, maroon dori". Every phone call, every WhatsApp message, every order sheet in this trade
uses the code. Making the marketing name bigger than the code would be designing for a consumer
shopper who does not exist on this site.

**Related categories.** Two or three, chosen in data, not by an algorithm.

**Sticky shortlist bar.** Appears once the shortlist is non-empty. Count plus a send button.

### Design decisions

- **Four columns desktop, two mobile.** Three is too sparse for scanning 60 items; five makes
  photographs too small to judge stone quality. Four is the scanning sweet spot.
- **No pagination, no infinite scroll.** Everything renders at once, images lazy-load. A dealer
  wants to see the whole range in one scroll and Ctrl-F it. Pagination in a catalogue is a
  hostile pattern, and infinite scroll breaks the back button and makes the footer unreachable.
- **No hover-zoom on cards.** Opening the drawer gives a proper detail view; hover-zoom
  half-does the job and does nothing on touch, which is most of this audience.
- **Cards do not have individual shadows or borders.** Sixty bordered cards is visual static.
  The photographs supply their own edges; whitespace does the separating.
- **The grid is server-rendered in full**, with the island taking over for filtering. So the
  page is complete, indexable, and usable with JS disabled or still loading.
- **Price bands, not prices.** Rates in this trade are negotiated and vary by dealer, volume
  and relationship, and publishing them arms the firm down the street. Bands let a buyer
  self-qualify without giving anything away.

### Interactive
Islands: filter/grid, in-category search, design drawer, shortlist controls, sticky bar. All
code-split. Budget under 90KB.

### Data
`categories` (this one), `products` (filtered by category).

### Meta
- Title: `{Category} — Wholesale Rakhi Manufacturer | Om Rakhi Udyog`
- Description: generated from the category copy, capped at 155 chars, unique per category.
- Schema: `CollectionPage`, `BreadcrumbList`, and `ItemList` of `Product` entries (name, image,
  sku = article number, brand, `offers` with `priceSpecification` omitted since rates aren't public).
- OG image: generated 2×2 composite of four designs from this category.

### Edge states
- Fewer than 8 designs: grid goes 3-up so the row doesn't look abandoned, and the header adds
  "a focused range" rather than a bare count. (Full-open catalogue means completeness is visible,
  README §11.2 — a thin category is better not launched.)
- Zero after filtering: named message + clear-filters.
- Missing photograph on a product: that product is excluded from the build with a warning. A
  catalogue card with no photograph is worse than no card.

### Mobile
2-up grid. Filters collapse into a single "Filter" button opening a bottom sheet. Sticky bar sits
above the contact dock.

---

## P4. Design drawer — `?d=OM-2418`

**Instances:** not a page. A URL-addressable overlay over any category page.
**Job:** give the detail a buyer needs to decide, without building 400 thin pages.

**Why a drawer and not a route:** 400 near-identical product pages is an SEO liability (thin,
duplicative content), a photography burden, and a maintenance cost every December. A drawer with
a shareable URL delivers the two things a route would give — detail and a pasteable link —
without the 400 pages. Full reasoning in README §4.4.

### Contents
- Large photograph, plus the detail shot, swipeable.
- Article number as the heading.
- Name, both scripts.
- Materials, colours, approximate size.
- Pack configuration, spelled out: *"1 per card · 12 per box · 240 per carton"*.
- MOQ.
- Price band.
- Add to shortlist.
- **"Ask about OM-2418"** — WhatsApp deep link with the code prefilled.
- **Copy link** — copies `omrakhiudyog.com/collections/ad-rakhi?d=OM-2418`.
- Previous / next within the current filtered set.

### Design decisions
- **Right-hand drawer on desktop, bottom sheet on mobile.** Keeps the grid visible behind it, so
  the buyer keeps his place in a 60-item scan. A full-page modal loses that context.
- **Prev/next respects the active filter**, so stepping through a filtered set doesn't jump to
  items the buyer already excluded.
- Deep-linking directly to `?d=CODE` renders the category page underneath and opens the drawer,
  so a shared link never lands on a blank page.
- Escape closes, focus returns to the originating card, URL reverts.
- A handful of hero designs may get real standalone pages, hand-built. Not the default.

---

## P5. `/shortlist` — Enquiry shortlist

**Instances:** 1 (×2)
**Job:** turn browsing into a structured enquiry with article numbers already in it.
**Arrives from:** header counter, sticky bar, drawer.

### Layout
Header ("Your shortlist — N designs") → list → export actions → "what happens next" → related.

**List rows:** thumbnail · article number · category · price band · quantity input · remove.

**Export actions, three:**

1. **Send on WhatsApp** — primary, prominent. Composes:
   > Om Rakhi Udyog enquiry
   > OM-2418 — 100 pcs
   > OM-3302 — 50 pcs
   > OM-1170 — 200 pcs
   > Please send rates and availability.
2. **Download PDF** — generated in-browser with `pdf-lib`, thumbnails included, firm details in
   the header. He forwards it to his partner or prints it for a buying trip.
3. **Copy as text** — for the buyers who still use email.

**"What happens next".** Three lines setting expectation: we reply with rates within a working
day, MOQ applies per design, dispatch by transport. Prevents the enquiry going cold on an
unanswered assumption.

### Design decisions
- **Quantity defaults to the design's MOQ**, not to 1. It teaches the minimum without a lecture,
  and produces a realistic enquiry.
- **Shareable URL.** The shortlist encodes into a query parameter so a buyer can send the *link*
  to a colleague or a partner. `/shortlist?i=OM2418x100,OM3302x50`. Opening a shared link
  offers "add these to my shortlist" rather than silently overwriting an existing one.
- **The contact dock is hidden here.** The page's own send button is the action; a floating
  WhatsApp button would compete with it.
- **No "clear all" without confirmation.** Losing a 20-item shortlist to a mistap is the one
  unrecoverable error on this site.

### Interactive
Fully client-rendered island — there's no server-side state to render. Needs a skeleton while
`localStorage` reads, or the page flashes empty.

### Edge states
**Empty shortlist** is the important one and must not be a dead end: explain what the shortlist
does in one line, then show the category grid so the visitor can start. An empty screen is an
invitation to act, not an apology.

Item in the shortlist that no longer exists in the catalogue (season rollover): shown greyed,
labelled "no longer available", with a link to the category. Never silently dropped.

### Meta
`noindex`. It's a personal working state, not content.

---

## P6. `/catalogue` — Catalogue & downloads

**Instances:** 1 (×2)
**Job:** serve the buyer who wants everything in one file, on a plane, or to forward to his partner.

### Sections
- **Full catalogue PDF** — file size, page count, last updated date shown before the link. A
  40MB unlabelled download on mobile data is a hostile act.
- **Per-category PDFs** — most buyers want one category, not all twenty.
- **Request on WhatsApp** — for buyers who'd rather just be sent it.
- **Rate list** — not published. A line explaining that rates are sent on request, with the
  WhatsApp button. Honest and standard practice; saying nothing looks evasive.
- **Printed catalogue** — if one exists, offer to post it to established dealers.

### Design decisions
- Every download shows size, format and date. Trust comes from not surprising people.
- PDFs live in `public/catalogue/` and are versioned by season in the filename, so an old link
  in a WhatsApp thread from last year still resolves to the file it promised.

---

## P7. `/how-to-order` — How to order

**Instances:** 1 (×2)
**Job:** remove every unanswered question standing between a first-time buyer and a phone call.
**`[POS]`** If "legible supplier" is the chosen frame, this becomes the second-most-important
page on the site and moves to first in the nav. If "on-ramp", it absorbs a "starting a rakhi
business" section.

**Why this page is a genuine differentiator:** no competitor has a real one. Shree Rakhi answers
MOQ in an FAQ accordion; everyone else leaves it to the phone call. A first-time buyer from
Raipur has perhaps fifteen questions and currently has to ask all of them cold. Answering them
on a page is both a service and a filter — the buyers who call will be better prepared.

### Sections, in the order a buyer needs them

1. **The season calendar.** When to book, when goods dispatch, when to expect delivery. Anchored
   to the current Raksha Bandhan date, generated from config so it never goes stale. This is the
   single most useful thing on the page for someone new.
2. **Minimum order.** By category, plainly stated, in a table. No "contact us for MOQ".
3. **How rates work.** Net, ex-GST, per piece or per box, varying with volume. Why they aren't published.
4. **Pack configurations explained**, with a photograph of a card, a box and a carton. Retailers
   plan shelf space by this and rarely find it explained anywhere.
5. **Carded vs loose.** What each is, who buys which. Genuinely confusing to newcomers.
6. **Booking and payment.** Advance terms, balance, what confirms an order.
7. **Dispatch.** Transport vs courier, what a bilty/LR is, typical transit times to major cities
   from Kolkata, who pays freight.
8. **Damages and replacement.** Your actual policy. Stating one at all is a differentiator.
9. **Samples.** Whether you send a sample box, on what terms.
10. **FAQ.** Ten or twelve real questions.

### Design decisions
- **Prose and tables, not accordions.** A buyer scanning for MOQ shouldn't have to open eight
  panels to find it, and collapsed content is worse for search. Accordions only for the FAQ,
  where the question text itself is the scannable index.
- **Numbered steps only where the content is actually a sequence** — the booking-to-dispatch
  flow is; the FAQ isn't. Numbering non-sequential content is decoration pretending to be structure.
- The calendar renders as a horizontal timeline on desktop, a vertical list on mobile. It is the
  one place on the site where a custom graphic earns its place, because the shape of a year is
  genuinely spatial information.

### Meta
Schema: `FAQPage` on the FAQ block — these earn rich results and this is exactly the query type
("rakhi wholesale MOQ") that surfaces them.

---

## P8. `/custom` — Custom & private label

**Instances:** 1 (×2)
**Job:** capture the highest-margin enquiry type on the site.
**`[POS]`** Headline page under "specialist"; a quieter page under "on-ramp".

### Sections
What can be customised (design, colour, thread, card, box, logo) · minimum quantities for custom
work, which are higher than catalogue MOQ and should be stated up front to filter out
time-wasters · the sampling process and what it costs · lead times, with an explicit "book by"
date relative to the season · corporate and bulk gifting as a separate use case · a short gallery
of custom work already done, if any.

### Design decisions
- **State the minimum in the first screen.** Custom enquiries from buyers who want 200 pieces
  with their logo waste everyone's time; the number does the filtering for you.
- Dedicated enquiry form here rather than the generic contact form, capturing: quantity,
  customisation type, deadline, whether artwork exists. A custom enquiry with those four fields
  answered is worth ten that say "interested in customisation".
- If there's no gallery, don't fake one. Describe the capability and omit the section.

---

## P9. `/export` — For international buyers

**Instances:** 1 (×2)
**Job:** tell an overseas importer whether you can actually serve him, before he wastes a call.

### Sections
Countries served · what documentation you handle and what he handles · export packaging ·
minimum order value for export, which is typically much higher than domestic · lead times
including shipping · payment terms · a country grid linking to P10.

### Design decisions
- **Be honest about capability.** Both competitors advertise 20+ countries. If you've shipped to
  two, say two and describe the process properly. An importer who discovers mid-conversation
  that you've never filed an export document will not come back.
- Lead times get their own emphasis: an overseas buyer's real question is whether goods land
  before his selling window, not what they cost.
- Currency is never converted or displayed. Rates are quoted on enquiry.

---

## P10. `/export/[country]` — Per-country pages

**Instances:** 5–8 (×2). Suggested: USA, UK, Canada, Australia, UAE, Mauritius.
**Job:** rank for "import rakhi from India to {country}" and speak to that market specifically.

### Content per country, from a data file
Which categories sell in that market and why · typical shipping mode and transit time from
Kolkata · any customs notes · approximate minimum order value · a named dealer reference if one
exists.

### Design decisions
- **Each page must carry at least 40% unique content.** Both competitors run these pages as
  near-duplicates with the country name swapped. That's a search liability and it's obvious to a
  human reader. If you can't say something specific about Mauritius, don't build a Mauritius page.
- Build in **Phase 4**, after every substantive page is finished. These are volume, not value.

---

## P11. `/about` — About

**Instances:** 1 (×2)
**Job:** convince a suspicious out-of-state buyer that this is a real firm with real people.

### Sections
The street and the shop · how it started and how it's changed · how rakhis are actually made
here — in-house finishing and home-based artisan work · who does the work, with real photographs
of hands, the workshop, the packing table · what you're trying to do differently **`[POS]`** ·
the family or team, with names.

### Design decisions
- **Photographs of the actual place carry this page.** Not stock, not AI-generated, not a
  rendered illustration. This is the page where a buyer decides you exist, and generated imagery
  reads as fabrication precisely where fabrication is most damaging.
- **Editorial layout, not a card grid.** Long-form prose with full-bleed photographs between
  paragraphs. The one page on the site allowed to break the catalogue's grid discipline, because
  it's the only page doing narrative work.
- The women-artisan angle is real and worth stating if it's true of your operation, but state it
  as fact — how many, doing what — rather than as a marketing line. Competitors run it as a
  slogan; specifics distinguish you from them.
- No founding-year claim until you're confident in one. An unclaimed year is better than a
  disputed one.

---

## P12. `/visit` — Visit us

**Instances:** 1 (×2)
**Job:** get a dealer from Howrah Station to your second-floor office without a phone call.

### Sections
Full address with landmark · static map linking to Google Maps · written directions from Howrah
Station, Sealdah, and M.G. Road metro · what the building looks like, with photographs of the
entrance and the stairwell · parking reality, stated honestly · season vs off-season hours ·
"message before you come" with the WhatsApp button · what to expect on arrival — can you see
samples, is there a display, should you bring anything.

### Design decisions
- **Photographs of the entrance are the point of this page.** Burrabazar addressing is
  landmark-based and building numbers are frequently unhelpful. A photo of the doorway is worth
  three paragraphs of directions, and no competitor does it.
- Static map image, not an iframe. Same reasoning as the home page.
- Hours displayed as a table with the current day highlighted client-side.
- Directions written as prose per origin, not as a single generic paragraph.

---

## P13. `/contact` — Contact

**Instances:** 1 (×2)
**Job:** catch the buyer who won't or can't use WhatsApp.

### Sections
Every channel, laid out plainly: phone (`tel:`), WhatsApp, email, Instagram, IndiaMART, address ·
a short form · response-time expectation · a note on which channel is fastest.

### Form fields
Name · firm name · city · phone · buyer type (retailer / distributor / exporter / online seller /
new to the trade) · message. Six fields.

- **Firm name and city are required.** They qualify the lead and they're trivially answerable.
- **Buyer type is a select.** It routes the reply and it tells you, over a season, who the site
  is actually reaching.
- Email is optional. Many buyers in this trade don't use one, and a required email field is a
  real drop-off.
- Submits via Web3Forms to `/thanks`. No backend.

### Design decisions
- **WhatsApp sits above the form**, at equal or greater weight. The form exists for the minority
  who need it; the majority should not have to scroll past it.
- No CAPTCHA. Web3Forms' honeypot handles spam at this volume, and a CAPTCHA on a six-field B2B
  form costs more genuine enquiries than it saves.
- Inline validation on blur, never on keystroke. Errors name the problem and the fix.

---

## P14. `/thanks` — Enquiry received

**Instances:** 1 (×2). `noindex`.
**Job:** confirm receipt and set expectation.

One clear confirmation line, what happens next and by when, the WhatsApp number in case they'd
rather follow up directly, and two links back into the catalogue. **Not a dead end** — a
confirmation page that only says "thank you" wastes the one moment the buyer is most engaged.

---

## P15. `/wholesale-rakhi-in-[city]` — City pages

**Instances:** 8–12 (×1, English only initially).
**Job:** capture "rakhi wholesale supplier in {city}" search traffic.
**Build in Phase 4.** These are the last thing built, after everything real is finished.

### Content per city, from a data file
Which categories sell in that market · transport route and typical transit time from Kolkata ·
how many dealers you serve there, if any · the local wholesale market by name, if relevant ·
a normal CTA block.

### Design decisions
- **Same 40%-unique rule as the country pages.** KavyaRakhi runs dozens of these nearly identical
  and ranks anyway; that doesn't make it a good idea, and it's a well-known ranking liability.
- Build a city page only where you can say something true and specific. Eight good ones beat
  thirty thin ones.
- These pages exist for search engines but must still be worth a human's time, because the
  human who lands on one is a live lead.

---

## P16. `/journal` and `/journal/[slug]` — Journal

**Instances:** 1 index + N posts. **Phase 4, optional.**
**Job:** rank for informational queries and demonstrate expertise.

Only build this if posts will actually get written. A blog whose most recent entry is eighteen
months old actively damages credibility — it's the clearest possible signal of an abandoned site.
Four good posts a year beats twenty in month one and none after.

Post ideas that are genuinely useful rather than SEO filler: how pack configurations work, what
changed in rakhi demand this season, a guide to starting a rakhi retail counter, how transport
booking works for a first-time buyer.

---

## P17. `/privacy` and `/terms`

**Instances:** 2 (×2). Plain, short, honest. Cover: what the contact form collects and where it
goes, that the shortlist is stored locally in the browser and never transmitted, analytics and
what it does and doesn't record, and that the site sells nothing directly. No boilerplate cloned
from an unrelated e-commerce store.

---

## P18. `/404`

**Job:** recover the visitor, usually one following an old WhatsApp link to a retired design.

Short, plain message. Search box. Full category list. WhatsApp button. **No illustration, no
joke.** A buyer who hit a dead link wants a route forward, not a cartoon.

**Special case worth handling:** if the path looks like a retired article number
(`?d=OM-1140` for a design no longer in the catalogue), say so specifically — "OM-1140 was part
of an earlier season" — and link to its former category. Season rollover will generate exactly
this, and handling it well is a small kindness that reads as competence.

---

# PART C — Component inventory

Build these once. Every page above is assembled from them.

**Static (Astro, no JS):**
`Header` · `Footer` · `SeasonStrip` · `PageHeader` · `ProseBlock` · `StatBar` · `CategoryCard` ·
`TestimonialCard` · `BuyerTypeRow` · `CtaBlock` · `SpecTable` · `FaqList` · `StaticMap` ·
`DownloadRow` · `CountryCard` · `Breadcrumb`

**Interactive (React islands):**
`ProductGrid` (filter + render) · `FilterChips` · `ProductCard` (shortlist control) ·
`DesignDrawer` · `ShortlistProvider` (context + localStorage) · `ShortlistCounter` ·
`ShortlistDrawer` · `ShortlistPage` · `SearchOverlay` · `CategorySearch` · `ContactForm` ·
`CustomEnquiryForm` · `LanguageToggle` · `HoursTable` · `MobileMenu`

**Rule:** an island is a leaf. If a component doesn't need state, it's Astro. A React component
that wraps static content forces hydration of everything inside it and quietly blows the JS budget.

---

# PART D — Cross-linking map

Internal links are the cheapest SEO on the site and the main way a buyer moves through it.

```
Home ──► every category, /collections, /how-to-order, /visit, /export
Collections ──► every category, /how-to-order
Category ──► 2–3 sibling categories, /how-to-order, /catalogue, drawer
Drawer ──► shortlist, WhatsApp, category
Shortlist ──► /how-to-order, /contact, back to categories
How to order ──► /catalogue, /custom, /contact, /visit
Export ──► country pages, /custom, /contact
Custom ──► /how-to-order, /contact
About ──► /visit, /collections
Visit ──► /contact, map
City page ──► 3 categories relevant to that city, /how-to-order, /contact
Footer ──► everything
```

Every page must be reachable from the footer. No orphans.

---

# PART E — Build order

| Order | What | Depends on |
|---|---|---|
| 1 | Tokens (A0), Header (A1), Footer (A2), layouts | art direction chosen |
| 2 | Content schemas, image pipeline (A10) | category list, first photos |
| 3 | P3 Category page — build this first, it's the hardest | schemas, ~20 products |
| 4 | P4 Drawer, A4 Shortlist, P5 Shortlist page | P3 |
| 5 | P2 Collections index, A5 Search | P3 |
| 6 | P1 Home | P2, P3, testimonials |
| 7 | P7 How to order, P12 Visit, P11 About, P13 Contact, P14 Thanks | copy written |
| 8 | P6 Catalogue, P8 Custom | PDFs, custom policy |
| 9 | A6 Hindi, P9/P10 Export | translation, export facts |
| 10 | P15 City pages, P16 Journal | everything else done |
| 11 | P17 legal, P18 404, meta, schema, OG images, analytics | — |

**Build the category page before the home page.** It's the template that carries the site, it's
where all the hard problems live (image pipeline, filtering, shortlist, drawer), and the home
page is largely assembled from components the category page forces you to build properly.

---

# PART F — Acceptance summary

| Page | Indexed | JS budget | Primary CTA | Blocking content |
|---|---|---|---|---|
| `/` | yes | 40KB | Browse collection | 20 category photos, 10 hero designs, 3 testimonials |
| `/collections` | yes | 50KB | Open a category | category list + counts |
| `/collections/[cat]` | yes | 90KB | Shortlist / WhatsApp | full product data + photos |
| drawer | via canonical | — | Ask about {code} | detail photos |
| `/shortlist` | no | 60KB | Send on WhatsApp | — |
| `/catalogue` | yes | 20KB | Download / request | PDFs |
| `/how-to-order` | yes | 20KB | WhatsApp | MOQ, terms, dispatch facts |
| `/custom` | yes | 40KB | Custom enquiry form | custom minimums, lead times |
| `/export` | yes | 20KB | WhatsApp | honest export capability |
| `/export/[country]` | yes | 20KB | WhatsApp | per-country specifics |
| `/about` | yes | 10KB | Visit us | workshop + street photos, the story |
| `/visit` | yes | 20KB | WhatsApp before you come | entrance photos, hours |
| `/contact` | yes | 40KB | WhatsApp | — |
| `/thanks` | no | 10KB | Back to collection | — |
| `/wholesale-rakhi-in-[city]` | yes | 20KB | WhatsApp | per-city specifics |
| `/404` | no | 20KB | Search | — |

**Site-wide done:** every page passes the A9 budget on throttled 4G; no page contains lorem
ipsum or a hardcoded number that should come from data; every product image has generated alt
text; the whole site is navigable by keyboard; `prefers-reduced-motion` is respected; nothing
anywhere says 2024.
