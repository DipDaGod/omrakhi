/**
 * A10 — image preparation. Runs before every build.
 *
 * Two jobs:
 *
 * 1. Stand-in photography. Real photographs are committed as
 *    src/assets/products/<category>/<ARTICLE>.jpg. Where one does not exist
 *    yet, the article falls back to one of THREE shared stand-ins in
 *    src/assets/products/_stand-in/. Shared rather than per-article because
 *    Astro optimises every distinct source file into a dozen variants: 336
 *    per-article stand-ins emitted close to 4,000 files and dominated the
 *    build, where three emit 36. Real files are NEVER touched — dropping a
 *    real photograph in is all it takes. Stand-ins are gitignored.
 *
 * 2. The LQIP manifest. Every product image is reduced to a 20px blurred JPEG
 *    and inlined as base64 in src/data/lqip.json, which is what keeps CLS
 *    under the A9 budget while photographs stream in.
 */
import { mkdirSync, existsSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import sharp from 'sharp';

const ROOT = dirname(new URL(import.meta.url).pathname).replace(/\/scripts$/, '');
const PRODUCT_DIR = join(ROOT, 'src/assets/products');
const STAND_IN_DIR_NAME = '_stand-in';
const STAND_IN_DIR = join(PRODUCT_DIR, STAND_IN_DIR_NAME);
const SITE_DIR = join(ROOT, 'src/assets/site');

const INK = '#1b1714';
const MUTED = '#6b625a';
const PLINTH = '#efe8dc';

/** One hue per stand-in, so a grid of them is not one flat wall. */
const STAND_IN_HUES = [8, 38, 146];
const STAND_INS = STAND_IN_HUES.length;
function tint(i) {
  return `hsl(${STAND_IN_HUES[i]} 18% 82%)`;
}

/**
 * Which shared stand-in an article gets.
 * Must match standInIndex() in src/lib/images.ts.
 */
function standInIndex(code) {
  let h = 0;
  for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return h % STAND_INS;
}

function productSvg(i, label, size) {
  const r = Math.round(size * 0.22);
  const c = size / 2;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="${PLINTH}"/>
    <circle cx="${c}" cy="${c * 0.92}" r="${r}" fill="${tint(i)}"/>
    <circle cx="${c}" cy="${c * 0.92}" r="${r * 0.42}" fill="${PLINTH}"/>
    <path d="M ${c - r} ${c * 0.92} L ${size * 0.08} ${size * 0.86}
             M ${c + r} ${c * 0.92} L ${size * 0.92} ${size * 0.86}"
          stroke="${tint(i)}" stroke-width="${size * 0.02}" fill="none"/>
    <text x="${c}" y="${size * 0.94}" text-anchor="middle" font-family="DejaVu Sans, sans-serif"
          font-size="${size * 0.052}" fill="${MUTED}" letter-spacing="1">${label}</text>
  </svg>`);
}

function siteSvg(label, w, h) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="${w}" height="${h}" fill="${PLINTH}"/>
    <rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="none" stroke="${MUTED}" stroke-width="2" stroke-dasharray="10 8"/>
    <text x="${w / 2}" y="${h / 2 - 6}" text-anchor="middle" font-family="DejaVu Sans, sans-serif"
          font-size="${Math.round(Math.min(w, h) * 0.07)}" fill="${INK}">${label}</text>
    <text x="${w / 2}" y="${h / 2 + Math.round(Math.min(w, h) * 0.07)}" text-anchor="middle"
          font-family="DejaVu Sans, sans-serif" font-size="${Math.round(Math.min(w, h) * 0.042)}" fill="${MUTED}">photograph to be supplied</text>
  </svg>`);
}

/** The real photograph for a slot, or null if none has been supplied yet. */
function realPhoto(dir, base, suffix) {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const p = join(dir, `${base}${suffix ? `-${suffix}` : ''}.${ext}`);
    if (existsSync(p)) return p;
  }
  return null;
}

const products = JSON.parse(readFileSync(join(ROOT, 'src/content/products.json'), 'utf8'));

let made = 0;
let real = 0;
const lqip = {};

/* Sweep the per-article stand-ins an earlier version of this script wrote.
   They are gitignored, so they linger in a working tree that predates the
   shared ones — and anything left in assets/products is globbed and optimised,
   which is the whole cost this change exists to remove. */
let swept = 0;
if (existsSync(PRODUCT_DIR)) {
  for (const cat of readdirSync(PRODUCT_DIR, { withFileTypes: true })) {
    if (!cat.isDirectory() || cat.name === STAND_IN_DIR_NAME) continue;
    const dir = join(PRODUCT_DIR, cat.name);
    for (const f of readdirSync(dir)) {
      if (f.includes('.placeholder')) {
        rmSync(join(dir, f));
        swept++;
      }
    }
  }
}

/* The three shared stand-ins, and one LQIP each. */
mkdirSync(STAND_IN_DIR, { recursive: true });
for (let i = 0; i < STAND_INS; i++) {
  const path = join(STAND_IN_DIR, `${i}.placeholder.jpg`);
  if (!existsSync(path)) {
    await sharp(productSvg(i, 'Photograph to be supplied', 1400)).jpeg({ quality: 72 }).toFile(path);
    made++;
  }
  const buf = await sharp(path).resize(20, 20, { fit: 'cover' }).blur(1.2).jpeg({ quality: 45 }).toBuffer();
  lqip[`_stand-in-${i}`] = `data:image/jpeg;base64,${buf.toString('base64')}`;
}

/* Only real photographs get an LQIP of their own; a stand-in article falls
   back to its shared one in src/lib/images.ts, which is what keeps lqip.json
   from carrying 249 copies of the same blur. */
for (const p of products) {
  const dir = join(PRODUCT_DIR, p.category);
  mkdirSync(dir, { recursive: true });
  const photo = realPhoto(dir, p.id, '');
  if (!photo) continue;
  real++;
  const buf = await sharp(photo).resize(20, 20, { fit: 'cover' }).blur(1.2).jpeg({ quality: 45 }).toBuffer();
  lqip[p.id] = `data:image/jpeg;base64,${buf.toString('base64')}`;
}

/* Editorial photography: /about, /visit, and the pack explainer on
   /how-to-order. These carry their pages and must be real before launch. */
const SITE_SLOTS = [
  ['street', 'Kalakar Street', 1600, 1067],
  ['workshop', 'The workshop', 1600, 1067],
  ['packing-table', 'The packing table', 1600, 1067],
  ['hands', 'Hands at work', 1600, 1067],
  ['entrance', 'The entrance, P-15', 1200, 1600],
  ['stairwell', 'Stairs to the 2nd floor', 1200, 1600],
  ['pack-card', 'A carded rakhi', 1200, 900],
  ['pack-box', 'A box of 12', 1200, 900],
  ['pack-carton', 'A sealed carton', 1200, 900],
  ['map', 'P-15 Kalakar Street — near ICICI Bank', 1200, 800],
  ['hero', 'Hero photograph', 1800, 1200],
];
mkdirSync(SITE_DIR, { recursive: true });
for (const [name, label, w, h] of SITE_SLOTS) {
  if (realPhoto(SITE_DIR, name, '')) {
    real++;
    continue;
  }
  const path = join(SITE_DIR, `${name}.placeholder.jpg`);
  if (!existsSync(path)) {
    await sharp(siteSvg(label, w, h)).jpeg({ quality: 74 }).toFile(path);
    made++;
  }
}

mkdirSync(join(ROOT, 'src/data'), { recursive: true });
writeFileSync(join(ROOT, 'src/data/lqip.json'), JSON.stringify(lqip) + '\n');

console.log(
  `images: ${real} real, ${STAND_INS} shared stand-ins (${made} generated this run), ` +
    `${Object.keys(lqip).length} LQIPs written${swept ? `, ${swept} per-article stand-ins swept` : ''}`,
);
if (real === 0) {
  console.warn(
    '\n  ⚠ No real photographs found. The site is rendering stand-ins.\n' +
      '    Drop real files into src/assets/products/<category>/<ARTICLE>.jpg to replace them.\n',
  );
}
