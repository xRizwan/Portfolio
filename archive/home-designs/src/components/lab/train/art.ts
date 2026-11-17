// The woodblock artwork in /public/lab/train, with the pixel sizes the layout needs.

export interface Art {
  src: string;
  width: number;
  height: number;
}

const piece = (name: string, width: number, height: number): Art => ({
  src: `/lab/train/${name}.webp`,
  width,
  height,
});

export const art = {
  station: piece('station', 1672, 941),
  loco: piece('loco', 1300, 409),
  carriage: piece('carriage', 1300, 380),
  diner: piece('diner', 1400, 351),
  // Landscape strips. Each is a picture joined to its own mirror image, so it repeats without a seam.
  far: piece('far', 2200, 263),
  hills: piece('hills', 2600, 419),
  city: piece('city', 2600, 412),
  near: piece('near', 1702, 499),
  compartment: piece('compartment', 1200, 800),
  dining: piece('dining', 1200, 800),
  dawn: piece('dawn', 1536, 1024),
  catAsleep: piece('cat-1', 420, 307),
  catAwake: piece('cat-2', 420, 328),
  suitcase: piece('luggage-1', 420, 402),
  trunk: piece('luggage-2', 460, 326),
  hatbox: piece('luggage-3', 385, 378),
  lantern: piece('sprite-1', 332, 504),
  tea: piece('sprite-2', 381, 406),
  cloche: piece('sprite-3', 440, 330),
  moth: piece('sprite-4', 440, 228),
} as const;

/** Width of one repeat of a strip, as a multiple of its height. */
export const ratio = (strip: Art): string => (strip.width / strip.height).toFixed(4);
