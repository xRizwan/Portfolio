// Sizes of the cut-paper artwork in /public/lab/ocean, so every <img> can state its dimensions.

const sizes = {
  anemone: [480, 480],
  arch: [1300, 867],
  boat: [700, 358],
  bottle: [480, 480],
  chest: [560, 560],
  clownfish: [420, 280],
  crab: [420, 420],
  fan: [480, 480],
  helmet: [520, 520],
  lifebuoy: [620, 620],
  octopus: [560, 560],
  parrotfish: [480, 320],
  puffer: [420, 420],
  ray: [560, 373],
  'reef-left': [1100, 1100],
  'reef-right': [1100, 1100],
  seahorse: [420, 630],
  seaweed: [420, 630],
  shell: [480, 480],
  starfish: [420, 420],
  turtle: [560, 373],
  wreck: [1200, 800],
} as const satisfies Record<string, readonly [number, number]>;

export type ArtName = keyof typeof sizes;

/** Attributes for a decorative or labelled piece of artwork. */
export function art(name: ArtName): { src: string; width: number; height: number } {
  const [width, height] = sizes[name];
  return { src: `/lab/ocean/${name}.webp`, width, height };
}
