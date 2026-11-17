// The painted paper pieces in public/book, with their pixel sizes so every <img> can state
// its width and height.
export const art = {
  street: { w: 1100, h: 648 },
  mountains: { w: 1200, h: 474 },
  hills: { w: 1200, h: 308 },
  pelmet: { w: 1200, h: 323 },
  house: { w: 900, h: 600 },
  grass: { w: 1200, h: 355 },
  bunting: { w: 1200, h: 240 },
  sun: { w: 420, h: 420 },
  wheel: { w: 560, h: 561 },
  cat: { w: 420, h: 454 },
  tree: { w: 420, h: 613 },
  cloud: { w: 420, h: 234 },
  balloon: { w: 360, h: 560 },
  postbox: { w: 420, h: 828 },
  boat: { w: 420, h: 263 },
} as const;

export type ArtName = keyof typeof art;

export const artSrc = (name: ArtName): string => `/book/${name}.webp`;
