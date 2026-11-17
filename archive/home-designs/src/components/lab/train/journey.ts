// The walk through the train. Scrolling down slides the row of carriages left, so the page
// travels sideways; everything else here hangs off that one position: the land going by, the
// tunnels between carriages, the station stops, the route map, the dawn, the cat and the moths.
import { select, selectAll } from '../../../scripts/motion';
import { clamp, pinned, smooth, type Tick } from './frame';
import { Flock, type Point } from './moths';
import { Outside } from './outside';

const LINE_SPEED = 190;
/** How far the station outside shifts for each pixel walked along the carriage. */
const HALT_DEPTH = 0.7;

interface Car {
  id: string;
  left: number;
  width: number;
  lamps: boolean;
}

export function initJourney(openNear: (viewWidth: number) => void): ((tick: Tick) => void) | null {
  const section = select('[data-tr-train]', HTMLElement);
  const stage = select('[data-tr-stage]', HTMLElement);
  const track = select('[data-tr-track]', HTMLElement);
  const out = stage ? select('[data-tr-out]', HTMLElement, stage) : null;
  if (!section || !stage || !track || !out || !pinned()) return null;

  const halts = select('[data-tr-halts]', HTMLElement, stage);
  const haltElements = selectAll('[data-tr-halt]', HTMLElement, stage);
  const route = select('[data-tr-route]', HTMLElement, stage);
  const routeStops = selectAll('[data-tr-route-stop]', HTMLElement, stage);
  const sweep = select('[data-tr-sweep]', HTMLElement, stage);
  const cat = select('[data-tr-cat]', HTMLElement, stage);
  const carElements = selectAll('[data-tr-car]', HTMLElement, track);
  const gangways = selectAll('[data-tr-gangway]', HTMLElement, track);
  const views = selectAll('[data-tr-view]', HTMLElement, track);
  const navLinks = selectAll('[data-tr-nav]', HTMLAnchorElement);
  const mothBox = select('[data-tr-train-moths]', HTMLElement, track);
  const flock = mothBox ? new Flock(mothBox, 4) : null;
  const outside = new Outside(out, { poleTop: 0.36, poleFoot: 1 });

  let width = 0;
  let height = 0;
  let travel = 0;
  /** Sideways pixels per pixel scrolled: a little faster than 1:1 so the train is not endless. */
  let gear = 1.3;
  let tile = 560;
  let lampY = 96;
  let cars: Car[] = [];
  let doors: number[] = [];
  let stops: number[] = [];
  let position = 0;
  let drift = 0;
  let currentCar = '';
  let lastMoved = 0;
  let awake = false;
  let nextSweep = 4000;
  let lastSweep = 0;

  const layout = (): void => {
    width = stage.clientWidth;
    height = stage.clientHeight;
    gear = width > 700 ? 1.3 : 1.15;
    travel = Math.max(0, track.scrollWidth - width);
    // One screen of holding still (while the opening fades out over us), the travel, and the
    // screen the stage itself takes up.
    section.style.height = `${Math.ceil(height + travel / gear + height)}px`;

    const style = getComputedStyle(stage);
    tile = parseFloat(style.getPropertyValue('--tr-tile')) || 560;
    const windowTop = parseFloat(style.getPropertyValue('--tr-win-top')) || 118;
    lampY = windowTop - 24;
    outside.options.poleTop = (windowTop + 34) / Math.max(1, out.clientHeight);
    outside.resize();

    const origin = track.getBoundingClientRect().left;
    const along = (element: HTMLElement): number => {
      const rect = element.getBoundingClientRect();
      return rect.left - origin + rect.width / 2;
    };
    cars = carElements.map((car) => ({
      id: car.dataset.trCar ?? '',
      left: car.offsetLeft,
      width: car.offsetWidth,
      lamps: true,
    }));
    doors = gangways.map(along);
    stops = views.map((view) => clamp(along(view) - width / 2, 0, travel));
    haltElements.forEach((halt, index) => {
      const stop = stops[index] ?? 0;
      halt.style.left = `${(width / 2 + stop * HALT_DEPTH - halt.offsetWidth / 2).toFixed(1)}px`;
    });
  };

  const sectionTop = (): number => section.getBoundingClientRect().top + window.scrollY;
  const scrollToPosition = (target: number): void => {
    window.scrollTo({ top: sectionTop() + height + clamp(target, 0, travel) / gear + 1 });
  };

  /** Scrolls so that a carriage's heading is at the left of the screen. False if no such car. */
  const goToCar = (id: string): boolean => {
    const car = cars.find((entry) => entry.id === id);
    if (!car) return false;
    scrollToPosition(car.left);
    return true;
  };

  layout();
  addEventListener('resize', layout);
  addEventListener('load', layout);
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(track);

  // In-page links: the carriages are side by side, so the browser cannot scroll to them itself.
  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
    if (!(link instanceof HTMLAnchorElement)) return;
    const id = link.hash.slice(1);
    if (!goToCar(id)) return;
    event.preventDefault();
    history.replaceState(null, '', `#${id}`);
  });
  if (location.hash) {
    const id = location.hash.slice(1);
    // After the browser's own attempt at the hash, which would land mid-train.
    addEventListener('load', () => setTimeout(() => goToCar(id), 60));
  }
  // Keyboard: bring whatever takes focus into view by travelling to it.
  track.addEventListener('focusin', (event) => {
    if (!(event.target instanceof HTMLElement)) return;
    const rect = event.target.getBoundingClientRect();
    if (rect.left >= 24 && rect.right <= width - 24) return;
    scrollToPosition(rect.left + position - width * 0.3);
  });
  // Focus can also make the browser scroll the clipped stage itself; put it straight back.
  stage.addEventListener('scroll', () => {
    stage.scrollLeft = 0;
    stage.scrollTop = 0;
  });

  return (tick) => {
    const rect = section.getBoundingClientRect();
    if (rect.bottom < -40 || rect.top > height + 40) return;
    position = clamp((-rect.top - height) * gear, 0, travel);
    track.style.transform = `translate3d(${(-position).toFixed(1)}px,0,0)`;
    const centre = position + width / 2;

    // Tunnels. The dark comes in from the front of the train and leaves off the back.
    let tunnel = 110;
    for (const door of doors) {
      const d = (centre - door) / width;
      if (Math.abs(d) > 0.8) continue;
      if (d < -0.2) tunnel = (1 - smooth(-0.8, -0.2, d)) * 110;
      else if (d > 0.2) tunnel = -smooth(0.2, 0.8, d) * 110;
      else tunnel = 0;
    }
    const lit = 1 - Math.abs(tunnel) / 110;
    stage.style.setProperty('--tr-tunnel-x', `${tunnel.toFixed(2)}%`);
    stage.style.setProperty('--tr-lit', lit.toFixed(3));

    // Stations. The train slows to a stand as a stop comes up and pulls away after it.
    let nearest = Infinity;
    for (const stop of stops) nearest = Math.min(nearest, Math.abs(position - stop));
    const pace = smooth(0.06, 0.9, nearest / (width * 0.5));
    if (tick.live) drift += LINE_SPEED * pace * tick.dt * (1 + Math.abs(tick.velocity) / 1500);
    if (halts) halts.style.transform = `translate3d(${(-position * HALT_DEPTH).toFixed(1)}px,0,0)`;

    // Dawn comes up over the last carriage.
    const last = cars[cars.length - 1];
    const dawn = last ? smooth(last.left, last.left + last.width - width * 0.2, centre) : 0;
    stage.style.setProperty('--tr-dawn', dawn.toFixed(3));

    outside.render({
      distance: position * 0.9 + drift,
      dt: tick.live ? tick.dt : 0,
      pace: pace + Math.abs(tick.velocity) / 2500,
      wires: 1,
      rain: 1 - dawn,
    });

    // Which carriage we are in: the header shows it, and the route map belongs to one of them.
    const here = cars.find((car) => centre >= car.left && centre < car.left + car.width);
    const id = rect.top > 0 ? '' : (here?.id ?? currentCar);
    if (id !== currentCar) {
      currentCar = id;
      for (const link of navLinks) {
        if (link.hash === `#${id}`) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
    }
    if (route) {
      const line = cars.find((car) => car.id === 'experience');
      const on = Boolean(line) && here?.id === 'experience' && lit < 0.6;
      route.classList.toggle('is-on', on);
      if (line && stops.length > 0) {
        // The line fills from the carriage door to each stop in turn; the stops sit at even
        // spacing on the map however far apart they are on the wall.
        const marks = [line.left - width / 2, ...stops, line.left + line.width - width / 2];
        const shares = [0, ...stops.map((_, index) => (2 * index + 1) / (2 * stops.length)), 1];
        let filled = position >= (marks[marks.length - 1] ?? 0) ? 1 : 0;
        for (let index = 0; index < marks.length - 1; index++) {
          const from = marks[index] ?? 0;
          const to = marks[index + 1] ?? from;
          if (position >= from && position < to) {
            const start = shares[index] ?? 0;
            const end = shares[index + 1] ?? start;
            filled = start + ((position - from) / Math.max(1, to - from)) * (end - start);
          }
        }
        route.style.setProperty('--tr-route', filled.toFixed(4));
        routeStops.forEach((stop, index) =>
          stop.classList.toggle('is-reached', position >= (stops[index] ?? Infinity) - 30),
        );
      }
    }

    openNear(width);

    // The cat sleeps while the reader walks, and lifts its head when they stand still.
    if (Math.abs(tick.velocity) > 40) lastMoved = tick.now;
    const nowAwake = tick.now - lastMoved > 700;
    if (cat && nowAwake !== awake) {
      awake = nowAwake;
      cat.classList.toggle('is-awake', awake);
    }

    // A light outside sweeps down the carriage now and then, and whenever the reader hurries.
    if (sweep && tick.live && lit < 0.3) {
      const hurried = Math.abs(tick.velocity) > 2600 && tick.now - lastSweep > 2400;
      if (tick.now > nextSweep || hurried) {
        lastSweep = tick.now;
        nextSweep = tick.now + 5000 + Math.random() * 7000;
        sweep.classList.remove('is-go');
        // Reading a layout property lets the same animation start again.
        void sweep.offsetWidth;
        sweep.classList.add('is-go');
      }
    }

    // Moths keep to the lamps nearest the middle of the view.
    if (flock) {
      const homes: Point[] = [];
      if (here?.lamps) {
        const first = Math.round((centre - here.left) / tile);
        for (const step of [0, -1, 1]) {
          const x = here.left + (first + step) * tile;
          if (x > here.left + 40 && x < here.left + here.width - 40) homes.push({ x, y: lampY });
        }
      }
      if (homes.length > 0) flock.homes = homes;
      const pointer = tick.pointer ? { x: tick.pointer.x + position, y: tick.pointer.y } : null;
      flock.update(tick, rect.top <= 0 ? pointer : null);
    }
  };
}
