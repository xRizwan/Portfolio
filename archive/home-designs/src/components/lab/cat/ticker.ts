// One shared animation loop for the cat flat: scroll position, scroll speed and the "startle"
// signal that fast scrolling sends to every cat on the page.
import { motionAllowed, onMotionChange } from '../../../scripts/motion';

export const clamp = (value: number, min = 0, max = 1): number =>
  Math.min(max, Math.max(min, value));

export const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

/** 0 before `start`, 1 after `end`, eased in between. */
export function span(value: number, start: number, end: number): number {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}

/** Linear version of `span` for movement that should track the scrollbar exactly. */
export const ramp = (value: number, start: number, end: number): number =>
  clamp((value - start) / (end - start));

export interface Frame {
  /** Milliseconds since the previous frame (capped, so a background tab does not jump). */
  dt: number;
  now: number;
  scrollY: number;
  /** Smoothed scroll speed in pixels per millisecond (signed). */
  speed: number;
  viewW: number;
  viewH: number;
}

type Listener = (frame: Frame) => void;

const listeners = new Set<Listener>();
const startleListeners = new Set<() => void>();
let running = false;
let last = 0;
let lastScroll = 0;
let speed = 0;
let fastFrames = 0;
let lastStartle = 0;

// Fast scrolling means a sustained fling, not a jump: anchor links and programmatic scrolls move
// several screens in a single frame and should not scare anyone.
const STARTLE_SPEED = 2.6;
const STARTLE_COOLDOWN = 2600;

function tick(now: number): void {
  if (!running) return;
  const dt = Math.min(64, now - last || 16);
  last = now;
  const scrollY = window.scrollY;
  const delta = scrollY - lastScroll;
  lastScroll = scrollY;
  const jump = Math.abs(delta) > window.innerHeight * 1.2;
  const instant = jump ? 0 : delta / dt;
  speed = lerp(speed, instant, 0.25);

  if (!jump && Math.abs(instant) > STARTLE_SPEED) fastFrames += 1;
  else fastFrames = Math.max(0, fastFrames - 1);
  if (fastFrames >= 3 && now - lastStartle > STARTLE_COOLDOWN) {
    lastStartle = now;
    fastFrames = 0;
    startleListeners.forEach((listener) => listener());
  }

  const frame: Frame = {
    dt,
    now,
    scrollY,
    speed,
    viewW: document.documentElement.clientWidth,
    viewH: window.innerHeight,
  };
  listeners.forEach((listener) => listener(frame));
  requestAnimationFrame(tick);
}

function sync(): void {
  const allowed = motionAllowed();
  document.body.classList.toggle('cat-motion', allowed);
  if (allowed && !running) {
    running = true;
    last = performance.now();
    lastScroll = window.scrollY;
    requestAnimationFrame(tick);
  } else if (!allowed) {
    running = false;
  }
}

/** Runs `listener` every frame while motion is allowed. */
export function onFrame(listener: Listener): void {
  listeners.add(listener);
}

/** Runs `listener` when the reader flings the page. */
export function onStartle(listener: () => void): void {
  startleListeners.add(listener);
}

export function startTicker(): void {
  sync();
  onMotionChange(sync);
}
