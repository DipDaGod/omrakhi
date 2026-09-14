// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

import { SITE } from './src/config/site.ts';

// https://astro.build/config
export default defineConfig({
  site: SITE.origin,
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    react(),
    sitemap({
      filter: (page) =>
        !page.includes('/shortlist') && !page.includes('/thanks') && !page.includes('/404'),
    }),
  ],
  image: {
    // A0/A10: public delivery is capped at 1400px. Nothing the pipeline emits
    // is a usable manufacturing reference.
    responsiveStyles: false,
  },
  build: {
    inlineStylesheets: 'auto',
    assets: '_a',
  },
  vite: {
    build: {
      // Keep island chunks separate so a page only pays for the islands it uses.
      cssCodeSplit: true,
    },
  },
});
