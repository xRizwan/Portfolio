// Shared by the scripts of the night-train page: one animation frame's facts, and small maths.

export interface Tick {
  /** Milliseconds, from requestAnimationFrame. */
  now: number;
  /** Seconds since the previous frame (capped, so a background tab does not jump). */
  dt: number;
  scrollY: number;
  /** Smoothed scroll speed in pixels per second; negative when scrolling up. */
  velocity: number;
  /** False while motion is paused: scroll positions still apply, nothing drifts on its own. */
  live: boolean;
  /** Last pointer position in the viewport, or null when there is no mouse about. */
  pointer: { x: number; y: number } | null;
}

export const clamp = (value: number, low = 0, high = 1): number =>
  Math.min(high, Math.max(low, value));

/** 0 below `from`, 1 above `to`, eased in between. */
export function smooth(from: number, to: number, value: number): number {
  const t = clamp((value - from) / (to - from));
  return t * t * (3 - 2 * t);
}

/** True when the page is laid out as pinned scenes (scripts on, motion welcome). */
export const pinned = (): boolean => document.documentElement.classList.contains('tr-pin');
