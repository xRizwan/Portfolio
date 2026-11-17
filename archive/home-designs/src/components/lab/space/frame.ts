// One animation loop for the whole page. Every moving piece subscribes here, so there is a single
// requestAnimationFrame, a single scroll read per frame, and one place that stops everything
// when motion is paused or the tab is hidden.
import { motionAllowed, onMotionChange } from '../../../scripts/motion';

export interface FrameState {
  /** Seconds since the loop first started. */
  time: number;
  /** Seconds since the previous frame, capped so a background tab does not cause a jump. */
  dt: number;
  scrollY: number;
  /** Smoothed scroll speed in pixels per second; positive when scrolling down. */
  velocity: number;
  width: number;
  height: number;
  /** Eased pointer position from -1 to 1 on each axis; 0 when there is no pointer. */
  pointerX: number;
  pointerY: number;
  /** Raw pointer position in pixels, or -9999 when the pointer is away. */
  pointerPxX: number;
  pointerPxY: number;
}

type FrameCallback = (state: FrameState) => void;

interface Subscriber {
  frame: FrameCallback;
  /** Called when motion stops, to put the piece into its still state. */
  rest?: () => void;
}

const subscribers: Subscriber[] = [];
const state: FrameState = {
  time: 0,
  dt: 0,
  scrollY: 0,
  velocity: 0,
  width: innerWidth,
  height: innerHeight,
  pointerX: 0,
  pointerY: 0,
  pointerPxX: -9999,
  pointerPxY: -9999,
};

let running = false;
let last = 0;
let targetX = 0;
let targetY = 0;

function tick(now: number): void {
  if (!running) return;
  const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
  last = now;
  const y = scrollY;
  const raw = (y - state.scrollY) / dt;
  state.velocity += (raw - state.velocity) * Math.min(1, dt * 9);
  if (Math.abs(state.velocity) < 0.5) state.velocity = 0;
  state.scrollY = y;
  state.time += dt;
  state.dt = dt;
  state.pointerX += (targetX - state.pointerX) * Math.min(1, dt * 4);
  state.pointerY += (targetY - state.pointerY) * Math.min(1, dt * 4);
  for (const subscriber of subscribers) subscriber.frame(state);
  requestAnimationFrame(tick);
}

function sync(): void {
  const on = motionAllowed() && !document.hidden;
  document.documentElement.classList.toggle('sp-motion', motionAllowed());
  if (on && !running) {
    running = true;
    last = performance.now();
    state.scrollY = scrollY;
    state.velocity = 0;
    requestAnimationFrame(tick);
  } else if (!on && running) {
    running = false;
    if (!motionAllowed()) for (const subscriber of subscribers) subscriber.rest?.();
  }
}

export function onFrame(frame: FrameCallback, rest?: () => void): void {
  subscribers.push({ frame, rest });
}

export function frameState(): FrameState {
  return state;
}

export function startFrames(): void {
  addEventListener(
    'resize',
    () => {
      state.width = innerWidth;
      state.height = innerHeight;
    },
    { passive: true },
  );
  addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType === 'touch') return;
      state.pointerPxX = event.clientX;
      state.pointerPxY = event.clientY;
      targetX = (event.clientX / state.width) * 2 - 1;
      targetY = (event.clientY / state.height) * 2 - 1;
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => {
    state.pointerPxX = -9999;
    state.pointerPxY = -9999;
    targetX = 0;
    targetY = 0;
  });
  document.addEventListener('visibilitychange', sync);
  onMotionChange(sync);
  sync();
  if (!motionAllowed()) for (const subscriber of subscribers) subscriber.rest?.();
}

export const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
/** Progress of `value` through the range `from`..`to`, clamped to 0..1. */
export const span = (value: number, from: number, to: number): number =>
  clamp01((value - from) / (to - from));
export const mix = (from: number, to: number, amount: number): number =>
  from + (to - from) * amount;
export const easeIn = (t: number): number => t * t;
export const easeOut = (t: number): number => 1 - (1 - t) * (1 - t);
export const easeInOut = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
