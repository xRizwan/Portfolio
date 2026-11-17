// The climb's living layer, run from one animation frame loop:
//   altitude   scroll position through the climb, shown on the altimeter dial and header;
//   mist       thickest mid-page, cleared near the top, parted by the cursor;
//   snow       starts in the upper sections and thickens toward the summit;
//   lammergeier circles (in the right margin on wide screens, long glides on narrow ones) and
//              stoops when you scroll fast;
//   ibex       hops between the ledges at the section edge nearest the reader;
//   climber    steps on the rope as you scroll;
//   scroll-linked drawings (the camps route, the trailhead sketch, the rising peaks).
// With reduced motion only the altimeter reading and the finished drawings remain.
import { motionAllowed, onMotionChange, select, selectAll } from '../../../scripts/motion';

const LOW = 900;
const HIGH = 5800;
const clamp = (value: number, min = 0, max = 1): number => Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

interface Flake {
  x: number;
  y: number;
  r: number;
  vy: number;
  sway: number;
  phase: number;
}

interface Hop {
  fromX: number;
  fromY: number;
  start: number;
  duration: number;
  height: number;
}

export function initLife(): void {
  const body = document.body;
  const climb = select('[data-mt-climb]', HTMLElement);
  if (!climb) return;
  const head = select('[data-mt-head]', HTMLElement);
  const needle = select('[data-mt-needle]', SVGGElement);
  const altTexts = selectAll('[data-mt-alt-text]', HTMLElement);
  const fog = select('[data-mt-fog]', HTMLElement);
  const canvas = select('[data-mt-snow]', HTMLCanvasElement);
  const eagle = select('[data-mt-eagle]', HTMLElement);
  const goat = select('[data-mt-goat]', HTMLElement);
  const climber = select('[data-mt-climber]', HTMLElement);
  const summit = select('#contact', HTMLElement);
  const foot = select('.mt-foot', HTMLElement);
  const parallax = selectAll('[data-mt-parallax]', HTMLElement);
  const develop = selectAll('[data-mt-develop] img', HTMLImageElement);
  const drawSections = selectAll('[data-mt-draw]', HTMLElement);
  const clusters = selectAll('.mt-ledges', HTMLElement)
    .map((cluster) => selectAll('[data-mt-ledge]', HTMLElement, cluster))
    .filter((ledges) => ledges.length > 0);
  const context = canvas?.getContext('2d') ?? null;

  let running = false;
  let lastAltitude = -1;
  let lastScroll = scrollY;
  let velocity = 0;
  let stepDistance = 0;
  let time = 0;
  let lastFrame = performance.now();

  // Pointer, eased so the mist hole and the eagle's shyness glide rather than jump.
  const pointer = { x: -999, y: -999, active: false };
  const eased = { x: -999, y: -999 };
  addEventListener(
    'pointermove',
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      if (!pointer.active) {
        eased.x = pointer.x;
        eased.y = pointer.y;
      }
      pointer.active = true;
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => {
    pointer.active = false;
  });

  /* ---------- Altitude ---------- */
  const altitudeNow = (): number => {
    const rect = climb.getBoundingClientRect();
    return clamp((innerHeight * 0.5 - rect.top) / Math.max(1, rect.height - innerHeight * 0.5));
  };
  const updateAltitude = (): number => {
    const altitude = altitudeNow();
    const climbTop = climb.getBoundingClientRect().top;
    body.classList.toggle('mt-climbing', climbTop < innerHeight * 0.6);
    head?.classList.toggle('is-scrolled', scrollY > 30);
    body.classList.toggle(
      'mt-at-foot',
      (foot?.getBoundingClientRect().top ?? Infinity) < innerHeight,
    );
    if (Math.abs(altitude - lastAltitude) > 0.0005) {
      lastAltitude = altitude;
      const metres = Math.round(lerp(LOW, HIGH, altitude) / 10) * 10;
      const reading = metres.toLocaleString('en-US');
      for (const text of altTexts) text.textContent = reading;
      needle?.style.setProperty('transform', `rotate(${(altitude * 330).toFixed(1)}deg)`);
    }
    return altitude;
  };

  /* ---------- Scroll-linked drawings ---------- */
  const updateDrawings = (still: boolean): void => {
    for (const image of develop) {
      const rect = image.getBoundingClientRect();
      const value = still ? 1 : clamp((innerHeight * 0.95 - rect.top) / (innerHeight * 0.55));
      image.style.setProperty('--develop', value.toFixed(3));
    }
    for (const section of drawSections) {
      const trail = select('.mt-camps-trail', HTMLElement, section);
      const ink = select('.mt-camps-path-ink', SVGPathElement, section);
      if (!trail || !ink) continue;
      const rect = trail.getBoundingClientRect();
      const value = still ? 1 : clamp((innerHeight * 0.62 - rect.top) / rect.height);
      ink.style.setProperty('--draw', value.toFixed(4));
    }
    for (const element of parallax) {
      const anchor = element.parentElement ?? element;
      if (still) {
        element.style.transform = '';
        continue;
      }
      const rect = anchor.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > innerHeight + 200) continue;
      const speed = Number(element.dataset.mtParallax ?? 0);
      let shift = (rect.top + rect.height / 2 - innerHeight / 2) * speed;
      // Peaks "rise" from behind their horizon: they sink below it, never float above it.
      if (element.hasAttribute('data-mt-floor')) shift = clamp(shift, 0, rect.height * 0.7);
      element.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
    }
  };

  /* ---------- Mist ---------- */
  const updateFog = (altitude: number): void => {
    if (!fog) return;
    // A bell centred on the camps: thin in the valley, thick mid-climb, clear at the top.
    const amount = clamp(1 - ((altitude - 0.42) / 0.3) ** 2) * 0.8;
    fog.style.setProperty('--fog', amount.toFixed(3));
    eased.x = lerp(eased.x, pointer.active ? pointer.x : -999, pointer.active ? 0.12 : 1);
    eased.y = lerp(eased.y, pointer.active ? pointer.y : -999, pointer.active ? 0.12 : 1);
    fog.style.setProperty('--mx', `${eased.x.toFixed(0)}px`);
    fog.style.setProperty('--my', `${eased.y.toFixed(0)}px`);
  };

  /* ---------- Snow ---------- */
  const flakes: Flake[] = [];
  let canvasWidth = 0;
  let canvasHeight = 0;
  let snowCleared = true;
  const sizeCanvas = (): void => {
    if (!canvas || !context) return;
    const ratio = Math.min(2, devicePixelRatio || 1);
    canvasWidth = innerWidth;
    canvasHeight = innerHeight;
    canvas.width = Math.round(canvasWidth * ratio);
    canvas.height = Math.round(canvasHeight * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  const newFlake = (top: boolean): Flake => ({
    x: Math.random() * canvasWidth,
    y: top ? -10 : Math.random() * canvasHeight,
    r: 1 + Math.random() * 2.1,
    vy: 18 + Math.random() * 34,
    sway: 8 + Math.random() * 18,
    phase: Math.random() * Math.PI * 2,
  });
  const updateSnow = (altitude: number, dt: number, scrolled: number): void => {
    if (!canvas || !context) return;
    // Lighter once the summit band fills the screen, so the contact links stay easy to read.
    const summitTop = summit?.getBoundingClientRect().top ?? Infinity;
    const amount = clamp((altitude - 0.52) / 0.3) * (1 - 0.55 * clamp(1 - summitTop / innerHeight));
    const target = Math.round(amount * (innerWidth < 700 ? 70 : 150));
    if (target === 0 && flakes.length === 0) {
      if (!snowCleared) {
        context.clearRect(0, 0, canvasWidth, canvasHeight);
        snowCleared = true;
      }
      return;
    }
    snowCleared = false;
    while (flakes.length < target) flakes.push(newFlake(flakes.length > target / 2));
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.lineWidth = 0.8;
    context.strokeStyle = 'rgba(110, 132, 156, 0.55)';
    context.fillStyle = 'rgba(255, 255, 255, 0.95)';
    for (let index = flakes.length - 1; index >= 0; index -= 1) {
      const flake = flakes[index];
      if (!flake) continue;
      flake.y += flake.vy * dt * (0.6 + flake.r / 4) - scrolled * 0.25 * (flake.r / 3);
      flake.x += Math.sin(time * 0.8 + flake.phase) * flake.sway * dt;
      // The cursor is a warm hand: flakes drift away from it.
      if (pointer.active) {
        const dx = flake.x - eased.x;
        const dy = flake.y - eased.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 110 && distance > 0.1) {
          const push = (1 - distance / 110) * 90 * dt;
          flake.x += (dx / distance) * push;
          flake.y += (dy / distance) * push;
        }
      }
      if (
        flake.y > canvasHeight + 10 ||
        flake.y < -40 ||
        flake.x < -20 ||
        flake.x > canvasWidth + 20
      ) {
        if (flakes.length > target) {
          flakes.splice(index, 1);
          continue;
        }
        Object.assign(flake, newFlake(true));
      }
      context.beginPath();
      context.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    }
  };

  /* ---------- Lammergeier ---------- */
  const bird = { x: -200, y: 120, angle: 0, rotation: 0, scale: 1 };
  let birdShift = 0;
  let stoopStart = -10;
  let glideStart = 0;
  let glideDirection = 1;
  const updateEagle = (altitude: number, dt: number): void => {
    if (!eagle) return;
    const width = eagle.offsetWidth || 100;
    const margin = (innerWidth - Math.min(1120, innerWidth - 240)) / 2;
    const wide = innerWidth >= 1200 && margin >= 140;
    let x: number;
    let y: number;
    if (wide) {
      // Circling in the right margin, edging away when the cursor comes close.
      const cx = innerWidth - margin / 2;
      const cy = innerHeight * 0.3 + Math.sin(time * 0.13) * 40;
      const near = pointer.active && Math.hypot(eased.x - cx, eased.y - cy) < 220;
      birdShift = lerp(birdShift, near ? (eased.y < cy ? 90 : -90) : 0, 0.04);
      bird.angle += dt * 0.55;
      const radius = Math.min(60, margin / 2 - 20);
      x = cx + Math.cos(bird.angle) * radius;
      y = cy + birdShift + Math.sin(bird.angle) * radius * 0.8;
    } else {
      // Long glides across the top of the screen, one every twenty seconds or so.
      const period = 20;
      const phase = (time - glideStart) / period;
      if (phase >= 1) {
        glideStart = time;
        glideDirection *= -1;
      }
      const t = clamp(((time - glideStart) / period) * 1.6);
      const from = glideDirection > 0 ? -width : innerWidth + width;
      const to = glideDirection > 0 ? innerWidth + width : -width;
      x = lerp(from, to, t);
      y = innerHeight * 0.16 + Math.sin(t * Math.PI * 2) * 26;
    }
    // A stoop: a fast fold-winged dive and a swing back up.
    const stoop = clamp((time - stoopStart) / 1.3);
    if (stoop < 1) {
      const swing = Math.sin(stoop * Math.PI);
      y += swing * innerHeight * 0.3;
      x += swing * (wide ? -40 : 60);
    }
    const dx = x - bird.x;
    const dy = y - bird.y;
    if (Math.hypot(dx, dy) > 0.3) {
      // The sprite's head points up, so heading + 90 degrees, eased to avoid snapping.
      const heading = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      let delta = heading - bird.rotation;
      delta = ((delta + 540) % 360) - 180;
      bird.rotation += delta * 0.12;
    }
    bird.x = x;
    bird.y = y;
    bird.scale = stoop < 1 ? 1 - Math.sin(stoop * Math.PI) * 0.35 : 1;
    // The summit band sits above the bird's layer, so the bird leaves before it arrives.
    const summitTop = summit?.getBoundingClientRect().top ?? Infinity;
    const clear = clamp((summitTop - innerHeight * 0.4) / (innerHeight * 0.4));
    const visible = body.classList.contains('mt-climbing') ? clear * clamp((1 - altitude) * 8) : 0;
    eagle.style.opacity = visible.toFixed(2);
    eagle.style.transform = `translate3d(${(x - width / 2).toFixed(1)}px, ${(y - width * 0.2).toFixed(1)}px, 0) rotate(${bird.rotation.toFixed(1)}deg) scale(${bird.scale.toFixed(3)}, 1)`;
  };

  /* ---------- Ibex ---------- */
  let cluster = -1;
  let ledgeIndex = 0;
  let hop: Hop | null = null;
  let nextHop = 3;
  const goatAt = { x: 0, y: 0 };
  const ledgeSpot = (ledge: HTMLElement): { x: number; y: number } => {
    const rect = ledge.getBoundingClientRect();
    const base = climb.getBoundingClientRect();
    const width = goat?.offsetWidth ?? 50;
    const height = goat?.offsetHeight ?? 58;
    return {
      x: rect.left - base.left + rect.width / 2 - width / 2,
      y: rect.top - base.top - height + rect.height * 0.45,
    };
  };
  const startHop = (ledges: HTMLElement[], target: number, height: number): void => {
    hop = { fromX: goatAt.x, fromY: goatAt.y, start: time, duration: 0.7, height };
    ledgeIndex = target;
    const ledge = ledges[target];
    // The sketch faces left; mirror it when the hop goes right.
    if (ledge) goat?.style.setProperty('--face', ledgeSpot(ledge).x < goatAt.x ? '1' : '-1');
  };
  const updateGoat = (): void => {
    if (!goat || clusters.length === 0) return;
    // The cluster whose ledges are nearest the upper middle of the screen.
    let best = 0;
    let bestDistance = Infinity;
    clusters.forEach((ledges, index) => {
      const first = ledges[0];
      if (!first) return;
      const distance = Math.abs(first.getBoundingClientRect().top - innerHeight * 0.45);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    const ledges = clusters[best] ?? [];
    if (best !== cluster) {
      cluster = best;
      // Arrive with a hop from just off the first ledge.
      const first = ledges[0];
      if (first) {
        const spot = ledgeSpot(first);
        goatAt.x = spot.x + 60;
        goatAt.y = spot.y - 40;
        startHop(ledges, 0, 30);
      }
    } else if (!hop && time > nextHop && ledges.length > 1) {
      const choices = ledges.map((_, index) => index).filter((index) => index !== ledgeIndex);
      const target = choices[Math.floor(Math.random() * choices.length)] ?? 0;
      startHop(ledges, target, 46);
    }
    const ledge = ledges[ledgeIndex] ?? ledges[0];
    if (!ledge) return;
    const spot = ledgeSpot(ledge);
    let x = spot.x;
    let y = spot.y;
    if (hop) {
      const t = clamp((time - hop.start) / hop.duration);
      const ease = t * t * (3 - 2 * t);
      x = lerp(hop.fromX, spot.x, ease);
      y = lerp(hop.fromY, spot.y, ease) - Math.sin(t * Math.PI) * hop.height;
      if (t >= 1) {
        hop = null;
        nextHop = time + 2.6 + Math.random() * 3.4;
      }
    }
    goatAt.x = x;
    goatAt.y = y;
    goat.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  };

  /* ---------- Climber ---------- */
  const updateClimber = (scrolled: number): void => {
    if (!climber) return;
    stepDistance += Math.abs(scrolled);
    const step = Math.sin(stepDistance / 26);
    const sway = Math.sin(time * 1.3) * 1.5;
    climber.style.transform = `translateY(${(step * 3).toFixed(1)}px) rotate(${(step * 5 + sway).toFixed(1)}deg)`;
  };

  /* ---------- Loop ---------- */
  const frame = (now: number): void => {
    if (!running) return;
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    time += dt;
    const scrolled = scrollY - lastScroll;
    lastScroll = scrollY;
    velocity = lerp(velocity, dt > 0 ? scrolled / (dt * 1000) : 0, 0.3);
    // A fast fling of the page (over about 2.4 px per ms) sets the bird diving.
    if (Math.abs(velocity) > 2.4 && time - stoopStart > 2.2) stoopStart = time;

    const altitude = updateAltitude();
    updateDrawings(false);
    updateFog(altitude);
    updateSnow(altitude, dt, scrolled);
    updateEagle(altitude, dt);
    updateGoat();
    updateClimber(scrolled);
    requestAnimationFrame(frame);
  };

  // Without motion: keep the altimeter honest and the drawings finished, nothing else.
  const still = (): void => {
    updateAltitude();
    if (!running) updateDrawings(true);
  };

  const apply = (): void => {
    const allowed = motionAllowed() && !document.hidden;
    body.classList.toggle('mt-alive', motionAllowed());
    if (allowed && !running) {
      running = true;
      lastFrame = performance.now();
      lastScroll = scrollY;
      sizeCanvas();
      requestAnimationFrame(frame);
    } else if (!allowed && running) {
      running = false;
    }
    if (!motionAllowed()) {
      if (climber) climber.style.transform = '';
      updateDrawings(true);
    }
    updateAltitude();
  };

  addEventListener('scroll', still, { passive: true });
  addEventListener('resize', () => {
    sizeCanvas();
    still();
  });
  document.addEventListener('visibilitychange', apply);
  onMotionChange(apply);
  apply();
}
