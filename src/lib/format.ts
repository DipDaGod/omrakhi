import type { Locale } from '../i18n/ui.ts';
import { PRICE_BANDS } from '../config/trade.ts';

/** Price bands, never prices. See P3 — rates in this trade are negotiated. */
export function band(n: number): string {
  return '₹'.repeat(Math.max(1, Math.min(4, n)));
}

export function bandRange(from: number, to: number): string {
  return from === to ? band(from) : `${band(from)}–${band(to)}`;
}

const clampBand = (n: number) => Math.max(1, Math.min(4, Math.round(n))) as 1 | 2 | 3 | 4;

/**
 * The rupee range a band covers, or null while PRICE_BANDS is unset.
 *
 * Everything that shows a price goes through here, so filling PRICE_BANDS in
 * converts the whole site at once and leaving it null keeps every one of those
 * places claiming nothing.
 */
export function bandRupees(from: number, to: number, locale: Locale): string | null {
  if (!PRICE_BANDS) return null;
  const lo = PRICE_BANDS[clampBand(from)];
  const hi = PRICE_BANDS[clampBand(to)];
  const each = locale === 'hi' ? 'प्रति नग' : 'per piece';
  if (hi.to === null) return `₹${lo.from}+ ${each}`;
  return `₹${lo.from}–₹${hi.to} ${each}`;
}

/** The symbols, plus the real range once there is one to give. */
export function priceLabel(from: number, to: number, locale: Locale): string {
  const rupees = bandRupees(from, to, locale);
  return rupees ? `${bandRange(from, to)} · ${rupees}` : bandRange(from, to);
}

/** One line explaining the scale. Null until the bands mean something. */
export function bandLegend(locale: Locale): string | null {
  const bands = PRICE_BANDS;
  if (!bands) return null;
  const each = locale === 'hi' ? 'प्रति नग' : 'per piece';
  return ([1, 2, 3, 4] as const)
    .map((n) => {
      const b = bands[n];
      return `${band(n)} ${b.to === null ? `₹${b.from}+` : `₹${b.from}–₹${b.to}`}`;
    })
    .join('  ·  ') + `  (${each})`;
}

/** "1 per card · 12 per box · 240 per carton" — spelled out, never abbreviated. */
export function packLine(
  pack: { perCard: number; perBox: number; perCarton: number },
  locale: Locale,
  packType: 'carded' | 'loose' | 'boxed',
): string {
  const first =
    packType === 'loose'
      ? locale === 'hi'
        ? 'खुली'
        : 'loose'
      : locale === 'hi'
        ? `${pack.perCard} प्रति कार्ड`
        : `${pack.perCard} per card`;
  const rest =
    locale === 'hi'
      ? [`${pack.perBox} प्रति बॉक्स`, `${pack.perCarton} प्रति कार्टन`]
      : [`${pack.perBox} per box`, `${pack.perCarton} per carton`];
  return [first, ...rest].join(' · ');
}

export function num(n: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'hi' ? 'hi-IN' : 'en-IN').format(n);
}

export function inr(n: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * A8 — alt text is generated from the data, never "product image".
 * "Pearl and stone rakhi, article OM-2418, maroon and gold"
 */
export function productAlt(
  p: { id: string; name: { en: string; hi: string }; colours: string[] },
  locale: Locale,
): string {
  const name = p.name[locale];
  const colours = p.colours.join(locale === 'hi' ? ' और ' : ' and ');
  return locale === 'hi'
    ? `${name}, आर्टिकल ${p.id}, ${colours}`
    : `${name}, article ${p.id}, ${colours}`;
}
