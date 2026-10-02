# 001 — Astro site build

Date: 2026-10-01. Roles: planner, implementer, and reviewer performed by one agent (self-review).

## Objective and acceptance criteria

- A static Astro site reproducing the agreed design: home (hero with 3D frame and cats, yarn,
  skill notes, work list, certificates), blog, article, two case studies, Experience, 404.
- Content validated at build time; drafts excluded from production; RSS, sitemap, robots,
  canonical URLs, Open Graph, and JSON-LD.
- Lint (zero warnings), strict type check, formatting, content validation, focused unit
  tests, and CI running the same `npm run verify`. No E2E suite.
- Pages readable without JavaScript/WebGL; reduced motion respected.

## Changes

- Astro 7 (static), `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/rss`; TypeScript 6.0
  (7.x is not yet supported by typescript-eslint); ESLint 9 (eslint-plugin-jsx-a11y does not
  support 10); Three.js from npm; Fontsource fonts (local WOFF2); `yaml` for the validator.
- Content collections `articles` and `projects` (MDX); typed data modules for site identity,
  skills, experience, certificates, and work rows.
- Browser behaviour rewritten in strict TypeScript under `src/scripts/`, with one shared
  motion helper. The motion-change event now fires only when the motion setting changes,
  which removes a class of scene re-sync jitter.
- Fixed while porting: the flat fallback cat listened for the wrong animation names
  (`cat-hop` instead of `cute-hop`), and an unclosed `@media` block at the end of the styles.
- Certificates now come first in DOM order with Software Architect first, so keyboard order
  matches the phone layout; the desktop fan is positioned by variables and is unchanged.
- Images optimized with `astro:assets` (certificates about 1.4 MB of PNG down to 16–82 kB of
  WebP each; portrait 1.8 MB down to 23–49 kB).
- CI: `.github/workflows/ci.yml` runs `npm ci && npm run verify` on pushes to main and PRs.

## Checks run

- `npm run verify`: pass. Prettier clean; ESLint 0 problems; `astro check` 0 errors,
  0 warnings, 0 hints (50 files); content validation 3 files, no problems; Vitest 10/10;
  build complete (8 routes plus RSS and robots).
- Production preview in headless Chrome at 1440×900 and 390×844: home hero, 3D frame and
  title cats render (`is-ready`, `title-cats-ready`), no horizontal overflow on any page,
  no broken images, one `h1` per page; note arrival completes (11 notes landed); the
  certificate stack loads when scrolled into view; the 404 route returns HTTP 404.
- Full-page screenshots of blog, article, both case studies, Experience, and 404 inspected.

## Review findings

- Three.js chunk is 578 kB (144 kB gzipped), loaded only on the home page after content.
  Accepted.
- `tabindex="0"` on skill notes is intentional (overlapping notes come to the front on
  focus); allowed for `<article>` in that component only, with the reason in the ESLint config.

## Status and limitations

- Not yet run: Lighthouse, a structured-data validator, and real-browser keyboard testing.
  These belong to the release workflow.
- Social image is one static image for all pages (no per-page generation yet).
- Not deployed; the repository is not yet under version control.

## Follow-up: credentials from LinkedIn

- Added from the user's LinkedIn credentials (images fetched from each issuer's public
  credential page): Retrieval Augmented Generation (DeepLearning.AI), Machine Learning
  Specialization (DeepLearning.AI and Stanford Online), Full Stack Open (University of
  Helsinki), CS50x and CS50W (Harvard; issued to "Rizwan Arif"), and the Unity Junior
  Programmer and Unity Essentials badges (Credly). Google Digital Marketing & E-commerce was
  not added (not software-related); it can be added on request.
- The home stack still shows the five featured certificates; "See all certificates" lists all
  ten certificates plus a Badges row. LinkedIn URL updated to `muhammad-rizwan-j`.
- Checks: `npm run verify` pass; gallery renders 10 certificates and 2 badges with no broken
  images (headless Chrome, 1440px).

## Follow-up: real dates and the certificate row

- Publication dates now come from the work itself: the XOR article 2026-08-19 (last commit
  to `neural-network-from-scratch`), the fraud detection design 2026-09-21 (creation date of
  the submitted architecture PDF), and the dog-breed project 2026-09-26 (submission files;
  the SageMaker runs are dated 2026-09-25).
- Certificate stack: all ten certificates are in it. At rest only the five-card fan shows; the
  others wait behind the centre sheet. On hover or keyboard focus the fan widens as before and
  the rest continue it past both edges (faded), scrollable sideways. The row is laid out wide
  and pre-scrolled to the Software Architect certificate on load, so hovering never changes
  the scroll position (a first version widened it on hover, which made every card sweep in from
  the left). Leaving the row eases it back to the centre; a vertical mouse wheel scrolls it,
  handing back to the page at either end (`src/scripts/certificate-stack.ts`). Without
  JavaScript the stack is the plain five-card fan. On phones all ten are in the
  swipe row, Software Architect first.
- Fixed: on phones, sticky notes arriving from off-screen widened the layout viewport
  (the page stayed 812px wide on a 390px screen). The skills section now clips horizontally
  while notes arrive.
- Checks: `npm run verify` pass; headless Chrome at 1440, 1000 and 390 wide: rest, hover and
  wheel states screenshotted, page width stays 390 on the phone, no script errors.
- Self-review note: the wheel handler briefly captures vertical scrolling while the pointer is
  over the row and it can still scroll; it releases at either end.

## Follow-up: hero introduction

- Added a short introduction under the name (`site.intro` in `src/data/site.ts`): the role line
  "Full-Stack Software Engineer / Applied AI" and one sentence ("Five-plus years building web products end to end. Now building the machine learning
  that makes them smarter.") based on the experience data
  (building web products since 2020) and the ML projects and certificates.
- Checks: `npm run verify` pass. The hero still fits without scrolling at 1280×720,
  1440×900, 1536×639 and 1920×1080; at 768×1024 the toolkit link sits 31px below the fold
  (stacked layout); phones scroll by design.

## Follow-up: certificate carousel

- The certificate viewer is now a carousel of all twelve credentials (certificates, then
  badges). Any certificate link opens it at that credential; previous/next buttons, arrow
  keys, and native swiping (scroll snap) move through it, with the title, issuer, and a live
  "n / 12" counter updating. On phones "See all certificates" opens the carousel instead of
  the long list; on desktop it still expands the list. Without JavaScript the links open the
  image and the list expands.
- Checks: `npm run verify` pass. Headless Chrome: desktop click on the NLP sheet opened
  3 / 12, → went to 4, ← ← to 2, Escape closed and returned focus to the sheet; on a
  390px phone the button opened 1 / 12 and swiping to the end showed Unity Essentials
  (12 / 12). No script errors.
- Carousel restyled on request: no white panel and no title text, just the credential over
  the dark backdrop with a close pill, round arrow buttons, and the counter in the site's
  colours. Slides keep their accessible names ("3 of 12: …") and image alt text. Clicking
  outside the image closes it.

## Follow-up: AWS Machine Learning Engineer Nanodegree

- Added the Udacity certificate (awarded 2026-10-01) from the user's PDF, rendered to PNG.
  It sits in the fan to the right of Software Architect; NLP moved to the outer right and
  Mathematics for ML into the scrollable part of the row. 11 certificates and 2 badges.
- Open: the home page's "Current project" line still says the ISIC capstone is awaiting
  review, which the awarded certificate contradicts. Left for the user to reword.
- Skills from the nanodegree projects: home notes gained SageMaker endpoints and endpoint
  auto scaling (SageMaker, Lambda, S3, EC2, IAM, Step Functions, CloudWatch, Boto3, and
  AutoGluon were already there). The Experience toolbox gained AWS Lambda, Amazon S3,
  Amazon EC2, AWS Step Functions, and AutoGluon, with text-badge chips. LightGBM is left out
  at the user's request: individual models are not listed as skills.

## Follow-up: work list, article wording, fraud case study

- Home "My work": removed the "Current project" note; order is now Skin Cancer Detection,
  Real-Time Financial Fraud Detection, Dog Breed Classification. The XOR article is hidden
  (`draft: true`, so it is out of production builds, the blog, RSS, and the sitemap) and its
  row and hover art are removed.
- Removed every "endpoint deleted/retired after testing" mention (dog-breed and skin-cancer
  pages) and the "not for diagnosis" closing line on the skin-cancer page, at the user's request.
- Fraud case study: blog card title is now "Real-Time Financial Fraud Detection Case Study".
  The body was rewritten in plain first person. Facts come from the submitted architecture
  PDF (services, events, trade-offs, the 99.9% availability target, no service mesh); the
  design-not-measured callout stays.
- Checks: `npm run verify` pass (4 content files); `dist` has no XOR page or links to it.

## Follow-up: contact section, light theme, RSS removed

- Home heading "My work" is now "Blog & Work Samples" (and the matching back links).
- Closing section: "Start a conversation" on the left; email (shown as the address), GitHub,
  LinkedIn, and Resume together on the right with icons (`Icon.astro`: Simple Icons marks for
  GitHub and LinkedIn, line drawings for the rest).
- RSS removed at the user's request: the feed route, the head link, the footer link, and the
  `@astrojs/rss` dependency.
- Light theme: a header toggle (sun/moon) sets `data-theme="light"` on `<html>`, saved in
  `localStorage` and applied by a small inline script before first paint. Light is the
  default (the user's choice); dark is one click away. Light re-points the tokens (paper `#f3f2e9`, ink `#1b201c`, muted `#5a6259`, line
  `#d3d4c6`, accent `#47650b`). Adjusted for light: the RIZZY fill and glow (deep green), hero
  particles (darker and stronger), certificate shadows, tech chips (ink text), and the
  always-dark blog art and hover previews (they keep the dark tokens).
- Certificate carousel: the backdrop is now a translucent blur of the page in the theme's
  paper colour instead of a dark sheet; controls use theme tokens; the opened slide and its
  neighbours load eagerly.
- Checks: `npm run verify` pass. Headless Chrome screenshots of every page in light and dark
  at 1440px; hero, skill notes, and carousel also checked in the user's Chrome in light mode.
  White blocks behind the skill notes in headless light screenshots did not reproduce in real
  Chrome (headless raster artifact). Not checked: light theme at phone width.

## Follow-up: header, RIZZY outline, skill logos

- Header: "Projects" link removed; the dot before "Pause motion" removed.
- RIZZY: after trying solid letters, the user kept outlined letters with a heavier solid
  outline (2.5px, ink colour per theme); the pointer still fills them in.
- Skill notes: 51 skills show the same logo as the Experience chips (shared `chips` data and
  `/tech` files), tinted with the brand colour darkened for the pastel paper. Skills without
  a logo file (AWS services, concepts) stay text only.
- Checks: `npm run verify` pass; spread notes screenshotted at 1440px (dark theme).

## Follow-up: repository and deployment

- Pushed to `github.com/xRizwan/Portfolio` (`main`). `prototypes/` and the root `Image.png`
  are git-ignored. Tracked files were scanned for local paths and secrets (none).
- CI first failed at lint: type-aware rules need Astro's generated types, which a fresh
  checkout lacks. `npm run lint` now runs `astro sync` first; the next run passed.
- Deployed to Vercel (project `portfolio`, GitHub import, Astro preset, production from
  `main`): https://portfolio-rho-eosin-4yuo5wl6kt.vercel.app. Checked live: pages return 200,
  unknown URLs and the hidden XOR article return 404, canonical and sitemap use the
  production domain, `robots.txt` allows crawling.
- Still not run: Lighthouse and a structured-data validator. No custom domain yet.

## Follow-up: Lighthouse, structured data, home performance

- Lighthouse (mobile, live): blog and the skin-cancer case study 100/100/100/100; home
  77 performance (blocking time from the 3D scenes), 100 for the other three categories.
- schema.org validator on six live pages: 0 errors, 0 warnings.
- Home changes: the 3D scenes start after load when the browser is idle
  (`src/scripts/hero-start.ts`) and compile shaders asynchronously; the photo placeholder
  matches the 3D frame's position and size; the name's font is preloaded so it no longer
  draws in a wider fallback font first (865px then 703px on a slow connection before the fix).
- Phone header: "Pause motion" sits under the name; the header grows instead of overflowing.
- Local Lighthouse, home: performance 67-69 before, 76-80 after; blocking time unchanged.
- Live Lighthouse after the change, home: performance 87, 80, 79 over three runs (77 before);
  blocking time 460-500ms (930ms before). The user accepted this and removed the 95 target.

## Follow-up: arrows as SVG icons

- The arrows were text characters (↗ ↓ ← →). The site's fonts do not contain "↗", so each
  device drew it with a system font (Segoe UI Symbol on Windows), and it looked different
  elsewhere. They are now CSS-masked SVG icons (`.arrow` in `global.css`) that take the text
  colour and scale with the font size.
- The diagonal arrow is traced from the old glyph's measured outline, at the size the font
  drew it (0.506em); the logo's is heavier. "Explore my toolkit" keeps its old height, arrow
  position, and weight; "Start a conversation" has the arrow centred on the text.
- Frontmatter labels no longer carry arrow characters; `EntryLayout` draws them.
- Checks: `npm run verify` pass; 4x side-by-side captures against the live site for the logo,
  a work row, the toolkit link, and the closing link (light theme, 1440px).
