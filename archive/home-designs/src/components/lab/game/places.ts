// The world map: where each page section sits on the painted map, and the road that joins them.
// Coordinates are in the map image's own pixels (1600 x 900) so they can be read off the artwork.

export const MAP_WIDTH = 1600;
export const MAP_HEIGHT = 900;

export interface Place {
  /** Section id on the page (also the anchor target). */
  id: string;
  /** Name written on the map. */
  name: string;
  /** What the section holds, in plain words. */
  holds: string;
  /** Where the road stops. */
  stop: [number, number];
  /** Where the name is written. */
  label: [number, number];
  /** Centre and radii of the watercolour that paints in for this landmark. */
  paint: { at: [number, number]; rx: number; ry: number };
}

export const places: Place[] = [
  {
    id: 'about',
    name: 'Home village',
    holds: 'About',
    stop: [420, 790],
    label: [665, 735],
    paint: { at: [235, 765], rx: 330, ry: 190 },
  },
  {
    id: 'skills',
    name: 'Forest camp',
    holds: 'Skills',
    stop: [470, 440],
    label: [240, 572],
    paint: { at: [235, 400], rx: 340, ry: 250 },
  },
  {
    id: 'experience',
    name: 'Mountain road',
    holds: 'Experience',
    stop: [680, 245],
    label: [612, 300],
    paint: { at: [600, 120], rx: 760, ry: 190 },
  },
  {
    id: 'work',
    name: 'Dragon’s cave',
    holds: 'Work',
    stop: [1300, 225],
    label: [1440, 262],
    paint: { at: [1390, 120], rx: 330, ry: 200 },
  },
  {
    id: 'certificates',
    name: 'Trophy tower',
    holds: 'Certificates',
    stop: [930, 556],
    label: [770, 622],
    paint: { at: [780, 430], rx: 330, ry: 240 },
  },
  {
    id: 'contact',
    name: 'Harbour',
    holds: 'Contact',
    stop: [1150, 520],
    label: [1215, 650],
    paint: { at: [1370, 500], rx: 380, ry: 260 },
  },
];

type Point = [number, number];

// The road as a list of points. `null` entries are replaced by the places' stops, in order, so
// the road always passes exactly through them; the rest are bends that keep it winding.
const route: (Point | null)[] = [
  [610, 912],
  [530, 852],
  null, // village
  [545, 640],
  null, // forest camp
  [505, 300],
  null, // mountain road
  [1000, 262],
  null, // dragon's cave
  [1130, 330],
  [1010, 420],
  null, // trophy tower
  [1040, 610],
  null, // harbour
];

let next = 0;
/** Index into `roadNodes` of each place's stop, in the order of `places`. */
export const placeNodes: number[] = [];
export const roadNodes: Point[] = route.map((point, index) => {
  if (point) return point;
  const place = places[next];
  next += 1;
  placeNodes.push(index);
  return place ? place.stop : [0, 0];
});

/** One cubic Bezier piece of the road: start, two control points, end. */
export type Segment = [number, number, number, number, number, number, number, number];

/** Catmull-Rom spline through the nodes, written as cubic Bezier pieces (one per pair of nodes). */
export function roadSegments(nodes: Point[] = roadNodes): Segment[] {
  const at = (index: number): Point =>
    nodes[Math.min(nodes.length - 1, Math.max(0, index))] ?? [0, 0];
  const segments: Segment[] = [];
  for (let index = 0; index < nodes.length - 1; index += 1) {
    const [p0, p1, p2, p3] = [at(index - 1), at(index), at(index + 1), at(index + 2)];
    segments.push([
      p1[0],
      p1[1],
      p1[0] + (p2[0] - p0[0]) / 6,
      p1[1] + (p2[1] - p0[1]) / 6,
      p2[0] - (p3[0] - p1[0]) / 6,
      p2[1] - (p3[1] - p1[1]) / 6,
      p2[0],
      p2[1],
    ]);
  }
  return segments;
}

const round = (value: number): string => value.toFixed(1);

/** SVG path data for the whole road. */
export function roadPath(segments: Segment[] = roadSegments()): string {
  const first = segments[0];
  if (!first) return '';
  return (
    `M${round(first[0])} ${round(first[1])}` +
    segments.map((s) => `C${s.slice(2).map(round).join(' ')}`).join('')
  );
}

/**
 * How far along the road's length (0 to 1) each node sits. The opening draws the road by
 * length, so this tells it when the ink reaches each place.
 */
export function nodeFractions(segments: Segment[] = roadSegments()): number[] {
  const lengths = segments.map((_, index) => {
    let length = 0;
    let previous = roadPoint(segments, index);
    for (let step = 1; step <= 16; step += 1) {
      const point = roadPoint(segments, index + step / 16);
      length += Math.hypot(point[0] - previous[0], point[1] - previous[1]);
      previous = point;
    }
    return length;
  });
  const total = lengths.reduce((sum, length) => sum + length, 0) || 1;
  let run = 0;
  return [
    0,
    ...lengths.map((length) => {
      run += length;
      return run / total;
    }),
  ];
}

/** Point on the road at `progress`, counted in nodes (0 = first node, 1.5 = half way to the third). */
export function roadPoint(segments: Segment[], progress: number): Point {
  const clamped = Math.min(segments.length, Math.max(0, progress));
  const index = Math.min(segments.length - 1, Math.floor(clamped));
  const s = segments[index];
  if (!s) return [0, 0];
  const t = clamped - index;
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [a * s[0] + b * s[2] + c * s[4] + d * s[6], a * s[1] + b * s[3] + c * s[5] + d * s[7]];
}
