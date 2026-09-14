/**
 * Browser smoke test. Run against a built site:
 *
 *   npm run build && npm run preview &   # or: npm test, which does both
 *   node tests/smoke.mjs
 *
 * It exercises the things that only exist once JavaScript runs — the grid
 * island taking over, filters, the drawer, the shortlist across four separate
 * islands, search ranking, the mobile menu and bottom sheet — plus the two
 * states that matter most and are easiest to break: no-JS and narrow screens.
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:4321';
const out = [];
const ok = (n, c) => out.push(`${c ? 'PASS' : 'FAIL'}  ${n}`);

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

// --- Category page: island takes over, filters, drawer, shortlist ----------
await page.goto(`${BASE}/collections/ad-rakhi`, { waitUntil: 'networkidle' });
await page.waitForSelector('astro-island .pc__heart', { timeout: 10000 });
ok('category: island hydrated (heart buttons present)', await page.locator('astro-island .pc__heart').count() > 0);
ok('category: static grid hidden after hydration', await page.locator('[data-static-grid][hidden]').count() === 1);
const total = await page.locator('astro-island .grid .pc').count();
ok(`category: renders all 28 cards (got ${total})`, total === 28);

// filter
await page.locator('.chip', { hasText: '₹₹₹' }).first().click();
await page.waitForTimeout(300);
const filtered = await page.locator('astro-island .grid .pc').count();
ok(`category: price filter narrows grid (${total} → ${filtered})`, filtered > 0 && filtered < total);
ok('category: filter written to URL', page.url().includes('price='));

// in-category search
await page.locator('.pg__search input').fill('OM-1003');
await page.waitForTimeout(300);
ok('category: article search finds one', await page.locator('astro-island .grid .pc').count() <= 1);
await page.locator('.pg__search input').fill('');
await page.locator('.pg__clear').click().catch(() => {});
await page.waitForTimeout(300);

// drawer
await page.locator('astro-island .pc__hit').first().click();
await page.waitForSelector('.dd__panel', { timeout: 5000 });
ok('drawer: opens', await page.locator('.dd__code').isVisible());
ok('drawer: URL carries ?d=', /\?.*d=OM-/.test(page.url()));
const code = await page.locator('.dd__code').textContent();
await page.locator('.dd__nav button').nth(1).click();
await page.waitForTimeout(250);
ok('drawer: next steps to another design', (await page.locator('.dd__code').textContent()) !== code);
await page.keyboard.press('Escape');
await page.waitForTimeout(250);
ok('drawer: Escape closes', await page.locator('.dd__panel').count() === 0);

// shortlist add
await page.locator('astro-island .pc__heart').first().click();
await page.waitForTimeout(300);
ok('shortlist: header counter appears', await page.locator('[data-shortlist-count]').textContent() === '1');
ok('shortlist: sticky bar appears', await page.locator('.stickybar').isVisible());
await page.locator('astro-island .pc__heart').nth(1).click();
await page.locator('astro-island .pc__heart').nth(2).click();
await page.waitForTimeout(300);
ok('shortlist: counter reaches 3', await page.locator('[data-shortlist-count]').textContent() === '3');

// shortlist drawer from header
await page.locator('[data-shortlist-open]').click();
await page.waitForSelector('.sd__panel', { timeout: 5000 });
ok('shortlist drawer: opens with rows', await page.locator('.sd__row').count() === 3);
await page.keyboard.press('Escape');
await page.waitForTimeout(200);

// search overlay
await page.locator('[data-search-open]').first().click();
await page.waitForSelector('.so__panel', { timeout: 5000 });
ok('search: empty state lists categories', await page.locator('.so__cats li').count() === 5);
await page.locator('.so__input').fill('OM-1003');
await page.waitForTimeout(400);
const first = await page.locator('.sr__code').first().textContent();
ok(`search: exact article ranks first (${first})`, first === 'OM-1003');
await page.locator('.so__input').fill('pearl');
await page.waitForTimeout(400);
ok('search: fuzzy term returns results', await page.locator('.sr').count() > 0);
await page.keyboard.press('Escape');
await page.waitForTimeout(200);

// --- Shortlist page --------------------------------------------------------
await page.goto(`${BASE}/shortlist`, { waitUntil: 'networkidle' });
await page.waitForSelector('.sl__row', { timeout: 8000 });
ok('shortlist page: shows the three designs', await page.locator('.sl__row').count() === 3);
ok('shortlist page: quantity defaults to MOQ', await page.locator('.sl__qty input').first().inputValue() === '100');
const wa = await page.locator('[data-wa]').getAttribute('href');
ok('shortlist page: WhatsApp link carries article numbers', /OM-\d{4}/.test(decodeURIComponent(wa ?? '')));
ok('shortlist page: contact dock is hidden here', await page.locator('.dock').count() === 0);

// PDF
const dl = page.waitForEvent('download', { timeout: 20000 }).catch(() => null);
await page.locator('[data-pdf]').click();
const download = await dl;
ok('shortlist page: PDF downloads', !!download);

// empty state
await page.locator('[data-clearall]').click();
page.on('dialog', (d) => d.accept());
await page.waitForTimeout(500);

// --- Shared shortlist link -------------------------------------------------
await page.goto(`${BASE}/shortlist?i=OM1005x100,OM1401x50`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
ok('shortlist page: shared link offers to merge', await page.locator('[data-shared]:not([hidden])').count() === 1);

// --- 404 retired article ---------------------------------------------------
await page.goto(`${BASE}/collections/ad-rakhi?d=OM-1140`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.goto(`${BASE}/404.html?d=OM-1140`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const retired = await page.locator('[data-retired]').textContent();
ok(`404: names the retired article (${(retired ?? '').slice(0, 40).trim()})`, /OM-1140/.test(retired ?? ''));

// --- Collections filter ----------------------------------------------------
await page.goto(`${BASE}/collections`, { waitUntil: 'networkidle' });
const allCats = await page.locator('[data-card]:not([hidden])').count();
await page.locator('.chip[data-value="pearl"]').click();
await page.waitForTimeout(200);
const someCats = await page.locator('[data-card]:not([hidden])').count();
ok(`collections: material filter narrows (${allCats} → ${someCats})`, someCats > 0 && someCats < allCats);
ok('collections: filter in URL', page.url().includes('material=pearl'));

// --- Mobile ----------------------------------------------------------------
const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
mob.on('pageerror', (e) => errors.push(`mobile pageerror: ${e.message}`));
await mob.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await mob.locator('[data-menu-open]').click();
await mob.waitForTimeout(300);
ok('mobile: menu opens full-screen', await mob.locator('#mobile-menu:not([hidden])').count() === 1);
ok('mobile: menu carries the full category list', await mob.locator('.mm__cats li').count() === 12);
await mob.locator('[data-menu-close]').click();
await mob.waitForTimeout(200);
ok('mobile: menu closes', await mob.locator('#mobile-menu[hidden]').count() === 1);
ok('mobile: contact dock is a bottom bar', await mob.locator('.dock').isVisible());

const hScroll = await mob.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
ok('mobile: home does not scroll horizontally', !hScroll);
await mob.goto(`${BASE}/collections/stone-rakhi`, { waitUntil: 'networkidle' });
await mob.waitForTimeout(500);
const hScroll2 = await mob.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
ok('mobile: category does not scroll horizontally', !hScroll2);
await mob.locator('.pg__sheetbtn').click();
await mob.waitForTimeout(300);
ok('mobile: filter bottom sheet opens', await mob.locator('.sheet__panel').isVisible());

// --- No-JS -----------------------------------------------------------------
const nojs = await browser.newContext({ javaScriptEnabled: false });
const np = await nojs.newPage();
await np.goto(`${BASE}/collections/ad-rakhi`, { waitUntil: 'domcontentloaded' });
ok('no-JS: full grid is present in the HTML', await np.locator('[data-static-grid] .pc').count() === 28);
ok('no-JS: article numbers are readable', (await np.locator('.pc__code').first().textContent())?.startsWith('OM-'));
await np.goto(`${BASE}/contact`, { waitUntil: 'domcontentloaded' });
ok('no-JS: contact form posts to Web3Forms', (await np.locator('form.fm').getAttribute('action'))?.includes('web3forms'));

// --- The production CSP ----------------------------------------------------
/* vercel.json sends a Content-Security-Policy that the preview server does
   not, so without this the policy is unverified until it is live — and a CSP
   that blocks the grid island or the shortlist PDF is an outage, not a
   warning. This replays the real policy from vercel.json against the pages
   that run the most JavaScript, and fails on any violation the browser
   reports.

   `upgrade-insecure-requests` is dropped because the preview server is http;
   it is the one directive that cannot be exercised locally. */
const csp = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
  .headers.flatMap((h) => h.headers)
  .find((h) => h.key === 'Content-Security-Policy').value
  .split(';')
  .map((d) => d.trim())
  .filter((d) => d && d !== 'upgrade-insecure-requests')
  .join('; ');

const cspPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await cspPage.addInitScript(() => {
  window.__csp = [];
  addEventListener('securitypolicyviolation', (e) =>
    window.__csp.push(`${e.effectiveDirective} blocked ${e.blockedURI}`),
  );
});
await cspPage.route('**/*', async (route) => {
  if (route.request().resourceType() !== 'document') return route.continue();
  const res = await route.fetch();
  await route.fulfill({ response: res, headers: { ...res.headers(), 'content-security-policy': csp } });
});

await cspPage.goto(`${BASE}/collections/ad-rakhi`, { waitUntil: 'networkidle' });
await cspPage.waitForSelector('astro-island .pc__heart', { timeout: 10000 });
ok('csp: the grid island still hydrates', await cspPage.locator('astro-island .pc__heart').count() > 0);
await cspPage.locator('astro-island .pc__hit').first().click();
await cspPage.waitForSelector('.dd__panel', { timeout: 5000 });
ok('csp: the drawer still opens', await cspPage.locator('.dd__code').isVisible());
await cspPage.keyboard.press('Escape');
await cspPage.locator('astro-island .pc__heart').first().click();
await cspPage.locator('[data-search-open]').first().click();
await cspPage.waitForSelector('.so__panel', { timeout: 5000 });
await cspPage.locator('.so__input').fill('OM-1003');
await cspPage.waitForTimeout(400);
ok('csp: search still loads and ranks', (await cspPage.locator('.sr__code').first().textContent()) === 'OM-1003');
await cspPage.keyboard.press('Escape');

await cspPage.goto(`${BASE}/shortlist`, { waitUntil: 'networkidle' });
await cspPage.waitForSelector('.sl__row', { timeout: 8000 });
ok('csp: /catalogue.json is still fetchable', await cspPage.locator('.sl__row').count() === 1);
const cspDl = cspPage.waitForEvent('download', { timeout: 20000 }).catch(() => null);
await cspPage.locator('[data-pdf]').click();
ok('csp: the shortlist PDF still downloads', !!(await cspDl));

await cspPage.goto(`${BASE}/contact`, { waitUntil: 'networkidle' });
await cspPage.waitForTimeout(300);

const violations = await cspPage.evaluate(() => window.__csp ?? []);
ok(
  `csp: nothing blocked${violations.length ? ` (${[...new Set(violations)].join('; ')})` : ''}`,
  violations.length === 0,
);
await cspPage.close();

// --- A8: accessibility floor ----------------------------------------------
/* Automated checks cannot prove a page is accessible, but they do catch the
   things this site must never ship: an image without alt text, a form field
   without a real label, text below 4.5:1, a control with no accessible name. */
const axe = readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const A11Y_PAGES = ['/', '/collections', '/collections/ad-rakhi', '/how-to-order', '/contact', '/shortlist', '/visit', '/hi/', '/no-such-page'];

for (const route of A11Y_PAGES) {
  const a11y = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await a11y.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  await a11y.addScriptTag({ content: axe });
  const result = await a11y.evaluate(async () => {
    // @ts-expect-error injected at runtime
    return await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      // The static grid is hidden from view once the island takes over; axe
      // correctly ignores hidden content, so nothing needs excluding here.
    });
  });
  const serious = result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  ok(
    `a11y ${route}: no serious or critical violations${serious.length ? ` (${serious.map((v) => v.id).join(', ')})` : ''}`,
    serious.length === 0,
  );
  await a11y.close();
}

await browser.close();

console.log(out.join('\n'));
console.log(`\n${out.filter((l) => l.startsWith('PASS')).length}/${out.length} passed`);
if (errors.length) {
  console.log('\nPage errors:');
  console.log([...new Set(errors)].slice(0, 20).join('\n'));
}
process.exit(out.some((l) => l.startsWith('FAIL')) ? 1 : 0);
