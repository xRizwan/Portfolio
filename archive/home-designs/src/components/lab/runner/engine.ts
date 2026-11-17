// Plays the level. Page scroll is turned into the hero's position along the level, and almost
// everything else (pose, camera, backdrops, which card is showing, what has been collected) is
// worked out from that one number each frame, so the whole thing runs backwards as readily as
// forwards. When the game is off (reduced motion, tiny screens) this module does nothing and the
// page is the plain column the stylesheet lays out.
import {
  finePointer,
  motionAllowed,
  onMotionChange,
  select,
  selectAll,
} from '../../../scripts/motion';
import type { LevelData, Theme } from './level';
import { poseAt } from './path';

interface Data extends LevelData {
  titleEnd: number;
}

/** Something that is switched on while the hero is inside a stretch of the level. */
interface Range {
  el: HTMLElement;
  from: number;
  to: number;
  on: boolean;
  treat: boolean;
}

interface Layer {
  el: HTMLElement;
  theme: string;
  depth: number;
  aspect: number;
  tile: number;
  opacity: number;
  near: boolean;
}

/** A run of the level that shares one backdrop; `soft` is how far its start cross-fades. */
interface Segment {
  theme: Theme;
  from: number;
  soft: number;
}

interface Fly {
  el: HTMLElement;
  x: number;
  y: number;
  seed: number;
}

// Hero strip, left to right: six run frames, then stand, crouch, rise, fall, land, sit.
const FRAME = { stand: 6, crouch: 7, rise: 8, fall: 9, land: 10, sit: 11 } as const;
const LAST_FRAME = 11;
/** Level units of ground covered per run frame. */
const STRIDE = 36;
/** Faster than this (units per second) counts as a sprint. */
const SPRINT = 2000;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
const smooth = (t: number): number => {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
};

function readLevel(): Data | null {
  const source = document.getElementById('rn-level');
  if (!source?.textContent) return null;
  try {
    return JSON.parse(source.textContent) as Data;
  } catch {
    return null;
  }
}

function boot(
  data: Data,
  track: HTMLElement,
  stage: HTMLElement,
  world: HTMLElement,
  heroEl: HTMLElement,
  cat: HTMLElement,
): void {
  const root = document.documentElement;
  const title = select('.rn-title', HTMLElement, stage);
  const plank = select('.rn-plank', HTMLElement, stage);
  const hud = select('.rn-hud', HTMLElement, stage);
  const hudStage = select('.rn-hud__stage', HTMLElement, stage);
  const hudTreats = select('.rn-hud__treats', HTMLElement, stage);
  const hudCount = select('.rn-hud__treats b', HTMLElement, stage);
  const navLinks = selectAll('.rn-header__nav a', HTMLAnchorElement);
  const dust = selectAll('.rn-dust', HTMLElement, stage);

  const ranges: Range[] = selectAll('[data-from]', HTMLElement, stage).map((el) => ({
    el,
    from: Number(el.dataset.from),
    to: el.dataset.to === undefined ? Infinity : Number(el.dataset.to),
    on: el.classList.contains('is-on'),
    treat: el.classList.contains('rn-treat'),
  }));

  const layers: Layer[] = selectAll('[data-layer]', HTMLElement, stage).map((el) => ({
    el,
    theme: el.dataset.theme ?? '',
    // The far painting barely moves; the middle band moves about a third as fast as the ground.
    depth: el.dataset.layer === 'far' ? 0.06 : 0.3,
    aspect: Number(el.dataset.aspect) || 3,
    tile: 1,
    opacity: el.dataset.theme === 'meadow' ? 1 : 0,
    near: el.dataset.theme === 'meadow',
  }));

  // Backdrop runs: consecutive stages with the same theme share one. A change of backdrop at a
  // doorway is hidden by the iris, so only the open-air changes cross-fade.
  const segments: Segment[] = [];
  for (const entry of data.stages) {
    const previous = segments[segments.length - 1];
    if (previous?.theme === entry.theme) continue;
    const atDoor = data.doors.some((door) => Math.abs(door - entry.from) < 1);
    segments.push({ theme: entry.theme, from: entry.from, soft: atDoor ? 0 : 170 });
  }

  const flies: Fly[] = selectAll('.rn-fly', HTMLElement, stage).map((el, index) => ({
    el,
    x: -60,
    y: 200 + index * 60,
    seed: index * 2.4 + 0.7,
  }));

  const span = data.length - data.start;
  let scale = 1;
  /** Hero's distance from the left edge of the stage, in level units. */
  let anchor = 300;
  /** Pixels of page scroll per level unit. */
  let perUnit = 1;
  let trackTop = 0;
  let stageW = 0;
  let stageH = 0;

  let playing = false;
  let raf = 0;
  let last = 0;
  let x = data.start;
  /** When set, the hero jumps straight to the scroll position instead of running there. */
  let snap = true;
  let dir = 1;
  let travelled = 0;
  let idle = 0;
  let fastUntil = 0;
  let lastDust = 0;
  let nextDust = 0;
  let pointerX = 0;
  let pointerY = 0;
  let pointerAt = -Infinity;

  // Last values written to the page, so unchanged ones are not written again.
  let shownFrame = -1;
  let shownStage = '';
  let shownTheme = '';
  let shownTitle = true;
  let shownIris = false;
  let shownFast = false;
  let shownTreats = -1;

  function measure(): void {
    stageW = stage.clientWidth;
    stageH = stage.clientHeight;
    // The level is drawn 820 units tall on a wide screen; a narrow one is fitted by width
    // instead, which leaves the sky above the level free for the cards.
    scale = Math.min(stageH / 820, stageW / 560);
    const narrow = stageW < 700;
    anchor = (stageW / scale) * 0.3;
    perUnit = narrow ? 0.85 : 1;
    track.style.height = `${Math.round(span * perUnit + stageH)}px`;
    stage.style.setProperty('--s', scale.toFixed(4));
    trackTop = track.getBoundingClientRect().top + scrollY;
    for (const layer of layers) {
      layer.tile = Math.max(1, layer.el.offsetHeight * layer.aspect);
      // One spare tile, so the layer can slide a full tile before it wraps.
      layer.el.style.width = `${Math.ceil(stageW + layer.tile)}px`;
    }
  }

  const scrollTopFor = (at: number): number =>
    trackTop + (clamp(at, data.start, data.length) - data.start) * perUnit;

  /** Moves to a place in the level: a short hop scrolls there, a long one cuts with a wipe. */
  function travel(at: number, instant = false): void {
    const top = scrollTopFor(at);
    if (instant) {
      snap = true;
      scrollTo({ top, behavior: 'instant' });
      return;
    }
    if (Math.abs(at - x) < 1200) {
      scrollTo({ top, behavior: 'smooth' });
      return;
    }
    stage.classList.add('is-warp');
    window.setTimeout(() => {
      snap = true;
      scrollTo({ top, behavior: 'instant' });
      window.setTimeout(() => stage.classList.remove('is-warp'), 90);
    }, 200);
  }

  function setBackdrops(): void {
    let index = 0;
    for (const [i, segment] of segments.entries()) if (x >= segment.from) index = i;
    const current = segments[index];
    const next = segments[index + 1];
    const before = segments[index - 1];
    if (!current) return;

    const weights = new Map<string, number>([[current.theme, 1]]);
    let theme: Theme = current.theme;
    if (next && next.soft > 0 && x > next.from - next.soft) {
      const p = smooth((x - (next.from - next.soft)) / (2 * next.soft));
      weights.set(next.theme, p);
    } else if (before && current.soft > 0 && x < current.from + current.soft) {
      // Just past a soft boundary: the earlier backdrop is still underneath.
      const p = smooth((x - (current.from - current.soft)) / (2 * current.soft));
      weights.set(before.theme, 1);
      weights.set(current.theme, p);
      if (p < 0.5) theme = before.theme;
    }

    if (theme !== shownTheme) {
      shownTheme = theme;
      stage.dataset.theme = theme;
    }

    for (const layer of layers) {
      if (!layer.near) {
        // Fetch a theme's paintings a little before the hero gets to it.
        const close = data.stages.some(
          (entry) => entry.theme === layer.theme && x > entry.from - 2600 && x < entry.to + 2600,
        );
        if (close) {
          layer.near = true;
          layer.el.classList.add('is-near');
        }
      }
      const opacity = weights.get(layer.theme) ?? 0;
      if (opacity !== layer.opacity) {
        layer.opacity = opacity;
        layer.el.style.opacity = opacity.toFixed(3);
      }
      if (opacity > 0) {
        const offset = (x * layer.depth * scale) % layer.tile;
        layer.el.style.transform = `translate3d(${(-offset).toFixed(1)}px,0,0)`;
      }
    }
  }

  function setRanges(): void {
    let treats = 0;
    for (const range of ranges) {
      const on = x >= range.from && x < range.to;
      if (on !== range.on) {
        range.on = on;
        range.el.classList.toggle('is-on', on);
      }
      if (range.treat && on) treats += 1;
    }
    if (treats !== shownTreats) {
      if (hudCount) hudCount.textContent = String(treats);
      if (hudTreats && treats > shownTreats && shownTreats >= 0) {
        hudTreats.classList.remove('is-bump');
        // Reading a layout value restarts the little bounce.
        void hudTreats.offsetWidth;
        hudTreats.classList.add('is-bump');
      }
      shownTreats = treats;
    }
  }

  function setHud(): void {
    let current = data.stages[0];
    for (const entry of data.stages) if (x >= entry.from) current = entry;
    if (current && current.id !== shownStage) {
      shownStage = current.id;
      if (hudStage) hudStage.textContent = current.name;
      for (const link of navLinks) {
        const here = link.hash === `#${current.id}`;
        if (here) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
    }
    hud?.style.setProperty('--p', ((x - data.start) / span).toFixed(4));
  }

  function puff(now: number, y: number): void {
    if (now - lastDust < 90) return;
    const el = dust[nextDust % Math.max(1, dust.length)];
    if (!el) return;
    lastDust = now;
    nextDust += 1;
    el.style.left = `${Math.round(x - dir * 52 - 27)}px`;
    el.style.bottom = `${Math.round(data.ground + y - 8)}px`;
    el.classList.remove('is-puff');
    void el.offsetWidth;
    el.classList.add('is-puff');
  }

  function setFlies(now: number, dt: number, fast: boolean): void {
    const t = now / 1000;
    const chasing = now - pointerAt < 4000;
    for (const [index, fly] of flies.entries()) {
      // Left alone they wander the open band between the cards and the ground; a moving cursor
      // draws them in; a sprint sends them up and out of the way.
      let tx = stageW * (0.2 + 0.3 * index) + Math.sin(t * 0.35 + fly.seed) * stageW * 0.09;
      let ty = stageH * 0.6 + Math.cos(t * 0.5 + fly.seed * 2) * stageH * 0.07;
      if (chasing) {
        tx = pointerX + Math.cos(t * 1.3 + fly.seed) * 52;
        ty = pointerY + Math.sin(t * 1.7 + fly.seed) * 38;
      }
      if (fast) ty = -90;
      const ease = Math.min(1, dt * (fast ? 4 : 1.5));
      fly.x += (tx - fly.x) * ease;
      fly.y += (ty - fly.y) * ease;
      const lean = Math.sin(t * 3 + fly.seed) * 12;
      fly.el.style.transform = `translate3d(${fly.x.toFixed(1)}px,${fly.y.toFixed(1)}px,0) rotate(${lean.toFixed(1)}deg)`;
    }
  }

  function render(now: number, dt: number, speed: number): void {
    const pose = poseAt(data.jumps, data.terrain, x);
    const fast = now < fastUntil;
    const atEnd = x >= data.length - 6;

    // Pose: jumps pick their frame from how far through the arc the hero is, read in the
    // direction of travel so a jump taken backwards still rises first and lands last.
    let frame: number = FRAME.stand;
    let tilt = 0;
    if (pose.air >= 0) {
      const t = dir > 0 ? pose.air : 1 - pose.air;
      frame = t < 0.1 ? FRAME.crouch : t < 0.5 ? FRAME.rise : t < 0.9 ? FRAME.fall : FRAME.land;
      tilt = clamp(Math.atan(pose.slope) * 14, -16, 16);
    } else if (atEnd) {
      frame = FRAME.sit;
    } else if (speed > 12) {
      frame = Math.floor(travelled / STRIDE) % 6;
      tilt = clamp(Math.atan(pose.slope) * 40, -24, 24) - (fast ? 5 : 0);
    } else if (idle > 2.6) {
      frame = FRAME.sit;
    }
    if (frame !== shownFrame) {
      shownFrame = frame;
      cat.style.backgroundPositionX = `${((frame * 100) / LAST_FRAME).toFixed(3)}%`;
    }
    heroEl.style.transform = `translate3d(${x.toFixed(1)}px,${(-pose.y).toFixed(1)}px,0)`;
    // The flip comes first, so the same tilt reads as nose-up whichever way the cat faces.
    cat.style.transform = `scaleX(${dir}) rotate(${(-tilt).toFixed(1)}deg)`;

    world.style.transform = `translate3d(${(-(x - anchor) * scale).toFixed(1)}px,0,0) scale(${scale.toFixed(4)})`;

    // The title card is part of the world: it slides away as the cat sets off.
    const onTitle = x < data.start + 40;
    if (onTitle !== shownTitle) {
      shownTitle = onTitle;
      stage.classList.toggle('is-title', onTitle);
    }
    if (title && x < data.titleEnd + 40) {
      // The billboard stays standing in the world until it has scrolled off; the lettering
      // lifts away over the first few steps so it is gone before the first card arrives.
      title.style.transform = `translate3d(${(-(x - data.start) * scale).toFixed(1)}px,0,0)`;
      title.style.setProperty('--t', clamp((x - data.start) / 240, 0, 1).toFixed(3));
    }

    if (plank) {
      const at = clamp(x, data.ride.from + 70, data.ride.to - 70);
      plank.style.transform = `translate3d(${at.toFixed(1)}px,0,0)`;
    }

    setBackdrops();
    setRanges();
    setHud();

    // Doorways: the screen irises shut on the cat going in and opens again on the far side.
    let iris = 0;
    for (const door of data.doors) iris = Math.max(iris, 1 - Math.abs(x - door) / 95);
    const closing = iris > 0;
    if (closing || shownTheme === 'cave') {
      stage.style.setProperty('--hx', `${(anchor * scale).toFixed(0)}px`);
      stage.style.setProperty(
        '--hy',
        `${(stageH - (data.ground + pose.y + 62) * scale).toFixed(0)}px`,
      );
    }
    if (closing) {
      const radius = Math.hypot(stageW, stageH) * Math.pow(1 - iris, 1.6);
      stage.style.setProperty('--r', `${radius.toFixed(0)}px`);
    }
    if (closing !== shownIris) {
      shownIris = closing;
      stage.classList.toggle('is-iris', closing);
    }

    if (fast !== shownFast) {
      shownFast = fast;
      stage.classList.toggle('is-fast', fast);
    }
    if (fast && pose.air < 0) puff(now, pose.y);
    setFlies(now, dt, fast);
  }

  function tick(now: number): void {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    const target = data.start + clamp((scrollY - trackTop) / perUnit, 0, span);
    const previous = x;
    let moved = 0;
    if (snap) {
      // A cut, not a run: no stride, no sprint.
      x = target;
      snap = false;
    } else {
      // The cat runs after the scroll position, which smooths out wheel steps.
      x += (target - x) * (1 - Math.exp(-dt * 9));
      if (Math.abs(target - x) < 0.25) x = target;
      moved = x - previous;
    }
    const speed = Math.abs(moved) / dt;
    if (Math.abs(moved) > 0.01) dir = moved > 0 ? 1 : -1;
    travelled += Math.abs(moved);
    idle = speed > 12 ? 0 : idle + dt;
    if (speed > SPRINT) fastUntil = now + 320;
    render(now, dt, speed);
    raf = requestAnimationFrame(tick);
  }

  /** The game runs only with motion allowed and a screen big enough to hold the stage. */
  const wanted = (): boolean => motionAllowed() && innerWidth >= 320 && innerHeight >= 480;

  function sync(): void {
    const play = wanted();
    if (play === playing) {
      if (play) measure();
      return;
    }
    playing = play;
    root.classList.toggle('rn-play', play);
    if (play) {
      measure();
      snap = true;
      last = 0;
      raf = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(raf);
      track.style.height = '';
      world.style.transform = '';
      if (title) title.style.transform = '';
    }
  }

  // In-page links: while playing, sections are places in the level rather than places on the
  // page, so the links travel there instead of jumping.
  document.addEventListener('click', (event) => {
    if (!playing || !(event.target instanceof Element)) return;
    const block = event.target.closest('.rn-block');
    if (block instanceof HTMLElement) {
      travel(Number(block.dataset.jump));
      return;
    }
    const link = event.target.closest('a[href^="#"]');
    if (!(link instanceof HTMLAnchorElement)) return;
    const id = link.hash.slice(1);
    const section = id === 'top' ? null : document.getElementById(id);
    const at = id === 'top' ? data.start : Number(section?.dataset.jump);
    if (Number.isNaN(at)) return;
    event.preventDefault();
    travel(at);
    history.replaceState(null, '', `#${id}`);
  });

  // Keyboard: tabbing to a card or block that is elsewhere in the level brings the level to it.
  stage.addEventListener('focusin', (event) => {
    if (!playing || !(event.target instanceof Element)) return;
    const holder = event.target.closest('.rn-card, .rn-block');
    if (!(holder instanceof HTMLElement)) return;
    const from = Number(holder.dataset.from);
    if (Number.isNaN(from)) return;
    if (holder.classList.contains('rn-block')) {
      if (Math.abs(from - x) > 380) travel(from - 110, true);
    } else if (!holder.classList.contains('is-on')) {
      travel(from + 14, true);
    }
  });

  // Focusing something off to the side must not scroll the stage itself.
  stage.addEventListener('scroll', () => {
    stage.scrollLeft = 0;
    stage.scrollTop = 0;
  });

  if (finePointer.matches) {
    stage.addEventListener('pointermove', (event) => {
      const box = stage.getBoundingClientRect();
      pointerX = event.clientX - box.left;
      pointerY = event.clientY - box.top;
      pointerAt = performance.now();
    });
  }

  let resizing = 0;
  addEventListener('resize', () => {
    cancelAnimationFrame(resizing);
    resizing = requestAnimationFrame(sync);
  });
  onMotionChange(sync);

  sync();

  // Arriving with a section in the address: start there.
  if (playing && location.hash.length > 1) {
    const section = document.getElementById(location.hash.slice(1));
    const at = Number(section?.dataset.jump);
    if (!Number.isNaN(at)) travel(at, true);
  }
}

const data = readLevel();
const track = select('.rn-track', HTMLElement);
const stage = select('.rn-stage', HTMLElement);
const world = select('.rn-world', HTMLElement);
const heroEl = select('.rn-hero', HTMLElement);
const cat = select('.rn-hero__cat', HTMLElement);
if (data && track && stage && world && heroEl && cat) boot(data, track, stage, world, heroEl, cat);
