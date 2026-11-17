# Archive

Retired home-page designs, kept for reference. Nothing in this folder is built, linted,
type-checked or formatted (see `eslint.config.js`, `.prettierignore` and `tsconfig.json`).

Each folder mirrors the project's own layout, so a design can be brought back by copying its
files to the same paths at the project root.

## `home-designs/`

The eight trial home pages built in November 2026. They were served at `/lab/<slug>/` with a
preview switcher, using the shared shell `src/layouts/LabLayout.astro`.

| Slug       | Name          | What it is                                                      |
| ---------- | ------------- | --------------------------------------------------------------- |
| `cat`      | Cats          | A painted living room where cats wake up as you scroll          |
| `ocean`    | Reef          | A cut-paper coral reef you dive into                            |
| `game`     | Quest         | A painted fantasy map with a traveller walking the road         |
| `space`    | Space         | A rocket launch, then planets as stops                          |
| `mountain` | Summit        | A field-journal climb with an altimeter                         |
| `train`    | Night train   | A sleeper train at night, in woodblock-print style              |
| `popup`    | Pop-up        | A paper pop-up book; this one became the live home page         |
| `runner`   | Side-scroller | A hand-drawn platform level with a cat that runs as you scroll  |

To look at one again, copy back `src/pages/lab/`, `src/components/lab/<slug>/`,
`public/lab/<slug>/` and `src/layouts/LabLayout.astro`, then open `/lab/<slug>/` in the dev
server. To keep them out of the sitemap, filter `/lab/` in `astro.config.mjs`.

The live home page is a copy of `popup`, with its components in `src/components/book/` and its
artwork in `public/book/`.

## `old-home/`

The previous home page (cats in a studio, sticky skill notes, a ball of yarn and the fanned
certificate stack), with the components and scripts that only it used, and `home-2.astro`, the
local rope-cat trial. `KittenHead` and `KittenSit` stayed in `src/components/home/` because the
blog's heading uses them. The page's styles are still in `src/styles/global.css`, under the
`.variation-*` and `.yarn-*` body classes.
