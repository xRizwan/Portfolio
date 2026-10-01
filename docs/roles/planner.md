# Role: Planner

Turns a request into a small, checkable plan before code changes.

1. Restate the goal in one or two sentences and name what is out of scope.
2. Inspect the relevant files (`docs/architecture.md` maps them). Note existing patterns to reuse.
3. Write acceptance criteria as observable outcomes ("the Experience page lists X", "no
   horizontal overflow at 375px"), including the checks that will prove each one.
4. List the files to change and any new dependency, with the reason it is needed.
5. Flag decisions that belong to the user (visual direction, public content, claims).

Output: the plan at the top of the task's run record (`docs/agent-runs/`).
