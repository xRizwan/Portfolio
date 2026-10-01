# Muhammad Rizwan — portfolio

Static Astro site: projects, case studies, articles, experience, skills, and certificates.
Agent and contributor guide: [AGENTS.md](AGENTS.md).

## Develop

```sh
npm ci
npm run dev      # http://localhost:4321
npm run verify   # everything CI runs: format, lint, types, content, tests, build
```

## Deploy to Vercel

1. Push the repository to GitHub and import it in Vercel. Vercel detects Astro; the build
   command is `npm run build` and the output directory is `dist/`. No adapter is needed.
2. Optional: set `SITE_URL` (for example `https://your-domain.com`) once a custom domain is
   connected. Without it, the Vercel production URL is used for canonical URLs, the sitemap,
   and structured data.
3. Preview deployments are automatically `noindex` and block crawling in `robots.txt`.
4. After the first production deploy, verify the site in Google Search Console and Bing
   Webmaster Tools and submit `/sitemap-index.xml` (see `docs/workflows/release.md`).

## Licences

Fonts: SIL Open Font License (via Fontsource). Three.js: MIT. Technology logos: Simple Icons
(CC0; see `public/tech/LICENSE.txt`). Content and portrait © Muhammad Rizwan.
