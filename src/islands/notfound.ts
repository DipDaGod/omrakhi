/**
 * P18 — the one 404 case worth handling specifically.
 *
 * Season rollover generates exactly this: someone follows a link from an old
 * WhatsApp thread to a design that is no longer in the catalogue. Saying
 * "OM-1140 was part of an earlier season" and linking to its collection is a
 * small kindness that reads as competence; a bare 404 reads as a dead firm.
 */
import { loadCatalogue, catName, href, locale } from './catalogue-client.ts';

const slot = document.querySelector<HTMLElement>('[data-retired]');

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
