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

## Review findings

- `/#skills` opened on the cover in the 3D book → re-open the spread after load (fixed).
- Experience and the skin-cancer case study have descriptions of 179 and 181 characters, a
  little over the usual ~160 shown in results → unchanged copy, deferred to the owner.

## Status and limitations

- Not run: mobile Lighthouse, an external structured-data validator, a keyboard walkthrough
  of the book, and real touch devices.
- The previous home page's styles remain in `src/styles/global.css` (unused, harmless).
