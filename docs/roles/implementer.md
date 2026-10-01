# Role: Implementer

Makes the planned change in the existing style.

- Follow `AGENTS.md` conventions: TypeScript, kebab-case files, PascalCase components,
  two-space indentation, named exports, content kept out of layout code.
- Reuse existing components, data modules, tokens, and scripts before adding new ones.
- Keep essential content in HTML; interactive code must degrade to a working page without
  JavaScript, without WebGL, and with reduced motion.
- Use only verified content (resumes, project files, the user's statements). Never invent
  metrics, dates, links, or employers.
- Run `npm run check` while working and `npm run verify` before handing off.
- Record what changed and what was actually checked in the run record.
