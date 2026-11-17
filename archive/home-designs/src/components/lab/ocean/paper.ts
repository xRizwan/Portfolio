// Build-time helpers that make shapes look cut with scissors rather than drawn by a computer.

/** Small seeded generator so the "random" cuts are the same on every build. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface EdgeOptions {
  seed: number;
  /** viewBox height; the path fills from the cut edge down to this value. */
  height: number;
  /** Size of the slow swell along the edge, in viewBox units. */
  swell?: number;
  /** Size of the small scissor wobble, in viewBox units. */
  jitter?: number;
  /** Number of straight snips along the 1000-unit width. */
  snips?: number;
}

/**
 * A band for a `0 0 1000 <height>` viewBox whose top edge is an uneven scissor cut and whose
 * other three sides are straight. Stretch it with `preserveAspectRatio="none"`.
 */
export function cutEdge({ seed, height, swell = 10, jitter = 4, snips = 46 }: EdgeOptions): string {
  const random = seeded(seed);
  const phase = random() * Math.PI * 2;
  const waves = 2 + Math.floor(random() * 3);
  const top = swell + jitter;
  const points: string[] = [];
  for (let index = 0; index <= snips; index += 1) {
    const x = (index / snips) * 1000;
    const y =
      top +
      Math.sin(phase + (index / snips) * Math.PI * 2 * waves) * swell +
      (random() - 0.5) * 2 * jitter;
    points.push(`${x.toFixed(1)},${Math.max(0, y).toFixed(1)}`);
  }
  return `M0,${height} L${points.join(' L')} L1000,${height} Z`;
}

/** The same cut band as a CSS `mask-image` value, for elements that carry a painted texture. */
export function edgeMask(options: EdgeOptions, flip = false): string {
  // Flipped, the cut runs along the bottom instead of the top.
  const turn = flip ? ` transform='translate(0 ${options.height}) scale(1 -1)'` : '';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 ${options.height}' preserveAspectRatio='none'><path d='${cutEdge(options)}'${turn}/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** A slightly off-square polygon for `clip-path`, so paper panels do not have machine corners. */
export function cutPanel(seed: number): string {
  const random = seeded(seed);
  const nudge = (max: number) => (random() * max).toFixed(2);
  const corners = [
    `${nudge(1.2)}% ${nudge(2.4)}%`,
    `${(34 + random() * 30).toFixed(1)}% ${nudge(1)}%`,
    `${(100 - random() * 1.2).toFixed(2)}% ${nudge(2.6)}%`,
    `${(100 - random() * 0.8).toFixed(2)}% ${(40 + random() * 20).toFixed(1)}%`,
    `${(100 - random() * 1.4).toFixed(2)}% ${(100 - random() * 2.4).toFixed(2)}%`,
    `${(40 + random() * 30).toFixed(1)}% ${(100 - random() * 1).toFixed(2)}%`,
    `${nudge(1.4)}% ${(100 - random() * 2.6).toFixed(2)}%`,
    `${nudge(0.8)}% ${(40 + random() * 20).toFixed(1)}%`,
  ];
  return `polygon(${corners.join(', ')})`;
}
