import type { Locale } from '../i18n/ui.ts';

/** Price bands, never prices. See P3 — rates in this trade are negotiated. */
export function band(n: number): string {
  return '₹'.repeat(Math.max(1, Math.min(4, n)));
}

export function bandRange(from: number, to: number): string {
  return from === to ? band(from) : `${band(from)}–${band(to)}`;
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
