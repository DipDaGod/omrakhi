# What still has to come from the firm

The site is built and it runs. What it does not yet have is the firm's own
material. Everything below is flagged in the code — as a `null`, an empty file,
a `draft: true`, or a generated stand-in — so nothing on the live site is
invented, and nothing needs hunting for.

Work down this list and the site goes from complete to true.

---

## 1. Photography — the largest job

Every product photograph on the site right now is a generated stand-in: a flat
coloured shape reading "photograph to be supplied", with the article number on
the card beneath it. They exist so the layout, the grid, the drawer and the
budgets could be built and reviewed.

There are only three stand-in files for the whole catalogue, shared out by a
hash of the article number. Astro turns every distinct source image into a
dozen variants, so one stand-in per article meant close to 4,000 emitted files
and a three-and-a-half minute build; three means 110 and fifteen seconds. This
affects nothing about real photography — each article still gets its own.

**To replace one:** put the real file at

```
src/assets/products/<category>/<ARTICLE>.jpg      e.g. src/assets/products/ad-rakhi/OM-1001.jpg
```

and rebuild. A real file always wins over a stand-in, and the stand-in is
ignored from then on. No code changes, no lists to update.

Optional second photograph for the drawer, where the design warrants a closer
look:

```
src/assets/products/<category>/<ARTICLE>-detail.jpg
```

Set `detailPhoto: true` on that article in `src/content/products.json`.

**Shooting notes**, so the grid stays consistent:

- Square crop, or croppable to square without losing the piece.
- One fixed surface and one lighting setup for the whole range. A grid of forty
  reads as a professional catalogue only if the plinth does not change.
- Maximum 2000px on the long edge. Anything larger is wasted — public delivery
  is capped at 1400px.
- JPEG. The build produces AVIF and WebP from it.

There are also eleven editorial photographs in `src/assets/site/`, currently
stand-ins, that carry `/about`, `/visit` and the pack explainer on
`/how-to-order`:

| File | What it is | Where it appears |
|---|---|---|
| `hero.jpg` | the hero photograph | `/` |
| `street.jpg` | Kalakar Street | `/about` |
| `workshop.jpg` | the workshop | `/about` |
| `hands.jpg` | setting work, hands | `/about` |
| `packing-table.jpg` | the packing table | `/about` |
| `entrance.jpg` | the doorway at P-15 | `/visit` |
| `stairwell.jpg` | the stairs | `/visit` |
| `pack-card.jpg` | a carded rakhi | `/how-to-order` |
| `pack-box.jpg` | a box of twelve | `/how-to-order` |
| `pack-carton.jpg` | a sealed carton | `/how-to-order` |
| `map.jpg` | a static map of the location | `/`, `/visit` |

The `/about` and `/visit` photographs must be of the actual place. Not stock, not
generated, not an illustration. Those are the two pages where a buyer decides the
firm exists, and fabricated imagery reads as fabrication precisely where it does
most damage. The entrance photograph on `/visit` is the single most useful image
on the site: Burrabazar addressing is landmark-based and building numbers are
frequently unhelpful.

## 2. The catalogue

`src/content/products.json` holds 249 articles with the right shape — article
number, category, materials, colours, size, pack configuration, MOQ, price band,
new flag. **It is generated sample data, not the real range.**

Replace it with the firm's actual catalogue. The schema it is validated against
is in `src/content.config.ts`; the build fails loudly if a field is wrong, which
is the intended behaviour.

Once the real data is in, delete `scripts/seed-products.mjs`. It has no other
purpose and leaving it invites someone to run it over real data.

The twelve collections in `src/content/categories/*.json` — names, the ~80 words
of copy, materials, MOQ, pack types, the region each sells strongest in — are
written to be true of the trade and should be read through and corrected by
someone who sells these goods. The "region" line in particular is an insider
detail that only works if it is right.

## 3. Commercial terms — `src/config/trade.ts`

**Every value in this file is a commitment the firm has to actually keep.** They
are drafted to trade-standard terms so `/how-to-order`, `/custom` and `/export`
could be built. Confirm each one:

- Advance percentage and what confirms an order
- How rates are quoted, and how they step with volume
- Transit times by city
- Freight terms
- The damages and replacement policy, and its seven-day window
- Whether a sample box is sent, and on what terms
- Custom minimums (currently 1,000 per design; 2,000 for a printed logo card)
- Sampling lead time and whether sampling is charged
- Which export documents the firm actually handles

Publishing a policy the firm does not follow is worse than publishing none. The
replacement policy in particular is stated on the site as a differentiator — it
has to be real.

## 4. Proof numbers — `src/config/site.ts`

```ts
export const PROOF = {
  yearsInTrade: null,
  dealers: null,
  states: null,
  countries: null,
};
```

Each one that stays `null` is omitted from the page rather than guessed at. Fill
in only what can be stood behind. "42 dealers across 7 states" is worth more to a
buyer who will meet those dealers than an unverifiable "9,000+".

`countries` is used on `/export`, where the page currently says plainly that no
number is being claimed until the export record is confirmed. Both competitors
advertise twenty-plus countries; an importer who finds out mid-conversation that
no export document has ever been filed does not come back.

## 5. Testimonials — `src/content/testimonials.json`

Currently `[]`, which means the home page omits that section entirely. That is
deliberate and correct: a placeholder testimonial is a fabricated record.

`src/content/testimonials.example.json` shows the shape. Each entry needs the
dealer's name, firm, city, what they buy, how many years, and their own words —
**with their permission**. Two or three real ones are worth more than ten
anonymous quotes, and the section appears automatically once the file is not
empty.

## 6. The story — `src/config/about.ts`

```ts
export const STORY = {
  foundedYear: null,
  generations: null,
  artisans: null,   // { count, work, homeBased }
  team: [],
};
```

Same rule: null means the sentence is not written. An unclaimed founding year is
better than a disputed one, and a team section with invented names is worse than
no team section.

The artisan figures are worth filling in if they are true. The page currently
describes home-based artisan work in general terms; stating how many people,
doing what, turns a marketing line into a fact — and competitors run it as a
slogan, which is exactly why specifics distinguish you.

## 7. Export country pages — `src/content/countries.json`

Six countries, each with market notes, shipping mode, transit, customs notes and
a minimum order value. **All six are `draft: true`**, which means they build and
are linked, show a visible "not yet confirmed" notice, and carry `noindex`.

Read each one. Correct what is wrong, delete what cannot be stood behind, then
set `draft: false` on the ones that survive. A country page with nothing specific
to say about that country should not exist — it is a search liability and it is
obvious to a human reader.

## 8. City pages — `src/content/cities.json`

Eight cities, same arrangement: built, linked from the footer, `draft: true` and
`noindex` until confirmed. Each needs to be true about that market specifically —
which collections sell there, the named wholesale market, the transport route,
and how many dealers the firm actually supplies (`dealerCount`, currently 0
everywhere, which hides that line).

Eight good ones beat thirty thin ones.

## 9. Catalogue PDFs — `src/config/trade.ts` → `CATALOGUE`

`/catalogue` currently shows the downloads as "Being prepared", with the design
and collection counts pulled from live data. Once the PDFs exist, put them in
`public/catalogue/` with the season in the filename — so a link in a WhatsApp
thread from last year still resolves to the file it promised — and fill in:

```ts
full: { file: '/catalogue/om-rakhi-udyog-2027.pdf', sizeMb: 18, pages: 44, updated: 'January 2027' },
```

Size, page count and date are shown before the link, deliberately.

## 10. Web3Forms key

The access key lives in `src/config/site.ts` as `SITE.web3formsKey`, not in an
env var — it's public by design (it appears in the HTML of the form that posts
with it) and Web3Forms does its own spam/domain checks server-side, so an env
var buys no secrecy. To rotate it, edit that one line and redeploy.

---

## Season rollover, each December

Two values in `src/config/site.ts`:

```ts
export const SEASON = {
  year: 2027,
  rakshaBandhan: '2027-08-17',
};
```

The status strip, the calendar on `/how-to-order` and the "book by" date on
`/custom` all derive from them. Nothing else on the site contains a year.

For articles that leave the range, set `available: false` rather than deleting
the record. The design then disappears from the catalogue, but an old WhatsApp
link to `?d=OM-1140` is answered specifically — "OM-1140 was part of an earlier
season", with a link to its former collection — instead of hitting a bare 404.
