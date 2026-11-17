// The hero's path over the level. Shared by the page (to hang treats along the jump arcs at build
// time) and by the engine in the browser, so the two always agree.
import type { Jump, Terrain } from './level';

/** Height of the walking surface above the plain ground at `x`. */
export function surfaceAt(terrain: Terrain[], x: number): number {
  for (const piece of terrain) {
    if (x < piece.from || x > piece.to) continue;
    const p = (x - piece.from) / (piece.to - piece.from);
    const arch = piece.arch ? piece.arch * Math.sin(Math.PI * p) : 0;
    return piece.y0 + (piece.y1 - piece.y0) * p + arch;
  }
  return 0;
}

export interface Pose {
  /** Height of the hero's feet above the plain ground. */
  y: number;
  /** Progress through a jump from 0 to 1, or -1 when on the ground. */
  air: number;
  /** Rise over run of the path at this point, for tilting the hero. */
  slope: number;
  kind: Jump['kind'] | null;
}

/** Where the hero is at `x`. Jumps are arcs over position, so they play backwards too. */
export function poseAt(jumps: Jump[], terrain: Terrain[], x: number): Pose {
  for (const jump of jumps) {
    if (x <= jump.from || x >= jump.to) continue;
    const run = jump.to - jump.from;
    const t = (x - jump.from) / run;
    const from = surfaceAt(terrain, jump.from);
    const to = surfaceAt(terrain, jump.to);
    return {
      y: from + (to - from) * t + 4 * jump.height * t * (1 - t),
      air: t,
      slope: (to - from + 4 * jump.height * (1 - 2 * t)) / run,
      kind: jump.kind,
    };
  }
  const y = surfaceAt(terrain, x);
  return { y, air: -1, slope: (surfaceAt(terrain, x + 4) - y) / 4, kind: null };
}
