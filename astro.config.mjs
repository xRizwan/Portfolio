// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// One production origin for canonical URLs, feeds, and structured data. Set SITE_URL once a
// custom domain exists; on Vercel the project's production URL is used until then.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site =
  process.env.SITE_URL ?? (vercelHost ? `https://${vercelHost}` : 'http://localhost:4321');

// Preview deployments must not be indexed; production and local builds are indexable.
const noindex = Boolean(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production');

export default defineConfig({
  site,
  // Astro 7 defaults to JSX whitespace rules, which would join inline words; keep HTML rules.
  compressHTML: true,
  integrations: [mdx(), sitemap()],
  vite: {
    define: {
      __NOINDEX__: JSON.stringify(noindex),
    },
  },
});
