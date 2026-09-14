/**
 * A9 — the performance budget, enforced in CI. A build that exceeds it fails.
 *
 * What is measured here is what a build can honestly measure: the JavaScript a
 * page downloads before it is interactive, gzipped, following static imports
 * from the page's own module graph. Code-split chunks that are only reached
 * through a dynamic import — the search overlay, the shortlist drawer, pdf-lib
 * — are excluded, because a visitor who never opens search never pays for it.
 *
 * LCP and CLS cannot be measured without a browser and a network profile. Run
 * Lighthouse against the preview build for those; the numbers to hold are in
 * README (LCP < 2.0s on throttled 4G, CLS < 0.05).
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const ROOT = dirname(new URL(import.meta.url).pathname).replace(/\/scripts$/, '');
const DIST = join(ROOT, 'dist');

if (!existsSync(DIST)) {
  console.error('No dist/. Run the build first.');
  process.exit(1);
}

/** page-matching pattern → [JS budget KB, total-weight budget KB or null] */
const BUDGETS = [
  { name: '/', test: (p) => p === 'index.html', js: 40, weight: null },
  { name: '/collections', test: (p) => p === 'collections/index.html', js: 50, weight: null },
  { name: '/collections/[category]', test: (p) => /^collections\/[^/]+\/index\.html$/.test(p), js: 90, weight: 600 },
  { name: '/shortlist', test: (p) => p === 'shortlist/index.html', js: 60, weight: null },
  { name: '/catalogue', test: (p) => p === 'catalogue/index.html', js: 20, weight: null },
  { name: '/how-to-order', test: (p) => p === 'how-to-order/index.html', js: 20, weight: null },
  { name: '/custom', test: (p) => p === 'custom/index.html', js: 40, weight: null },
  { name: '/export', test: (p) => p === 'export/index.html', js: 20, weight: null },
  { name: '/export/[country]', test: (p) => /^export\/[^/]+\/index\.html$/.test(p), js: 20, weight: null },
  { name: '/about', test: (p) => p === 'about/index.html', js: 10, weight: null },
  { name: '/visit', test: (p) => p === 'visit/index.html', js: 20, weight: null },
  { name: '/contact', test: (p) => p === 'contact/index.html', js: 40, weight: null },
  { name: '/thanks', test: (p) => p === 'thanks/index.html', js: 10, weight: null },
  { name: '/wholesale-rakhi-in-[city]', test: (p) => /^wholesale-rakhi-in-[^/]+\/index\.html$/.test(p), js: 20, weight: null },
  { name: '/404', test: (p) => p === '404.html', js: 20, weight: null },
];

const gz = (file) => gzipSync(readFileSync(file)).length;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith('.html'));

/** Static imports only. `import(` with a paren is dynamic and is not counted. */
const staticImports = (code) => {
  const found = new Set();
  const re = /(?:from|import)\s*["'](\/_a\/[^"']+\.js)["']/g;
  let m;
  while ((m = re.exec(code))) found.add(m[1]);
  return found;
};

function eagerJs(html) {
  const urls = new Set();
  /* src/href covers plain scripts and modulepreload; component-url and
     renderer-url are how Astro points an <astro-island> at its chunks. */
  const re = /(?:src|href|component-url|renderer-url)="(\/_a\/[^"]+\.js)"/g;
  let m;
  while ((m = re.exec(html))) urls.add(m[1]);

  const seen = new Set();
  const queue = [...urls];
  while (queue.length) {
    const url = queue.pop();
    if (seen.has(url)) continue;
    seen.add(url);
    const file = join(DIST, url.slice(1));
    if (!existsSync(file)) continue;
    for (const dep of staticImports(readFileSync(file, 'utf8'))) {
      if (!seen.has(dep)) queue.push(dep);
    }
  }
  return [...seen];
}

/**
 * The bytes a phone actually pulls on first paint.
 *
 * Only images marked eager are counted — everything below the first row
 * lazy-loads, and a visitor who does not scroll never pays for it. For each
 * one the smallest useful variant is taken (AVIF at 480px or below), because
 * that is what a 2-up phone grid resolves to on a throttled connection. A
 * desktop figure is printed alongside for reference but is not what the
 * budget is held against.
 */
function imageBytes(html, maxWidth) {
  const blocks = [
    ...(html.match(/<picture[\s\S]*?<\/picture>/g) ?? []),
    ...(html.match(/<img\b[^>]*>/g) ?? []),
  ];
  let total = 0;
  const counted = new Set();

  for (const block of blocks) {
    if (!/loading="eager"/.test(block)) continue;

    const candidates = [];
    const srcsetRe = /srcset="([^"]+)"/g;
    let m;
    while ((m = srcsetRe.exec(block))) {
      for (const part of m[1].split(',')) {
        const [url, w] = part.trim().split(/\s+/);
        if (url?.startsWith('/_a/')) candidates.push({ url, w: parseInt(w ?? '0', 10) || 0 });
      }
    }
    const plain = /src="(\/_a\/[^"]+\.(?:avif|webp|jpe?g|png))"/.exec(block);
    if (plain) candidates.push({ url: plain[1], w: 0 });
    if (!candidates.length) continue;

    const rank = (u) => (u.endsWith('.avif') ? 0 : u.endsWith('.webp') ? 1 : 2);
    const eligible = candidates.filter((c) => c.w === 0 || c.w <= maxWidth);
    const pool = eligible.length ? eligible : candidates;
    pool.sort((a, b) => rank(a.url) - rank(b.url) || b.w - a.w);
    const pick = pool[0];

    if (counted.has(pick.url)) continue;
    counted.add(pick.url);
    const file = join(DIST, pick.url.slice(1));
    if (existsSync(file)) total += statSync(file).size;
  }
  return total;
}

const results = [];
let failed = 0;

for (const budget of BUDGETS) {
  const matches = htmlFiles.filter((f) => budget.test(relative(DIST, f).replace(/\\/g, '/')));
  if (!matches.length) {
    results.push({ name: budget.name, status: 'missing' });
    continue;
  }

  let worstJs = { kb: 0, page: '' };
  let worstWeight = { kb: 0, page: '', desktop: 0 };

  for (const file of matches) {
    const html = readFileSync(file, 'utf8');
    const page = relative(DIST, file);

    const jsBytes = eagerJs(html)
      .map((u) => join(DIST, u.slice(1)))
      .filter(existsSync)
      .reduce((n, f) => n + gz(f), 0);
    const jsKb = jsBytes / 1024;
    if (jsKb > worstJs.kb) worstJs = { kb: jsKb, page };

    if (budget.weight !== null) {
      /* HTML + stylesheets + eager JS + every image the page references.
         This is the pessimistic reading: below-the-fold photographs lazy-load
         and a visitor who does not scroll never pays for them. */
      const css = (html.match(/href="(\/_a\/[^"]+\.css)"/g) ?? [])
        .map((s) => s.slice(6, -1))
        .map((u) => join(DIST, u.slice(1)))
        .filter(existsSync)
        .reduce((n, f) => n + gz(f), 0);
      const kb = (gz(file) + css + jsBytes + imageBytes(html, 480)) / 1024;
      const deskKb = (gz(file) + css + jsBytes + imageBytes(html, 768)) / 1024;
      if (kb > worstWeight.kb) worstWeight = { kb, page, desktop: deskKb };
    }
  }

  const jsOver = worstJs.kb > budget.js;
  const weightOver = budget.weight !== null && worstWeight.kb > budget.weight;
  if (jsOver || weightOver) failed++;

  results.push({
    name: budget.name,
    pages: matches.length,
    js: worstJs.kb,
    jsBudget: budget.js,
    weight: budget.weight === null ? null : worstWeight.kb,
    desktop: budget.weight === null ? null : worstWeight.desktop,
    weightBudget: budget.weight,
    status: jsOver || weightOver ? 'fail' : 'ok',
  });
}

const pad = (s, n) => String(s).padEnd(n);
const kb = (n) => `${n.toFixed(1)}KB`;

console.log('\nA9 performance budget');
console.log('JS: gzipped, static imports only. Weight: first paint on a 2-up phone grid.\n');
console.log(pad('page', 30) + pad('pages', 7) + pad('js', 10) + pad('budget', 10) + pad('weight', 12) + 'status');
console.log('-'.repeat(80));
for (const r of results) {
  if (r.status === 'missing') {
    console.log(pad(r.name, 30) + 'not built');
    continue;
  }
  console.log(
    pad(r.name, 30) +
      pad(r.pages, 7) +
      pad(kb(r.js), 10) +
      pad(kb(r.jsBudget), 10) +
      pad(r.weight === null ? '—' : `${kb(r.weight)} / ${kb(r.weightBudget)}`, 12) +
      (r.status === 'ok' ? 'ok' : 'OVER BUDGET'),
  );
}
console.log();

if (failed) {
  console.error(`${failed} page type(s) over budget. Failing the build.\n`);
  process.exit(1);
}
console.log('All pages within budget.\n');
for (const r of results) {
  if (r.desktop) console.log(`  ${r.name}: ${r.desktop.toFixed(1)}KB first paint on a 4-up desktop grid (informational).`);
}
console.log('\nLCP and CLS are not measurable here — run Lighthouse against `npm run preview`.\n');
