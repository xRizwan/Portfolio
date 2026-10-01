# Feature implementation

1. **Inspect.** Read `AGENTS.md`, `docs/architecture.md`, and the files you will touch.
2. **Plan** (planner role). Acceptance criteria, files, checks. Start a run record.
3. **Implement** (implementer role). Editorial content goes in `src/content/` or `src/data/`;
   markup in components; behaviour in `src/scripts/` using the shared `motion.ts` helpers.
   New styles go in `src/styles/global.css` using the tokens on `.current`.
4. **Verify.** `npm run verify`, then `npm run preview` and check affected pages at 375, 768,
   and 1440px (see the UI review workflow). Screenshots are fine as evidence; do not add E2E
   or browser-automation test suites.
5. **Review** (reviewer role) and resolve findings.
6. **Record** the outcome in the run record.

Done means: acceptance criteria met with evidence, `npm run verify` passes, manual checks
recorded, no unexplained lint suppressions, no invented content.
