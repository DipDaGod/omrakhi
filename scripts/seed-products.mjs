/**
 * Generates src/content/products.json.
 *
 * THIS PRODUCES STAND-IN CATALOGUE DATA. It exists so the site builds, renders
 * and can be reviewed before the real catalogue is photographed and entered.
 * Every record here must be replaced with a real article before launch — see
 * CONTENT.md. Once real data is in, this script is no longer run.
 */
import { writeFileSync } from 'node:fs';

// [article-number block, count, categoryId]
const BLOCKS = [
  [1001, 28, 'ad-rakhi'],
  [1201, 22, 'kundan-rakhi'],
  [1401, 26, 'pearl-rakhi'],
  [1601, 40, 'stone-rakhi'],
  [1801, 18, 'thread-rakhi'],
  [2001, 20, 'bhaiya-bhabhi-rakhi'],
  [2201, 16, 'lumba-rakhi'],
  [2401, 18, 'kids-rakhi'],
  [2601, 12, 'rudraksha-rakhi'],
  [2801, 20, 'metal-rakhi'],
  [3001, 16, 'pendant-rakhi'],
  [3201, 10, 'handicraft-rakhi'],
];

const CAT = {
  'ad-rakhi':            { mats: ['stone','metal','thread'], aud: 'brother', band: [2,3], moq: 100, pack: 'carded', size: [32,42], en: ['American diamond','AD stone','Diamond cluster','AD chain'], hi: ['अमेरिकन डायमंड','एडी स्टोन','डायमंड क्लस्टर','एडी चेन'] },
  'kundan-rakhi':        { mats: ['stone','metal','thread'], aud: 'brother', band: [2,4], moq: 100, pack: 'carded', size: [38,52], en: ['Kundan','Kundan meenakari','Kundan cluster','Jadau kundan'], hi: ['कुंदन','कुंदन मीनाकारी','कुंदन क्लस्टर','जड़ाऊ कुंदन'] },
  'pearl-rakhi':         { mats: ['pearl','thread','metal'], aud: 'brother', band: [1,3], moq: 100, pack: 'carded', size: [28,40], en: ['Pearl cluster','Single pearl','Pearl and stone','Moti drop'], hi: ['मोती क्लस्टर','सिंगल मोती','मोती और पत्थर','मोती ड्रॉप'] },
  'stone-rakhi':         { mats: ['stone','thread','metal'], aud: 'brother', band: [1,4], moq: 100, pack: 'carded', size: [26,46], en: ['Stone cluster','Chain stone','Single stone','Multi-stone'], hi: ['स्टोन क्लस्टर','चेन स्टोन','सिंगल स्टोन','मल्टी स्टोन'] },
  'thread-rakhi':        { mats: ['thread'], aud: 'brother', band: [1,2], moq: 500, pack: 'loose', size: [18,28], en: ['Resham dori','Cotton dori','Beaded thread','Braided dori'], hi: ['रेशम डोरी','सूती डोरी','मोतीदार धागा','गुँथी डोरी'] },
  'bhaiya-bhabhi-rakhi': { mats: ['stone','pearl','metal','thread'], aud: 'bhaiya-bhabhi', band: [2,4], moq: 50, pack: 'carded', size: [34,48], en: ['Bhaiya bhabhi pair','Paired set','Couple set','Matched pair'], hi: ['भैया भाभी जोड़ी','जोड़ी सेट','कपल सेट','मैच्ड जोड़ी'] },
  'lumba-rakhi':         { mats: ['stone','pearl','thread','zari'], aud: 'lumba', band: [2,3], moq: 100, pack: 'carded', size: [60,95], en: ['Lumba latkan','Beaded lumba','Zari lumba','Pearl lumba'], hi: ['लुम्बा लटकन','मोतीदार लुम्बा','ज़री लुम्बा','मोती लुम्बा'] },
  'kids-rakhi':          { mats: ['resin','thread'], aud: 'kids', band: [1,2], moq: 200, pack: 'carded', size: [24,36], en: ['Kids figure','Light-up figure','Cartoon figure','Elastic figure'], hi: ['बच्चों का फ़िगर','लाइट वाला फ़िगर','कार्टून फ़िगर','इलास्टिक फ़िगर'] },
  'rudraksha-rakhi':     { mats: ['rudraksha','metal','thread'], aud: 'god', band: [1,3], moq: 100, pack: 'carded', size: [22,34], en: ['Rudraksha bead','Capped rudraksha','Rudraksha and stone','Twin rudraksha'], hi: ['रुद्राक्ष मनका','कैप रुद्राक्ष','रुद्राक्ष और पत्थर','जोड़ा रुद्राक्ष'] },
  'metal-rakhi':         { mats: ['metal','thread','stone'], aud: 'god', band: [2,4], moq: 100, pack: 'carded', size: [30,44], en: ['Om motif','Swastik motif','Ganesh motif','Shree motif'], hi: ['ॐ मोटिफ़','स्वस्तिक मोटिफ़','गणेश मोटिफ़','श्री मोटिफ़'] },
  'pendant-rakhi':       { mats: ['metal','stone','pearl'], aud: 'brother', band: [2,4], moq: 50, pack: 'carded', size: [16,26], en: ['Slider bracelet','Pendant chain','Adjustable bracelet','Charm bracelet'], hi: ['स्लाइडर ब्रेसलेट','पेंडेंट चेन','एडजस्टेबल ब्रेसलेट','चार्म ब्रेसलेट'] },
  'handicraft-rakhi':    { mats: ['terracotta','wood','thread'], aud: 'brother', band: [1,3], moq: 100, pack: 'carded', size: [30,46], en: ['Terracotta disc','Wound thread','Wooden bead','Painted terracotta'], hi: ['टेराकोटा डिस्क','लपेटा धागा','लकड़ी मनका','रंगी टेराकोटा'] },
};

const COLOURS = [
  { family: 'maroon', en: ['maroon','deep red'], hi: ['मैरून','गहरा लाल'] },
  { family: 'red',    en: ['red','vermilion'],   hi: ['लाल','सिंदूरी'] },
  { family: 'gold',   en: ['gold','antique gold'], hi: ['सुनहरा','एंटीक गोल्ड'] },
  { family: 'silver', en: ['silver','oxidised silver'], hi: ['चाँदी','ऑक्सिडाइज़्ड चाँदी'] },
  { family: 'green',  en: ['green','emerald'],   hi: ['हरा','पन्ना'] },
  { family: 'blue',   en: ['blue','royal blue'], hi: ['नीला','रॉयल ब्लू'] },
  { family: 'pastel', en: ['ivory','peach'],     hi: ['हाथीदाँत','पीच'] },
  { family: 'multi',  en: ['multicolour'],       hi: ['मल्टीकलर'] },
];

// Deterministic PRNG, so regenerating does not churn the file.
let s = 20270817;
const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const between = ([lo, hi]) => lo + Math.floor(rnd() * (hi - lo + 1));

const products = [];
for (const [start, count, category] of BLOCKS) {
  const c = CAT[category];
  for (let i = 0; i < count; i++) {
    const n = start + i;
    const code = `OM-${String(n).padStart(4, '0')}`;
    const k = i % c.en.length;
    const col = pick(COLOURS);
    const band = between(c.band);
    const perCard = c.aud === 'bhaiya-bhabhi' ? 2 : 1;
    const perBox = c.pack === 'loose' ? 100 : pick([12, 12, 24]);
    products.push({
      id: code,
      category,
      name: { en: `${c.en[k]} rakhi`, hi: `${c.hi[k]} राखी` },
      materials: c.mats.slice(0, 1 + Math.floor(rnd() * c.mats.length)),
      colours: col.en,
      colourFamily: col.family,
      sizeMm: between(c.size),
      pack: { perCard, perBox, perCarton: perBox * pick([10, 20, 20]) },
      packType: c.pack,
      moq: c.moq,
      priceBand: band,
      new: i < Math.ceil(count * 0.25),
      priority: band * 10 + (count - i),
      available: true,
      detailPhoto: i % 3 === 0,
    });
  }
}

// A handful of retired articles, so /shortlist and /404 can be tested against
// the season-rollover case they are specified to handle.
for (const [code, category] of [['OM-1140', 'ad-rakhi'], ['OM-1590', 'pearl-rakhi'], ['OM-2390', 'lumba-rakhi']]) {
  products.push({
    id: code, category,
    name: { en: 'Retired design', hi: 'बंद डिज़ाइन' },
    materials: ['stone'], colours: ['maroon'], colourFamily: 'maroon', sizeMm: 34,
    pack: { perCard: 1, perBox: 12, perCarton: 240 }, packType: 'carded',
    moq: 100, priceBand: 2, new: false, priority: 0, available: false, detailPhoto: false,
  });
}

writeFileSync('src/content/products.json', JSON.stringify(products, null, 2) + '\n');
console.log(`wrote ${products.length} articles across ${BLOCKS.length} categories`);
