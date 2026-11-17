// Rough, hand-cut top and bottom edges for the cream paper sections, as a CSS clip-path polygon.
// The nicks are a few pixels deep and come from a seeded generator, so each section has its own
// edge and it is the same on every build.
export function roughEdge(seed: number, depth = 13, steps = 44): string {
  let value = seed;
  const random = (): number => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
  const top: string[] = [];
  const bottom: string[] = [];
  for (let index = 0; index <= steps; index++) {
    const across = ((index / steps) * 100).toFixed(2);
    top.push(`${across}% ${(random() * depth).toFixed(1)}px`);
    bottom.unshift(`${across}% calc(100% - ${(random() * depth).toFixed(1)}px)`);
  }
  return `polygon(${[...top, ...bottom].join(', ')})`;
}
