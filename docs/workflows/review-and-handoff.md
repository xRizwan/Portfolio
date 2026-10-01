# Review and handoff

1. The reviewer (or the implementer, as self-review) walks the diff and the acceptance
   criteria; see `docs/roles/reviewer.md`.
2. Findings are resolved, or deferred with a stated reason.
3. The run record states: objective, changes, checks actually run and their results, review
   findings and resolutions, remaining limitations, and a commit reference when one exists.
4. The summary for the user says what changed and how it was verified. Checks that were not
   run are reported as not run; failures are reported with their output.
