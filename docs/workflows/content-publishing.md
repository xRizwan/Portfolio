# Content publishing

Content must come from real sources: the resumes, project files, certificates, or the user's
own statements. Label design targets as targets and ongoing work as ongoing.

## New article

1. Create `src/content/articles/<slug>.mdx`. The file name is the URL slug.
2. Frontmatter: `title`, `headline` (write line breaks as `\n`), `description` (at most 200
   characters; used in search results), `intro`, `eyebrow`, `pubDate`, `topics`, `toc`, and a
   `blog` card. Optional: `updatedDate`, `source`, and `draft: true` while writing.
3. Open with a direct statement of the finding. Give headings explicit ids (`<h2 id="...">`)
   that match `toc`. Use `<Callout>` for key notes. Put tables in `<div class="table-scroll">`
   with a `<caption class="sr-only">`.
4. Downloadable files go in `public/documents/`; diagrams in `public/diagrams/`.

## New project or case study

As above, in `src/content/projects/`, plus `status`, `backLink`, and optional `meta`,
`tocLinks`, `diagram`, and a `blog` card (projects with a card appear on the blog).
To feature it on the home page, add a row to `src/data/work.ts`.

## Certificates, skills, experience, resume

- **Certificate or badge:** add the image to `src/assets/certificates/` and an entry to
  `src/data/certificates.ts` (`kind: certificate` or `badge`). Entries with a `fan` position make
  up the resting fan (keep the Udacity certificate at 0, the centre). Every other certificate
  waits behind it and, on hover, continues the fan past the edges, reached by scrolling sideways.
  Badges appear only in the "See all certificates" gallery. Every credential is also a slide in
  the certificate carousel, in the order of `credentials`.
- **Skills:** `src/data/skills.ts` (the home notes).
- **Experience and toolbox:** `src/data/experience.ts`. A new toolbox item needs a chip entry:
  a Simple Icons logo in `public/tech/` or a short text badge.
- **Resume:** replace `public/documents/muhammad-rizwan-resume.pdf`.

## Checks

Run `npm run validate:content` and `npm run verify`, then preview the page. When a published
article changes meaningfully, set `updatedDate`. When a published slug changes, add a
permanent redirect in `vercel.json`.
