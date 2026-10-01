/// <reference types="astro/client" />

/** Replaced at build time: true only for Vercel preview deployments. */
declare const __NOINDEX__: boolean;

interface YarnBallDetail {
  /** Ball centre in viewport coordinates. */
  x: number;
  y: number;
  /** True while the visitor is dragging the yarn or has just released it. */
  active: boolean;
}

interface WindowEventMap {
  /** Fired whenever the page's motion preference changes (pause button or OS setting). */
  'portfolio-motion-change': Event;
  /** Fired when the light/dark theme changes, so canvases can redraw with the new colours. */
  'portfolio-theme-change': CustomEvent<'light' | 'dark'>;
  'yarn-ball': CustomEvent<YarnBallDetail>;
}
