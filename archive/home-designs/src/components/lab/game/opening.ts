// The pinned opening: turns scroll progress into the title lifting away, the map unrolling, the
// road being drawn, the landmarks painting in and the traveller walking up to the village.
import { select } from '../../../scripts/motion';
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  nodeFractions,
  placeNodes,
  places,
  roadPoint,
  roadSegments,
} from './places';

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
/** 0 before `from`, 1 after `to`, linear between. */
const span = (value: number, from: number, to: number): number =>
  clamp01((value - from) / (to - from));
const ease = (t: number): number => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export interface Opening {
  /** Applies the scene for the current scroll position and returns the progress (0 to 1). */
  update: (scrollY: number, force?: boolean) => number;
  /** Drops every scripted value so the stylesheet's finished, static scene shows. */
  reset: () => void;
  /** Page offset at which the opening has been scrolled through. */
  end: () => number;
}

const scriptedProperties = [
  '--lift',
  '--u',
  '--draw',
  '--rest',
  '--pan',
  '--table',
  '--token',
  '--title-vis',
  ...places.map((_, index) => `--k${index}`),
];

export function createOpening(): Opening | null {
  const section = select('[data-open]', HTMLElement);
  const pin = select('[data-open-pin]', HTMLElement);
  const map = select('[data-map]', HTMLElement);
  const token = select('[data-token]', HTMLElement);
  if (!section || !pin || !map) return null;

  const segments = roadSegments();
  const fractions = nodeFractions(segments);
  const villageNode = placeNodes[0] ?? 0;
  const village = places[0];
  let last = -1;

  /** Road progress (in nodes) for a given share of the road's length. */
  const nodeAtFraction = (fraction: number): number => {
    for (let index = 1; index < fractions.length; index += 1) {
      const from = fractions[index - 1] ?? 0;
      const to = fractions[index] ?? 1;
      if (fraction <= to) return index - 1 + (to > from ? (fraction - from) / (to - from) : 0);
    }
    return segments.length;
  };

  const range = (): number => section.offsetHeight - innerHeight;

  const update = (scrollY: number, force = false): number => {
    const length = range();
    const progress = length > 0 ? clamp01((scrollY - section.offsetTop) / length) : 1;
    if (!force && Math.abs(progress - last) < 0.0003) return progress;
    last = progress;

    const lift = ease(span(progress, 0.02, 0.2));
    const unroll = ease(span(progress, 0.1, 0.32));
    const draw = span(progress, 0.32, 0.76);
    const walk = ease(span(progress, 0.79, 0.98));
    const style = pin.style;
    style.setProperty('--lift', lift.toFixed(4));
    style.setProperty('--u', unroll.toFixed(4));
    style.setProperty('--draw', draw.toFixed(4));
    style.setProperty('--rest', span(progress, 0.7, 0.8).toFixed(3));
    style.setProperty('--table', span(progress, 0.06, 0.15).toFixed(3));
    style.setProperty('--token', span(progress, 0.76, 0.79).toFixed(3));
    style.setProperty('--title-vis', lift >= 1 ? 'hidden' : 'visible');

    // Each landmark's paint spreads as the ink of the road reaches it.
    places.forEach((_, index) => {
      const at = fractions[placeNodes[index] ?? 0] ?? 0;
      const grown = ease(span(draw, at - 0.1, Math.min(1, at + 0.03)));
      style.setProperty(`--k${index}`, (grown * 1.3).toFixed(3));
    });

    const walker = roadPoint(segments, walk * villageNode);
    if (token) {
      token.style.left = `${((walker[0] / MAP_WIDTH) * 100).toFixed(2)}%`;
      token.style.top = `${((walker[1] / MAP_HEIGHT) * 100).toFixed(2)}%`;
      // A small hop for every step of the walk.
      token.style.marginTop = `${(-Math.abs(Math.sin(walk * Math.PI * 9)) * 5).toFixed(1)}px`;
    }

    // On narrow screens the map is wider than its window: pan so the ink tip, and then the
    // traveller, stay in view.
    const mapWidth = map.offsetWidth;
    const windowWidth = map.parentElement?.clientWidth ?? mapWidth;
    let pan = 0;
    if (mapWidth > windowWidth + 1) {
      const tip = roadPoint(segments, nodeAtFraction(draw));
      const focus = lerp(tip[0], walker[0], ease(span(progress, 0.72, 0.8)));
      pan = Math.min(
        0,
        Math.max(windowWidth - mapWidth, windowWidth / 2 - (focus / MAP_WIDTH) * mapWidth),
      );
    }
    style.setProperty('--pan', `${pan.toFixed(1)}px`);

    pin.dataset.stage = progress < 0.32 ? '1' : progress < 0.77 ? '2' : '3';
    return progress;
  };

  const reset = (): void => {
    last = -1;
    for (const property of scriptedProperties) pin.style.removeProperty(property);
    pin.dataset.stage = '0';
    if (token && village) {
      token.style.left = `${((village.stop[0] / MAP_WIDTH) * 100).toFixed(2)}%`;
      token.style.top = `${((village.stop[1] / MAP_HEIGHT) * 100).toFixed(2)}%`;
      token.style.marginTop = '';
    }
  };

  return { update, reset, end: () => section.offsetTop + Math.max(0, range()) };
}
