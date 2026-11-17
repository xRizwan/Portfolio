// Artwork manifest: intrinsic sizes of the sprites in public/lab/runner, so every <img> can
// carry its width and height.
export const sprites = {
  block: [150, 147],
  'block-used': [150, 147],
  treat: [90, 49],
  sign: [220, 232],
  spring: [150, 184],
  plank: [240, 103],
  log: [300, 216],
  bridge: [320, 206],
  pole: [70, 256],
  pennant: [110, 81],
  chest: [200, 164],
  'chest-open': [210, 207],
  door: [300, 289],
  castle: [260, 422],
  lantern: [110, 213],
  billboard: [360, 358],
  snail: [130, 100],
  bird: [110, 92],
  'bird-fly': [130, 116],
  frog: [130, 130],
  butterfly: [100, 74],
  bush: [220, 157],
  flowers: [150, 157],
  dust: [130, 86],
  cloud: [330, 130],
  ledge: [340, 189],
  ramp: [330, 210],
  boulder: [200, 185],
  stalagmite: [180, 218],
  crystals: [180, 221],
  frame: [220, 279],
  star: [110, 102],
} as const satisfies Record<string, readonly [number, number]>;

export type SpriteName = keyof typeof sprites;

export const art = (name: string): string => `/lab/runner/${name}.webp`;

/** Ground tiles: size of the image and how far below its top edge the walking surface sits. */
export const groundTiles = {
  meadow: { width: 3048, height: 171, top: 45 },
  sky: { width: 3048, height: 166, top: 33 },
  sunset: { width: 3048, height: 161, top: 30 },
  cave: { width: 3048, height: 130, top: 19 },
} as const;

/** Width over height of the mirrored background tiles. */
export const backdrops = {
  far: { meadow: 3, sky: 3, sunset: 3, cave: 3 },
  mid: { meadow: 2600 / 369, sky: 2600 / 770, sunset: 2600 / 430, cave: 2600 / 871 },
} as const;

/** The hero strip: twelve poses on one row, feet on one baseline. */
export const hero = { frames: 12, cellWidth: 280, cellHeight: 264 } as const;
