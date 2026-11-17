// The parts of the world that follow you down the page: the road through the sections, the
// traveller walking it at your scroll position, the dragon overhead, and the map card with its
// compass and the count of places found.
import { finePointer, select, selectAll } from '../../../scripts/motion';
import { placeNodes, places, roadPoint, roadSegments } from './places';

type Point = [number, number];

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Width from which the left gutter exists and the road runs down it (matches the CSS). */
const WIDE = 1100;

export interface World {
  /** Measures the page again and redraws the road. */
  build: () => void;
  /** Per-frame update. `time` is in seconds, `velocity` in pixels per millisecond. */
  frame: (time: number, scrollY: number, velocity: number, openingEnd: number) => void;
  /** Scroll-only update for when motion is off: road fully drawn, no creatures. */
  still: (scrollY: number, openingEnd: number) => void;
}

export function createWorld(): World {
  const trail = select('[data-trail]', HTMLElement);
  const trailPaths = selectAll('[data-trail-path]', SVGPathElement);
  const trailClip = select('[data-trail-clip]', SVGRectElement);
  const walker = select('[data-walker]', HTMLElement);
  const dragon = select('[data-dragon]', HTMLElement);
  const dragonBody = select('.qg-dragon__body', HTMLElement);
  const hud = select('[data-hud]', HTMLElement);
  const compass = select('[data-compass]', HTMLButtonElement);
  const needle = select('[data-needle]', HTMLElement);
  const miniToken = select('[data-mini-token]', HTMLElement);
  const hudPlace = select('[data-hud-place]', HTMLElement);
  const hudCount = select('[data-hud-count]', HTMLElement);
  const header = select('[data-header]', HTMLElement);
  const sections = selectAll('[data-place]', HTMLElement);
  const stops = selectAll('[data-stop]', HTMLElement);
  const navLinks = selectAll('.qg-header__nav a', HTMLAnchorElement);

  const mapSegments = roadSegments();
  const found = new Set<string>();
  let points: Point[] = [];
  let centres: number[] = [];
  let stopLines: number[] = [];
  let pointer: Point | null = null;
  let needleAngle = 20;
  let lastWalkerX = 0;
  let lean = 0;

  // Dragon state.
  let dragonAt: Point = [innerWidth * 0.7, 140];
  let shy: Point = [0, 0];
  let swoopStart = -10;
  let facing = 1;
  let frameCount = 0;

  // Anything the dragon must not hang over: text and the cards that hold it.
  const busy =
    '.qg-head, .qg-inner p, .qg-inner li, .qg-charsheet, .qg-entry, .qg-notice, .qg-board, .qg-pouch, .qg-slot, .qg-trophy, .qg-letter, .qg-raven, .qg-footer__inner > *';
  /** True when any of a few points across the dragon's body is over text or a card. */
  const overContent = (x: number, y: number, size: number): boolean =>
    [-0.3, 0, 0.3].some((dx) =>
      [-0.15, 0.15].some((dy) => {
        const hit = document.elementFromPoint(x + dx * size, y + dy * size);
        return hit instanceof Element && hit.closest(busy) !== null;
      }),
    );

  addEventListener(
    'pointermove',
    (event) => {
      pointer = [event.clientX, event.clientY];
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => {
    pointer = null;
  });

  if (compass && hud) {
    const setOpen = (open: boolean): void => {
      hud.classList.toggle('is-open', open);
      compass.setAttribute('aria-expanded', String(open));
    };
    setOpen(innerWidth >= WIDE);
    compass.addEventListener('click', () => setOpen(!hud.classList.contains('is-open')));
  }

  const pageTop = (element: Element): number => element.getBoundingClientRect().top + scrollY;

  function build(): void {
    const wide = innerWidth >= WIDE;
    const gutter = wide ? 190 : 0;
    const next: Point[] = [];
    let side = 0;
    // Walks down one lane, stepping from one edge to the other so the road winds.
    const lane = (left: number, right: number, top: number, bottom: number): void => {
      const steps = Math.max(2, Math.round((bottom - top) / 290));
      for (let step = 0; step <= steps; step += 1) {
        next.push([side % 2 ? right : left, top + ((bottom - top) * step) / steps]);
        side += 1;
      }
    };

    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      const top = rect.top + scrollY;
      const own = section.querySelector('[data-lane-self]');
      if (own) {
        const laneRect = own.getBoundingClientRect();
        const laneTop = laneRect.top + scrollY;
        // Stay in the gutter past the heading, then swing across to the section's own lane.
        // The crossing runs through the extra gap under the heading (see GameRoad).
        if (wide) next.push([gutter * 0.5, laneTop - 100]);
        lane(laneRect.left, laneRect.right, laneTop + 56, laneTop + laneRect.height);
      } else if (wide && section.dataset.lane === 'gutter') {
        lane(46, gutter - 54, top + 34, top + rect.height - 34);
      }
    }
    points = next;

    const first = points[0];
    let d = '';
    if (first) {
      d = `M${first[0].toFixed(1)} ${first[1].toFixed(1)}`;
      for (let index = 1; index < points.length; index += 1) {
        const from = points[index - 1];
        const to = points[index];
        if (!from || !to) continue;
        const mid = ((from[1] + to[1]) / 2).toFixed(1);
        // Vertical tangents at both ends: an S-bend that never doubles back on itself.
        d += `C${from[0].toFixed(1)} ${mid} ${to[0].toFixed(1)} ${mid} ${to[0].toFixed(1)} ${to[1].toFixed(1)}`;
      }
    }
    // Collapse the road layer first so its own old height does not keep the page long.
    if (trail) {
      trail.style.height = '0px';
      trail.style.height = `${document.documentElement.scrollHeight}px`;
    }
    for (const path of trailPaths) path.setAttribute('d', d);

    centres = sections.map((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top + scrollY + rect.height / 2;
    });
    stopLines = stops.map((stop) => {
      const stone = stop.querySelector('.qg-stop__stone') ?? stop;
      const rect = stone.getBoundingClientRect();
      return rect.top + scrollY + rect.height / 2;
    });
  }

  /** The road's x at page height `y`, or null when the road does not reach that height. */
  function roadX(y: number): number | null {
    const first = points[0];
    const last = points[points.length - 1];
    if (!first || !last || y < first[1] || y > last[1]) return null;
    for (let index = 1; index < points.length; index += 1) {
      const from = points[index - 1];
      const to = points[index];
      if (!from || !to || y > to[1]) continue;
      const mid = (from[1] + to[1]) / 2;
      // Height along the bend is monotonic, so bisect for the matching parameter.
      let low = 0;
      let high = 1;
      for (let pass = 0; pass < 16; pass += 1) {
        const t = (low + high) / 2;
        const u = 1 - t;
        const at = u * u * u * from[1] + 3 * u * t * mid + t * t * t * to[1];
        if (at < y) low = t;
        else high = t;
      }
      const t = (low + high) / 2;
      const u = 1 - t;
      return (u * u * u + 3 * u * u * t) * from[0] + (3 * u * t * t + t * t * t) * to[0];
    }
    return last[0];
  }

  /** Header, map card, places found: everything that depends only on where the page is. */
  function chrome(scroll: number, openingEnd: number): void {
    header?.classList.toggle('is-solid', scroll > openingEnd - 64);
    hud?.classList.toggle('is-on', scroll > openingEnd - innerHeight * 0.45);

    const middle = scroll + innerHeight / 2;
    let current = 0;
    sections.forEach((section, index) => {
      const top = pageTop(section);
      if (top < scroll + innerHeight * 0.62) {
        current = index;
        const id = section.dataset.place;
        if (id && !found.has(id)) {
          found.add(id);
          select(`[data-mini-stop="${id}"]`, SVGCircleElement)?.classList.add('is-found');
        }
      }
    });
    if (hudCount) hudCount.textContent = String(found.size);
    const place = places[current];
    if (hudPlace && place && hudPlace.textContent !== place.name) hudPlace.textContent = place.name;
    const currentId = scroll > openingEnd - innerHeight * 0.5 ? sections[current]?.id : undefined;
    for (const link of navLinks) {
      const isCurrent = currentId !== undefined && link.hash === `#${currentId}`;
      if (isCurrent && !link.hasAttribute('aria-current')) {
        link.setAttribute('aria-current', 'true');
        // On phones the links are a sideways strip: bring the current one into view.
        const strip = link.parentElement;
        if (strip && strip.scrollWidth > strip.clientWidth) {
          strip.scrollTo({ left: link.offsetLeft - 8, behavior: 'smooth' });
        }
      } else if (!isCurrent) link.removeAttribute('aria-current');
    }

    // The dot on the small map: at a place's stop when its section is centred, between two
    // stops in between.
    if (miniToken) {
      let progress = placeNodes[0] ?? 0;
      for (let index = 0; index < centres.length; index += 1) {
        const here = centres[index];
        const node = placeNodes[index];
        if (here === undefined || node === undefined) continue;
        if (middle >= here) progress = node;
        const before = centres[index - 1];
        const beforeNode = placeNodes[index - 1];
        if (before !== undefined && beforeNode !== undefined && middle > before && middle < here) {
          progress = beforeNode + ((node - beforeNode) * (middle - before)) / (here - before);
        }
      }
      const at = roadPoint(mapSegments, progress);
      miniToken.style.left = `${(at[0] / 16).toFixed(2)}%`;
      miniToken.style.top = `${(at[1] / 9).toFixed(2)}%`;
    }
  }

  function reachStops(line: number): void {
    stops.forEach((stop, index) => {
      const at = stopLines[index];
      if (at !== undefined) stop.classList.toggle('is-reached', line > at - 60);
    });
  }

  function frame(time: number, scroll: number, velocity: number, openingEnd: number): void {
    chrome(scroll, openingEnd);

    // Traveller: always at the same height on screen, on the road at that page height.
    const lineOnScreen = innerHeight * 0.56;
    const line = scroll + lineOnScreen;
    const x = roadX(line);
    trailClip?.setAttribute('height', String(Math.max(0, line)));
    reachStops(line);
    if (walker) {
      walker.classList.toggle('is-on', x !== null);
      if (x !== null) {
        lean += (clamp((x - lastWalkerX) * 1.6, -9, 9) - lean) * 0.2;
        lastWalkerX = x;
        // The bob is tied to distance walked, so the figure steps only while the page moves.
        const bob = Math.abs(Math.sin(line / 26)) * 5;
        walker.style.transform = `translate(${(x - walker.offsetWidth / 2).toFixed(1)}px, ${(lineOnScreen - walker.offsetHeight - bob).toFixed(1)}px) rotate(${lean.toFixed(2)}deg)`;
      }
    }

    // Compass needle: towards the cursor, or the way the page is moving on touch screens.
    if (needle && compass) {
      let target = needleAngle;
      if (pointer && finePointer.matches) {
        const rect = compass.getBoundingClientRect();
        target =
          (Math.atan2(
            pointer[1] - (rect.top + rect.height / 2),
            pointer[0] - (rect.left + rect.width / 2),
          ) *
            180) /
            Math.PI +
          90;
      } else if (Math.abs(velocity) > 0.05) {
        target = velocity > 0 ? 180 : 0;
      }
      // Turn the short way round rather than spinning back through a full circle.
      const turn = ((((target - needleAngle) % 360) + 540) % 360) - 180;
      if (Math.abs(turn) > 0.5) {
        needleAngle += turn;
        needle.style.setProperty('--needle', `${needleAngle.toFixed(1)}deg`);
      }
    }

    // Dragon: a slow figure of eight near the top of the screen. It keeps clear of the cursor
    // and dives when the page is scrolled fast.
    if (dragon && dragonBody) {
      const on = scroll > openingEnd * 0.34;
      dragon.classList.toggle('is-on', on);
      if (on) {
        const swooping = time - swoopStart < 1.7;
        if (!swooping && Math.abs(velocity) > 2.4 && time - swoopStart > 3.2) swoopStart = time;
        const dive = swooping ? Math.sin(((time - swoopStart) / 1.7) * Math.PI) : 0;
        const size = dragon.offsetWidth;
        let x0 = innerWidth * (0.5 + 0.38 * Math.sin(time * 0.23));
        let y0 = 70 + size * 0.5 + innerHeight * 0.07 * (1 + Math.sin(time * 0.46));
        y0 += dive * innerHeight * 0.44;
        x0 += dive * innerWidth * 0.12 * facing;

        const away: Point = [0, 0];
        if (pointer && finePointer.matches) {
          const dx = x0 - pointer[0];
          const dy = y0 - pointer[1];
          const distance = Math.hypot(dx, dy) || 1;
          const reach = 240;
          if (distance < reach) {
            away[0] = (dx / distance) * (reach - distance) * 0.8;
            away[1] = (dy / distance) * (reach - distance) * 0.8;
          }
        }
        shy = [shy[0] + (away[0] - shy[0]) * 0.06, shy[1] + (away[1] - shy[1]) * 0.06];
        const target: Point = [
          clamp(x0 + shy[0], size * 0.5, innerWidth - size * 0.5),
          Math.max(64 + size * 0.4, y0 + shy[1]),
        ];
        const moved: Point = [target[0] - dragonAt[0], target[1] - dragonAt[1]];
        dragonAt = target;
        // The painted dragon faces left; turn it round when it flies right.
        if (Math.abs(moved[0]) > 0.15) facing = moved[0] > 0 ? 1 : -1;
        const tilt = clamp(moved[1] * 3 * -facing, -24, 24);
        dragon.style.transform = `translate(${(dragonAt[0] - size / 2).toFixed(1)}px, ${(dragonAt[1] - size / 2).toFixed(1)}px)`;
        dragonBody.style.transform = `scaleX(${-facing}) rotate(${tilt.toFixed(1)}deg)`;
        // Checking every few frames is enough; the fade itself is a CSS transition.
        frameCount += 1;
        if (frameCount % 6 === 0) {
          dragon.classList.toggle('is-faint', overContent(dragonAt[0], dragonAt[1], size));
        }
        dragon.classList.toggle('is-down', Math.floor(time / (swooping ? 0.13 : 0.26)) % 2 === 1);
      }
    }
  }

  function still(scroll: number, openingEnd: number): void {
    chrome(scroll, openingEnd);
    trailClip?.setAttribute('height', String(document.documentElement.scrollHeight));
    reachStops(Number.POSITIVE_INFINITY);
  }

  return { build, frame, still };
}
