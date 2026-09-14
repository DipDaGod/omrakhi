import type { APIRoute } from 'astro';
import { SITE } from '../config/site.ts';
import { ENV } from '../config/env.ts';

/**
 * Generated rather than static, so the sitemap URL cannot drift from
 * SITE.origin, and so a preview deployment says the right thing.
 */
export const GET: APIRoute = () => {
  /* A preview deployment that leaks into a WhatsApp thread should not be
     crawled at all. Production behaviour is unaffected. */
  if (ENV.isPreview) {
    return new Response('User-agent: *\nDisallow: /\n', {
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  const body = `User-agent: *
Allow: /

# Personal working state, not content.
Disallow: /shortlist
Disallow: /hi/shortlist
Disallow: /thanks
Disallow: /hi/thanks

Sitemap: ${new URL('/sitemap-index.xml', SITE.origin).href}
`;

  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
