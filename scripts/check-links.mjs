/**
 * PART D — no orphans, no dead internal links.
 *
 * Walks every built page, collects internal hrefs, and checks each resolves to
 * something in dist/. Also reports any page that nothing links to, since the
 * footer is supposed to reach everything.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';

const ROOT = dirname(new URL(import.meta.url).pathname).replace(/\/scripts$/, '');
const DIST = join(ROOT, 'dist');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(DIST);
const pages = files.filter((f) => f.endsWith('.html'));

const routeOf = (file) =>
  '/' + relative(DIST, file).replace(/\\/g, '/').replace(/index\.html$/, '').replace(/\/$/, '');

const routes = new Set(pages.map(routeOf));
routes.add('/');

const linkedTo = new Set();
const broken = [];

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const from = routeOf(file);
  const re = /href="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    const raw = m[1];
    if (/^(https?:|mailto:|tel:|#|data:)/.test(raw)) continue;
    if (!raw.startsWith('/')) continue;
    const path = raw.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
    if (/\.(xml|json|txt|svg|png|jpe?g|webp|avif|pdf|css|js|ico)$/.test(path)) {
      if (!existsSync(join(DIST, path.slice(1)))) broken.push({ from, to: raw });
      continue;
    }
    if (routes.has(path)) linkedTo.add(path);
    else broken.push({ from, to: raw });
  }
}

const orphans = [...routes].filter(
  (r) => r !== '/' && !linkedTo.has(r) && !/^\/(hi\/)?(404(\.html)?|thanks)$/.test(r),
);

console.log(`\nInternal links — ${pages.length} pages, ${routes.size} routes\n`);

if (broken.length) {
  console.error(`${broken.length} broken internal link(s):`);
  for (const b of broken.slice(0, 30)) console.error(`  ${b.from} → ${b.to}`);
  if (broken.length > 30) console.error(`  …and ${broken.length - 30} more`);
} else {
  console.log('No broken internal links.');
}

if (orphans.length) {
  console.error(`\n${orphans.length} orphan page(s) — nothing links to these:`);
  for (const o of orphans) console.error(`  ${o}`);
} else {
  console.log('No orphans: every page is reachable from another page.');
}
console.log();

if (broken.length || orphans.length) process.exit(1);
