// The painted artwork in public/lab/space, with the pixel size of each file so every <img> can
// reserve its space before it loads.
const sizes = {
  pad: [1600, 900],
  rocket: [448, 700],
  booster: [80, 420],
  flame: [145, 360],
  smoke: [560, 509],
  ring: [600, 421],
  gas: [554, 560],
  moon: [475, 480],
  green: [594, 600],
  ice: [478, 480],
  desert: [480, 479],
  night: [475, 480],
  sun: [480, 474],
  station: [640, 388],
  astronaut: [449, 460],
  comet: [420, 337],
  dish: [396, 560],
  cat: [435, 440],
} as const satisfies Record<string, readonly [number, number]>;

export type ArtName = keyof typeof sizes;

export function art(name: ArtName): { src: string; width: number; height: number } {
  const [width, height] = sizes[name];
  return { src: `/lab/space/${name}.webp`, width, height };
}
