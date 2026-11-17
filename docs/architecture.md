# Architecture

A static Astro site (no server runtime) deployed to Vercel. Readable HTML is generated at
build time; interactive scenes are small browser modules that enhance it.

## Directories

| Path                    | Responsibility                                                                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/`            | Routes: `/`, `/blog/`, `/blog/[slug]/`, `/work/[slug]/`, `/experience/`, `/404`, `/robots.txt`                                                                       |
| `src/layouts/`          | `BaseLayout` (head, header, footer, global script), `EntryLayout` (articles and case studies) and `HomeLayout` (the home page's own shell)                           |
| `src/components/`       | Shared pieces (`Seo`, `SiteHeader`, `SiteFooter`, `Callout`, `FlowExplorer`, `TechChip`)                                                                             |
| `src/components/book/`  | The home page, a paper pop-up book: one component per spread, `book.ts` (the 3D book engine), `parts.ts` (shutters, wheel, doors, concertina), `life.ts` (desk life) |
| `src/components/home/`  | `KittenHead` and `KittenSit`, used by the blog's heading                                                                                                             |
| `archive/`              | Retired home-page designs, not built (see `archive/README.md`)                                                                                                       |
| `src/content/`          | MDX articles and projects, validated by `src/content.config.ts`                                                                                                      |
| `src/data/`             | Typed editorial data: site identity, skills, experience, certificates, work rows                                                                                     |
| `src/lib/`              | Build-time logic: publication rules, collection helpers, structured data, validation                                                                                 |
| `src/scripts/`          | Browser modules (TypeScript), imported from component `<script>` tags                                                                                                |
| `src/styles/global.css` | Global styles and design tokens (rule order matters)                                                                                                                 |
| `src/assets/`           | Images optimized by `astro:assets` (portrait, certificates)                                                                                                          |
| `public/`               | Files served as-is: documents, diagrams, tech logos, favicon, social image                                                                                           |
| `scripts/`              | Node scripts (content validation)                                                                                                                                    |

## Content model

- `articles` — blog posts (`/blog/<id>/`). Frontmatter: title, headline, description, intro,
  eyebrow, pubDate, optional updatedDate, draft, topics, toc, optional source, blog card.
- `projects` — case studies (`/work/<id>/`). Adds status, meta, tocLinks, backLink, optional
  diagram, and an optional blog card (projects with one are listed on the blog).
- The file name is the slug. `draft: true` hides an entry everywhere in production
  (`src/lib/collections.ts`), while `astro dev` still shows it.
- `npm run validate:content` checks what schemas cannot: table-of-contents ids, local links
  and assets, duplicate slugs, and date order (`src/lib/validate.ts`).

## Browser scripts

All interactive behaviour is decorative enhancement over complete HTML:

| Module                          | Behaviour                                                                                          | Fallback                 |
| ------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------ |
| `site-chrome`                   | Reduced-motion class, theme toggle, current-page nav, cursor label, magnetic links, progress bar   | —                        |
| `components/book/book.ts`       | Home: pinned 3D pop-up book; scroll stands pieces up and turns the pages (≥1180×620)               | Flat stack of open pages |
| `components/book/parts.ts`      | Home: lift-up shutters, skills wheel, theatre doors, certificate concertina and viewer, role notes | Everything open, links   |
| `components/book/life.ts`       | Home: drifting clouds, balloon, peeking cat, paper scraps                                          | Hidden                   |
| `blog-filters`, `flow-explorer` | Filters, stage explainer                                                                           | Full list                |

`motion.ts` is the single source for "is motion allowed" (the OS reduced-motion setting). Scenes stop when offscreen or hidden and hold still when
motion is off. Below 1180×620 the home book becomes flat pages whose pieces stand up as they
scroll in; with reduced motion or no scripts the pages are flat and fully open.

## Metadata and discovery

`Seo.astro` renders the title, description, canonical URL, Open Graph/Twitter tags, and
JSON-LD from `src/lib/structured-data.ts` (WebSite, ProfilePage/Person, BlogPosting,
Article, BreadcrumbList). The origin comes from `SITE_URL`, else Vercel's production URL.
Vercel preview builds are `noindex` and their `robots.txt` blocks crawling.
