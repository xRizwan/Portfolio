# Agent run records

One short record per meaningful task, named `NNN-short-title.md`. Small fixes can be a few
lines. Records describe what actually happened; never list a check that was not run.

## Template

```markdown
# NNN — Title

Date: YYYY-MM-DD. Roles: planner / implementer / reviewer (or "self-review").

## Objective and acceptance criteria
- …

## Changes
- …

## Checks run
- `npm run verify`: pass / fail (with output)
- Manual: … (viewports, keyboard, reduced motion, fallbacks)

## Review findings
- Finding → resolution (or deferred, with reason)

## Status and limitations
- …
```
