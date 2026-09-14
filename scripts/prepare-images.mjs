/**
 * A10 — image preparation. Runs before every build.
 *
 * Two jobs:
 *
 * 1. Stand-in photography. Real photographs are committed as
 *    src/assets/products/<category>/<ARTICLE>.jpg. Where one does not exist
 *    yet, this writes <ARTICLE>.placeholder.jpg so the site builds, renders
 *    and can be reviewed. Real files are NEVER overwritten — dropping a real
 *    photograph in is all it takes to replace a stand-in, and the placeholder
 *    is then ignored. Placeholders are gitignored.
 *
 * 2. The LQIP manifest. Every product image is reduced to a 20px blurred JPEG
 *    and inlined as base64 in src/data/lqip.json, which is what keeps CLS
 *    under the A9 budget while photographs stream in.
 */
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import sharp from 'sharp';

const ROOT = dirname(new URL(import.meta.url).pathname).replace(/\/scripts$/, '');
const PRODUCT_DIR = join(ROOT, 'src/assets/products');
const SITE_DIR = join(ROOT, 'src/assets/site');

const INK = '#1b1714';
const MUTED = '#6b625a';
const PLINTH = '#efe8dc';

/** Deterministic per-code tint, so a grid of placeholders is not one flat wall. */
function tint(code) {
  let h = 0;
  for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 18% 82%)`;
}

function productSvg(code, label, size) {
  const r = Math.round(size * 0.22);
  const c = size / 2;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="${PLINTH}"/>
    <circle cx="${c}" cy="${c * 0.92}" r="${r}" fill="${tint(code)}"/>
    <circle cx="${c}" cy="${c * 0.92}" r="${r * 0.42}" fill="${PLINTH}"/>
    <path d="M ${c - r} ${c * 0.92} L ${size * 0.08} ${size * 0.86}
             M ${c + r} ${c * 0.92} L ${size * 0.92} ${size * 0.86}"
          stroke="${tint(code)}" stroke-width="${size * 0.02}" fill="none"/>
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

/** Resolves the file actually used for a slot: real photograph first. */
function resolve(dir, base, suffix) {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const real = join(dir, `${base}${suffix ? `-${suffix}` : ''}.${ext}`);
    if (existsSync(real)) return { path: real, placeholder: false };
  }
  return {
    path: join(dir, `${base}.placeholder${suffix ? `-${suffix}` : ''}.jpg`),
    placeholder: true,
  };
}

const products = JSON.parse(readFileSync(join(ROOT, 'src/content/products.json'), 'utf8'));

let made = 0;
let real = 0;
const lqip = {};

for (const p of products) {
  const dir = join(PRODUCT_DIR, p.category);
  mkdirSync(dir, { recursive: true });

  const slots = [[p.id, '']];
  if (p.detailPhoto) slots.push([p.id, 'detail']);

  for (const [base, suffix] of slots) {
    const { path, placeholder } = resolve(dir, base, suffix);
    if (placeholder) {
      if (!existsSync(path)) {
        await sharp(productSvg(p.id, p.id, 1400)).jpeg({ quality: 72 }).toFile(path);
        made++;
      }
    } else {
      real++;
    }
    if (!suffix) {
      const buf = await sharp(path).resize(20, 20, { fit: 'cover' }).blur(1.2).jpeg({ quality: 45 }).toBuffer();
      lqip[p.id] = `data:image/jpeg;base64,${buf.toString('base64')}`;
    }
  }
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
  const { path, placeholder } = resolve(SITE_DIR, name, '');
  if (placeholder && !existsSync(path)) {
    await sharp(siteSvg(label, w, h)).jpeg({ quality: 74 }).toFile(path);
    made++;
  } else if (!placeholder) real++;
}

mkdirSync(join(ROOT, 'src/data'), { recursive: true });
writeFileSync(join(ROOT, 'src/data/lqip.json'), JSON.stringify(lqip) + '\n');

console.log(
  `images: ${real} real, ${made} stand-ins generated, ${Object.keys(lqip).length} LQIPs written`,
);
if (real === 0) {
  console.warn(
    '\n  ⚠ No real photographs found. The site is rendering stand-ins.\n' +
      '    Drop real files into src/assets/products/<category>/<ARTICLE>.jpg to replace them.\n',
  );
}
