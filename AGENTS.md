# Portfolio agent guide

Muhammad Rizwan's portfolio: a static Astro site deployed to Vercel. Projects, case studies, a
blog, experience, skills, and certificates, with playful interaction (3D cats, a
ball of yarn, sticky notes).

## Start here

- Architecture and directory map: [docs/architecture.md](docs/architecture.md)
- Workflows (feature, bug fix, content, reviews, release): [docs/workflows/](docs/workflows/README.md)
- Roles (planner, implementer, reviewer): [docs/roles/](docs/roles/)
- Run records: [docs/agent-runs/](docs/agent-runs/README.md)

## Commands (Node 22.18+; see `.nvmrc`)

| Command                     | Purpose                                                       |
| --------------------------- | ------------------------------------------------------------- |
| `npm run dev`               | Dev server (drafts visible)                                   |
| `npm run build`             | Content validation, then the static build into `dist/`        |
| `npm run preview`           | Serve the production build                                    |
| `npm run lint`              | ESLint (TypeScript, Astro, jsx-a11y), zero warnings           |
| `npm run typecheck`         | `astro check`                                                 |
| `npm run format` / `:check` | Prettier                                                      |
| `npm run validate:content`  | Cross-file content rules (toc ids, local links, slugs, dates) |
| `npm run test`              | Focused Vitest unit tests (`src/**/*.test.ts`)                |
| `npm run check`             | Format check, lint, types, content validation, tests          |
| `npm run verify`            | `check` plus the production build (what CI runs)              |

## Working rules

- Follow the loop: inspect → acceptance criteria → implement → verify → review → resolve →
  record. Routine, reversible work inside the requested scope needs no extra approval.
- Keep essential content in the initial HTML. Every interactive feature must degrade to a
  working page without JavaScript, without WebGL, and with reduced motion. Use `motion.ts`.
- Design: keep the established look. Tokens live on `.current` in `src/styles/global.css`
  (paper `#0e100f`, ink `#edf0e4`, muted `#a2aaa0`, line `#363d35`, accent `#d4ef69`).
  The light theme (the default) re-points the same tokens under `[data-theme='light']`; check
  new UI in both.
  Fonts are self-hosted via Fontsource (Bricolage Grotesque, Manrope, Newsreader, Caveat,
  Space Mono). Tailwind is not used; the design is plain CSS.
- Code: TypeScript (strict, `noUncheckedIndexedAccess`), kebab-case files, PascalCase
  components and types, named exports, two-space indentation, content separate from layout.
  Comment non-obvious decisions. Explain every lint suppression where it is configured.
- Dependencies: add one only when a native capability is not enough, and state why.
- Testing: Vitest only for non-trivial logic in `src/lib/`. **No E2E, Playwright, Cypress,
  or visual-regression suites.** Screenshots may be taken as review evidence.
- Accessibility: semantic HTML, visible focus, keyboard access, descriptive alternatives,
  accessible dialogs, reduced motion.
- SEO/AEO: unique titles and descriptions, canonical URLs, JSON-LD consistent with visible
  content, sitemap, real 404s. Never claim rankings or indexing without evidence.

## Content rules

- Sources: the supplied resumes, project files, certificates, and the user's statements.
  Never invent metrics, dates, links, employers, or credentials.
- Identity: Muhammad Rizwan, `xrizwanr@gmail.com`, GitHub `xRizwan`, LinkedIn
  `muhammad-rizwan-j`.

## Completion

A change is done when its acceptance criteria are met with evidence, `npm run verify` passes,
relevant manual checks are recorded in a run record, and remaining limitations are stated.
Report failures and skipped checks plainly; label same-agent review as self-review.
