# Release

1. On a clean checkout: `npm ci && npm run verify`.
2. Manual reviews: the UI/accessibility and SEO/performance workflows on the production build.
3. Confirm `SITE_URL` (or the Vercel production URL) is the intended canonical origin.
4. Deploy. Vercel builds with `npm run build` and serves `dist/`. On the deployed site, check
   that pages load, and check `/robots.txt`, `/sitemap-index.xml`, a 404 URL, and
   the social preview.
5. After the first production deploy: verify Google Search Console and Bing Webmaster Tools,
   submit the sitemap, and inspect key URLs. Record anything still pending.
6. Record the release in `docs/agent-runs/`.
