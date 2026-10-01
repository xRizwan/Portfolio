# Architecture

A static Astro site (no server runtime) deployed to Vercel. Readable HTML is generated at
build time; interactive scenes are small browser modules that enhance it.

## Directories

| Path                    | Responsibility                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| `src/pages/`            | Routes: `/`, `/blog/`, `/blog/[slug]/`, `/work/[slug]/`, `/experience/`, `/404`, `/robots.txt`   |
| `src/layouts/`          | `BaseLayout` (head, header, footer, global script) and `EntryLayout` (articles and case studies) |
| `src/components/`       | Shared pieces (`Seo`, `SiteHeader`, `SiteFooter`, `Callout`, `FlowExplorer`, `TechChip`)         |
| `src/components/home/`  | Home sections: `Hero`, `SkillNotes`, `WorkList`, `CertificateShowcase`                           |
| `src/content/`          | MDX articles and projects, validated by `src/content.config.ts`                                  |
| `src/data/`             | Typed editorial data: site identity, skills, experience, certificates, work rows                 |
| `src/lib/`              | Build-time logic: publication rules, collection helpers, structured data, validation             |
| `src/scripts/`          | Browser modules (TypeScript), imported from component `<script>` tags                            |
| `src/styles/global.css` | Global styles and design tokens (rule order matters)                                             |
| `src/assets/`           | Images optimized by `astro:assets` (portrait, certificates)                                      |
| `public/`               | Files served as-is: documents, diagrams, tech logos, favicon, social image                       |
| `scripts/`              | Node scripts (content validation)                                                                |

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

| Module                                                | Behaviour                                                                   | Fallback                            |
| ----------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------- |
| `site-chrome`                                         | Motion toggle, current-page nav, cursor label, magnetic links, progress bar | —                                   |
| `hero-field`                                          | Particle field, pointer-lit RIZZY, project hover previews                   | Static text                         |
| `frame-scene`                                         | Three.js framed portrait with napping and peeking cats                      | Framed `<img>`                      |
| `title-cats`                                          | Three.js cats on RIZZY; chase the yarn                                      | `title-cat-fallback` (flat SVG cat) |
| `yarn`                                                | Draggable ball of yarn (≥901px)                                             | Hidden                              |
| `skill-notes`, `note-arrival`                         | Draggable notes, spread/stack, fly-in on first view                         | Plain grid                          |
| `certificate-dialog`, `blog-filters`, `flow-explorer` | Viewer, filters, stage explainer                                            | Links / full list                   |

`motion.ts` is the single source for "is motion allowed" (OS setting plus the Pause button).
Scenes stop when offscreen or hidden and hold still when motion is off. Three.js loads only
on the home page (one shared chunk).

## Metadata and discovery

`Seo.astro` renders the title, description, canonical URL, Open Graph/Twitter tags, and
JSON-LD from `src/lib/structured-data.ts` (WebSite, ProfilePage/Person, BlogPosting,
Article, BreadcrumbList). The origin comes from `SITE_URL`, else Vercel's production URL.
Vercel preview builds are `noindex` and their `robots.txt` blocks crawling.
