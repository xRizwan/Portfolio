# 003 — Pop-up book home page

Date: 2026-11-17. Roles: planner / implementer / reviewer (self-review, same agent).

## Objective and acceptance criteria

- Replace the home page with the "Pop-up" trial design (a paper pop-up book).
- Keep every trial design and the previous home page in an archive folder; delete none.
- The Experience link goes to the separate `/experience/` page; the blog and experience pages
  keep their existing look.
- Remove the "Pause motion" button from the shared header (blog, experience, case studies).
- SEO/AEO stay intact: unique titles and descriptions, canonical URLs, JSON-LD, sitemap,
  robots, one `h1`, content in the initial HTML.

## Changes

- New home: `src/pages/index.astro`, `src/layouts/HomeLayout.astro` (fonts and `Seo`, without
  the site header, footer or `global.css`), `src/components/book/` and `public/book/`. The
  ProfilePage/Person/WebSite JSON-LD from the previous home page is kept.
- Header tabs: About, Skills, Work, Experience (`/experience/`), Blog (`/blog/`), Certificates,
  Contact. Links to `/#skills` and `/#certificates` from other pages open the book at that
  spread (`book.ts`, re-applied after the browser's own fragment jump on load).
- `archive/home-designs/` (eight trial designs and `LabLayout`) and `archive/old-home/` (the
  cats home page, `home-2.astro`, and the components and scripts only it used). The archive is
  excluded from ESLint, Prettier and TypeScript; `archive/README.md` explains how to restore.
  `KittenHead` and `KittenSit` stay in `src/components/home/` for the blog heading.
- The sitemap filter for `/lab/` is removed (those routes no longer exist).
- Pause motion removed from `SiteHeader` with its styles; `site-chrome.ts` still mirrors the OS
  reduced-motion setting as the `motion-off` body class that the CSS animations rely on.
- Type fix in `book.ts`: `mode` is read through a function after `setMode()`.
- Docs: `docs/architecture.md`, `docs/workflows/ui-accessibility-review.md`.

## Checks run

- `npm run verify`: pass (format, lint, `astro check` 0 errors / 0 warnings, content
  validation, 10 tests, build of 7 pages). The build prints the existing
  `MODULE_LEVEL_DIRECTIVE` warnings for the MDX content files.
- SEO/AEO audit script over `dist/`: every page has a title, description, canonical URL, Open
  Graph/Twitter tags, one `h1` and parseable JSON-LD; no images without `alt`; no broken
  internal links; no duplicate titles or descriptions; the home page's text is in the initial
  HTML. Sitemap lists the six published pages; `robots.txt` points to it.
- Manual (headless Chrome screenshots): home at 1528x760 and 390x844, `/#skills` and
  `/#certificates` arriving in the book and on a phone, experience and blog headers on desktop
  and phone. No horizontal overflow and no console errors.
- Lighthouse 12.6 (mobile unless noted) on the local production build, before the fixes below:
  home 72 / 95 / 100 / 100 (performance / accessibility / best practices / SEO), blog
  98 / 100 / 100 / 100, ISIC case study 98 / 100 / 100 / 100. No article page is published
  (the one article is a draft). After the fixes: home mobile 68-69 / 100 / 100 / 100 (two
  runs) and desktop 84 / 97 / 100 / 100 before the certificate-link fix. The home page's
  observed LCP on this machine was 0.67 s; the simulated slow-phone LCP is about 8 s, almost
  all "render delay" from main-thread work in the 3D book.
- Keyboard walkthrough (scripted Tab presses in headless Chrome, 1528x760 book and 390x844
  flat pages): every control reached in order with a visible focus ring and on screen, each
  spread opens as focus enters it, and the certificate viewer opens with Enter, takes focus,
  closes with Escape and returns focus to the certificate.

## Review findings

- `/#skills` opened on the cover in the 3D book → re-open the spread after load (fixed).
- Descriptions over ~160 characters on Experience (179), the ISIC case study (181) and the
  fraud case study (167) → shortened to 159, 154 and 159 with the same facts (owner approved).
- Lighthouse: `aria-label` on a `<p>` (cover title) → visually hidden text instead (fixed).
- Lighthouse: trait `h3`s came before the About `h2` → About text first in the markup, CSS
  keeps the house on the left in the two-column layout (fixed).
- Lighthouse desktop: pleated certificate links had no accessible name → `aria-label` (fixed).
- Keyboard: the first control of each spread lost focus while the book turned to it, so it was
  skipped → `book.ts` restores focus once the spread is open (fixed).
- Performance: the phone frame loop rewrote the cover angle and re-measured every frame even
  when nothing moved → skipped when the scroll position is unchanged; the engine starts after
  the first paint; the cover image is preloaded. Simulated mobile performance did not improve
  measurably; the remaining cost is the book's DOM and 3D styling.

## Status and limitations

- Not possible from this machine: testing on real phones (emulated mobile only).
- Home mobile performance (about 70 in the simulation) is below the previous home page's
  recorded 80-87 range; desktop is 84. Re-measure on the deployed site, which serves
  compressed files.
- The previous home page's styles remain in `src/styles/global.css` (unused, harmless).
