// Entry point for the Quest page: one animation loop drives the opening and the world, and the
// motion preference decides whether that loop runs at all.
import { motionAllowed, onMotionChange, select } from '../../../scripts/motion';
import { createOpening } from './opening';
import { startUi } from './ui';
import { createWorld } from './world';

const root = document.documentElement;
const opening = createOpening();
const world = createWorld();

let running = false;
let lastY = scrollY;
let lastTime = 0;
let velocity = 0;
let autoScroll = 0;

const openingEnd = (): number => opening?.end() ?? 0;

function loop(now: number): void {
  if (!running) return;
  const elapsed = Math.max(1, now - lastTime);
  lastTime = now;
  // Smoothed scroll speed in pixels per millisecond; the dragon and the compass read it.
  velocity += ((scrollY - lastY) / elapsed - velocity) * 0.25;
  lastY = scrollY;
  opening?.update(scrollY);
  world.frame(now / 1000, scrollY, velocity, openingEnd());
  requestAnimationFrame(loop);
}

function stillUpdate(): void {
  if (!running) world.still(scrollY, openingEnd());
}

/** Switches between the moving page and the still one (reduced motion or the pause button). */
function applyMotion(): void {
  const moving = motionAllowed();
  root.classList.toggle('qg-still', !moving);
  if (moving) opening?.update(scrollY, true);
  else opening?.reset();
  // The opening changes height between the two modes, so the road has to be measured again.
  world.build();
  if (moving && !running) {
    running = true;
    lastTime = performance.now();
    lastY = scrollY;
    requestAnimationFrame(loop);
  } else if (!moving) {
    running = false;
    cancelAnimationFrame(autoScroll);
    stillUpdate();
  }
}

// "Begin" plays the opening for you: a slow scroll through the pinned scene, which any input
// of your own interrupts. With motion off it stays a plain link to the first section.
const begin = select('[data-begin]', HTMLAnchorElement);
if (begin && opening) {
  const stop = (): void => cancelAnimationFrame(autoScroll);
  begin.addEventListener('click', (event) => {
    if (!motionAllowed()) return;
    event.preventDefault();
    const from = scrollY;
    const to = openingEnd() * 0.985;
    const duration = 6500;
    const started = performance.now();
    const step = (now: number): void => {
      const t = Math.min(1, (now - started) / duration);
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      scrollTo({ top: from + (to - from) * eased, behavior: 'instant' });
      if (t < 1) autoScroll = requestAnimationFrame(step);
    };
    stop();
    autoScroll = requestAnimationFrame(step);
  });
  for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const) {
    addEventListener(type, stop, { passive: true });
  }
}

// Rebuild the road whenever the page's layout changes: resizes, fonts and images arriving,
// journal entries and notices opening.
let rebuild = 0;
const scheduleBuild = (): void => {
  clearTimeout(rebuild);
  rebuild = window.setTimeout(() => {
    world.build();
    stillUpdate();
  }, 120);
};
addEventListener('resize', scheduleBuild);
addEventListener('load', scheduleBuild);
const main = select('#main', HTMLElement);
if (main && 'ResizeObserver' in window) new ResizeObserver(scheduleBuild).observe(main);
addEventListener('scroll', stillUpdate, { passive: true });

startUi();
onMotionChange(applyMotion);
applyMotion();
