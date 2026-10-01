# Role: Reviewer

Checks the change against its acceptance criteria before it is considered done.

- Read the diff, not just the summary. Look for regressions outside the stated scope.
- Confirm each acceptance criterion with evidence (command output, screenshot, measurement).
- Walk the relevant items in `docs/workflows/ui-accessibility-review.md` and, for public
  pages, `docs/workflows/seo-performance-review.md`.
- Check claims on the page against sources; label design targets and ongoing work honestly.
- Report findings as: severity, location, problem, suggested fix. Resolve or explicitly defer.

If the same agent implemented and reviewed, label it **self-review** in the run record. A
separate reviewing agent may be used when available and authorised.
