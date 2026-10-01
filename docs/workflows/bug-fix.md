# Bug fix

1. **Reproduce.** Write down the steps, viewport, and browser. Capture the failing state.
2. **Find the cause**, not just the symptom. Check shared helpers that other pages use.
3. **Fix** at the cause with the smallest reasonable change.
4. **Guard.** If the logic lives in `src/lib/` and is testable, add a focused Vitest case that
   fails before the fix. Visual and interaction bugs are verified manually instead.
5. **Verify** the original reproduction and nearby behaviour; run `npm run verify`.
6. **Record** the cause, fix, and evidence in a short run record.
