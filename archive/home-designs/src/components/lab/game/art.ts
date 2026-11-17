// Sizes of the ink and watercolour artwork in /public/lab/game, so every <img> can state its
// dimensions.

const sizes = {
  map: [1600, 900],
  traveller: [240, 440],
  'dragon-up': [340, 356],
  'dragon-down': [340, 356],
  frame: [560, 794],
  camp: [1500, 1000],
  hall: [1500, 844],
  raven: [420, 313],
  compass: [200, 202],
  'item-book': [176, 179],
  'item-brush': [186, 180],
  'item-anvil': [199, 172],
  'item-chest': [181, 158],
  'item-bottle': [110, 189],
  'item-orb': [146, 185],
  'item-lens': [173, 184],
  'item-lantern': [121, 200],
  'item-plan': [191, 177],
  'item-shield': [156, 193],
  'item-dice': [171, 146],
  'item-candle': [173, 192],
  'item-lock': [187, 191],
  'item-pick': [175, 187],
  'item-seal': [183, 183],
  'item-sword': [192, 200],
} as const satisfies Record<string, readonly [number, number]>;

export type ArtName = keyof typeof sizes;

/** Attributes for a piece of artwork. */
export function art(name: ArtName): { src: string; width: number; height: number } {
  const [width, height] = sizes[name];
  return { src: `/lab/game/${name}.webp`, width, height };
}
