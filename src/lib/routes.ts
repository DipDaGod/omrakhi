import { DEFAULT_LOCALE, LOCALES, type Locale } from '../i18n/ui.ts';

/**
 * A6 — route parallelism. Every page exists in both languages, and the
 * language toggle preserves the current route rather than dumping the visitor
 * on the homepage.
 *
 * English lives at `/`, Hindi at `/hi/`. Pages are generated from a single
 * template with `[...locale]`, so `locale` is `undefined` for English.
 */

/** The value `getStaticPaths` puts in `params.locale`. */
export type LocaleParam = undefined | 'hi';

export const LOCALE_PARAMS: { params: { locale: LocaleParam } }[] = LOCALES.map((l) => ({
  params: { locale: l === DEFAULT_LOCALE ? undefined : (l as 'hi') },
}));

/** Astro types route params as `string | number | undefined`. */
export function localeFromParam(param: string | number | undefined): Locale {
  return param === 'hi' ? 'hi' : DEFAULT_LOCALE;
}

/** Builds an absolute-from-root href for a path, in the given locale. */
export function href(path: string, locale: Locale): string {
  const clean = '/' + String(path).replace(/^\/+/, '').replace(/\/+$/, '');
  const base = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  return clean === '/' ? base || '/' : base + clean;
}

/** Strips the locale prefix off a real URL pathname. */
export function pathWithoutLocale(pathname: string): string {
  const stripped = pathname.replace(/^\/hi(?=\/|$)/, '');
  return stripped === '' ? '/' : stripped;
}

/** The same page in the other language. Used by the toggle and by hreflang. */
export function alternateHref(pathname: string, locale: Locale): string {
  return href(pathWithoutLocale(pathname), locale);
}

export const ROUTES = {
  home: '/',
  collections: '/collections',
  category: (slug: string) => `/collections/${slug}`,
  shortlist: '/shortlist',
  catalogue: '/catalogue',
  howToOrder: '/how-to-order',
  custom: '/custom',
  exportHub: '/export',
  country: (slug: string) => `/export/${slug}`,
  about: '/about',
  visit: '/visit',
  contact: '/contact',
  thanks: '/thanks',
  city: (slug: string) => `/wholesale-rakhi-in-${slug}`,
  privacy: '/privacy',
  terms: '/terms',
} as const;
