# 002 — ISIC capstone article

Date: 2026-10-02. Roles: implementer, self-review.

## Objective and acceptance criteria

- A short article on the ISIC 2024 skin-cancer capstone that summarises the report.
- The report and the proposal are downloadable from the article.

## Changes

- `src/content/projects/isic-skin-cancer-detection.mdx`: the article (project entry with a blog card).
- The article links to the GitHub repository (sidebar, text, and a button).
- `public/documents/isic-skin-cancer-report.pdf`, `isic-skin-cancer-proposal.pdf`: the downloads.
- `src/content.config.ts`, `src/pages/blog/index.astro`: new blog card art `pauc` (shows 0.169).
- `src/data/work.ts`, `src/components/home/WorkList.astro`: new row and hover preview `triage`;
  the "Current project" note now says the capstone is finished and not yet submitted.

## Checks run

- `npm run verify`: pass (4 content files, 10 tests, 8 pages built).
- Manual: screenshots of the article and the blog index at 1280px from `astro preview`; both PDFs
  return 200. All numbers were taken from the capstone report.

## Review findings

- `.action.secondary` rendered with invisible text inside the article body → both download
  links use the primary `.action` style in a wrapping flex row.

## Status and limitations

- Not checked at a phone width, with the keyboard, or with reduced motion.
- The capstone is not yet submitted or reviewed; the "Current project" note needs an update after.
