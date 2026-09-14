/**
 * P18 — the one 404 case worth handling specifically.
 *
 * Season rollover generates exactly this: someone follows a link from an old
 * WhatsApp thread to a design that is no longer in the catalogue. Saying
 * "OM-1140 was part of an earlier season" and linking to its collection is a
 * small kindness that reads as competence; a bare 404 reads as a dead firm.
 */
import { loadCatalogue, catName, href, locale } from './catalogue-client.ts';
import { loadSearch } from './header.ts';

const slot = document.querySelector<HTMLElement>('[data-retired]');

/* The field hands the first keystroke to the real search overlay rather than
   running a second, weaker search of its own. Submitting without JS falls
   through to the form's own action, which is the collections page. */
const form = document.querySelector<HTMLFormElement>('[data-nf-search]');
const field = form?.querySelector<HTMLInputElement>('input');
if (form && field) {
  let handed = false;
  const hand = () => {
    if (handed) return;
    handed = true;
    void loadSearch().then((m) => m.open(field.value));
  };
  field.addEventListener('input', hand);
  form.addEventListener('submit', (e) => { e.preventDefault(); handed = false; hand(); });
}

/**
 * When the path is not an article number it is usually still a word: a stale
 * /kundan-rakhis, a hand-typed /collections/pearl, a link that lost a segment.
 * Matching those words against the collection names turns most of them into
 * the page the visitor was actually asking for.
 */
const guessSlot = document.querySelector<HTMLElement>('[data-guess]');
if (guessSlot && !/\b(OM)[-_ ]?\d{4}\b/i.test(decodeURIComponent(location.pathname))) {
  const words = decodeURIComponent(location.pathname)
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 2 && w !== 'collections' && w !== 'rakhi');

  if (words.length) {
    loadCatalogue()
      .then((cat) => {
        const hit = cat.categories.find((c) => {
          const name = `${c.g} ${c.ne}`.toLowerCase();
          return words.some((w) => name.includes(w) || w.includes(c.g.split('-')[0]));
        });
        if (!hit) return;
        const L = locale();
        const label = catName(hit);
        const link = href('/collections/' + hit.g);
        guessSlot.innerHTML =
          L === 'hi'
            ? `<p>क्या आप <a href="${link}"><strong>${label}</strong></a> ढूँढ रहे थे? उसमें ${hit.n} डिज़ाइन हैं।</p>`
            : `<p>Were you looking for <a href="${link}"><strong>${label}</strong></a>? It has ${hit.n} designs.</p>`;
        guessSlot.hidden = false;
      })
      .catch(() => { /* the routes below are still a way forward */ });
  }
}

if (slot) {
  const url = new URL(location.href);
  const raw = url.searchParams.get('d') ?? decodeURIComponent(url.pathname);
  const match = /\b(OM)[-_ ]?(\d{4})\b/i.exec(raw);

  if (match) {
    const code = `${match[1].toUpperCase()}-${match[2]}`;
    const L = locale();
    loadCatalogue()
      .then((cat) => {
        const live = cat.products.find((p) => p.c === code);
        const gone = cat.retired.find((p) => p.c === code);
        const target = live ?? gone;
        if (!target) return;

        const category = cat.categories.find((c) => c.g === target.g);
        const catLabel = category ? catName(category) : '';
        const link = live
          ? `${href('/collections/' + target.g)}?d=${code}`
          : href('/collections/' + target.g);

        slot.innerHTML = live
          ? L === 'hi'
            ? `<p><strong>${code}</strong> अब भी कैटलॉग में है। <a href="${link}">${catLabel} में देखिए</a>।</p>`
            : `<p><strong>${code}</strong> is still in the catalogue. <a href="${link}">Open it in ${catLabel}</a>.</p>`
          : L === 'hi'
            ? `<p><strong>${code}</strong> पिछले किसी सीज़न का हिस्सा था और अब कैटलॉग में नहीं है। इससे मिलती-जुलती चीज़ें <a href="${link}">${catLabel}</a> में मिलेंगी — या नंबर व्हाट्सएप कर दीजिए, हम बता देंगे कि इसकी जगह अब क्या है।</p>`
            : `<p><strong>${code}</strong> was part of an earlier season and is no longer in the catalogue. The nearest things to it are in <a href="${link}">${catLabel}</a> — or send us the number on WhatsApp and we will tell you what replaced it.</p>`;
        slot.hidden = false;
      })
      .catch(() => { /* the plain 404 below is still a route forward */ });
  }
}
