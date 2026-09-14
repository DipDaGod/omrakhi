/**
 * Open Graph images.
 *
 * Nearly all link sharing in this trade happens through WhatsApp, and WhatsApp
 * renders the OG card — so the card is not decoration, it is the first thing a
 * dealer sees when a colleague forwards him a link.
 *
 * Home and generic pages get a composite of six designs; each category gets a
 * 2×2 composite of four of its own. Generated from the same photographs the
 * site uses, so they cannot drift out of date.
 */
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import sharp from 'sharp';

const ROOT = dirname(new URL(import.meta.url).pathname).replace(/\/scripts$/, '');
const OUT = join(ROOT, 'public/og');
const W = 1200;
const H = 630;
const GROUND = { r: 250, g: 247, b: 242 };

function resolve(category, code) {
  const dir = join(ROOT, 'src/assets/products', category);
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const p = join(dir, `${code}.${ext}`);
    if (existsSync(p)) return p;
  }
  const stand = join(dir, `${code}.placeholder.jpg`);
  return existsSync(stand) ? stand : null;
}

const xml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);

function caption(line1, line2) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect x="0" y="${H - 132}" width="${W}" height="132" fill="rgba(250,247,242,0.96)"/>
    <rect x="0" y="${H - 132}" width="${W}" height="3" fill="#a8261c"/>
    <text x="48" y="${H - 76}" font-family="DejaVu Serif, serif" font-size="42" fill="#1b1714">${xml(line1)}</text>
    <text x="48" y="${H - 34}" font-family="DejaVu Sans, sans-serif" font-size="24" fill="#6b625a">${xml(line2)}</text>
  </svg>`);
}

async function composite(paths, out, line1, line2, cols) {
  const rows = Math.ceil(paths.length / cols);
  const cellW = Math.ceil(W / cols);
  const cellH = Math.ceil((H - 132) / rows);
  const tiles = [];
  for (let i = 0; i < paths.length; i++) {
    const buf = await sharp(paths[i]).resize(cellW, cellH, { fit: 'cover' }).toBuffer();
    tiles.push({ input: buf, left: (i % cols) * cellW, top: Math.floor(i / cols) * cellH });
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: GROUND } })
    .composite([...tiles, { input: caption(line1, line2), top: 0, left: 0 }])
    .png({ compressionLevel: 9 })
    .toFile(out);
}

const products = JSON.parse(readFileSync(join(ROOT, 'src/content/products.json'), 'utf8'))
  .filter((p) => p.available);

mkdirSync(join(OUT, 'collections'), { recursive: true });

/* Per-category cards: four designs from that category. */
const byCategory = new Map();
for (const p of products) {
  if (!byCategory.has(p.category)) byCategory.set(p.category, []);
  byCategory.get(p.category).push(p);
}

let made = 0;
for (const [slug, list] of byCategory) {
  const name = JSON.parse(readFileSync(join(ROOT, 'src/content/categories', `${slug}.json`), 'utf8')).name.en;
  const picks = [...list]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4)
    .map((p) => resolve(slug, p.id))
    .filter(Boolean);
  if (picks.length < 4) continue;
  await composite(picks, join(OUT, 'collections', `${slug}.png`), name, `${list.length} designs · Om Rakhi Udyog, Kolkata`, 2);
  made++;
}

/* Default card: six designs spread across the range. */
const spread = [];
const cats = [...byCategory.keys()];
for (let i = 0; i < 6; i++) {
  const list = byCategory.get(cats[i % cats.length]);
  const pick = resolve(cats[i % cats.length], list[Math.floor(i / cats.length) % list.length].id);
  if (pick) spread.push(pick);
}
if (spread.length === 6) {
  await composite(spread, join(OUT, 'default.png'), 'Om Rakhi Udyog', 'Rakhi manufacturer & wholesale supplier · Burrabazar, Kolkata', 3);
  made++;
}

console.log(`og: ${made} card(s) written to public/og/`);
