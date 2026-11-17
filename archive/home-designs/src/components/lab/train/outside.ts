// The moving night outside: landscape strips at several depths, telegraph wires and rain.
import { selectAll } from '../../../scripts/motion';

interface Strip {
  element: HTMLElement;
  depth: number;
  ratio: number;
  tile: number;
}

interface Streak {
  x: number;
  y: number;
  length: number;
  pace: number;
}

export interface WeatherOptions {
  /** Top and foot of the telegraph poles, as fractions of the canvas height. */
  poleTop: number;
  poleFoot: number;
}

export interface OutsideFrame {
  /** How far the train has travelled, in pixels at the depth of the nearest things. */
  distance: number;
  /** Seconds since the last frame; 0 draws a still frame. */
  dt: number;
  /** 0 standing still, 1 at line speed, more when the reader scrolls hard. */
  pace: number;
  /** 0 hides the wires (at the platform), 1 shows them. */
  wires: number;
  /** 0 dry, 1 raining. */
  rain: number;
}

const POLE_GAP = 640;
const POLE_DEPTH = 1.15;

export class Outside {
  private readonly strips: Strip[];
  private readonly canvas: HTMLCanvasElement | null;
  private readonly context: CanvasRenderingContext2D | null;
  private streaks: Streak[] = [];
  private width = 0;
  private height = 0;
  private scale = 1;

  constructor(
    private readonly root: HTMLElement,
    /** Left open so the owner can move the poles when the layout changes. */
    readonly options: WeatherOptions,
  ) {
    this.strips = selectAll('[data-tr-layer]', HTMLElement, root).map((element) => ({
      element,
      depth: Number(element.dataset.depth ?? '0.1'),
      ratio: Number(element.dataset.ratio ?? '4'),
      tile: 0,
    }));
    const canvas = root.querySelector('[data-tr-weather]');
    this.canvas = canvas instanceof HTMLCanvasElement ? canvas : null;
    this.context = this.canvas?.getContext('2d') ?? null;
    this.resize();
  }

  resize(): void {
    this.width = this.root.clientWidth;
    this.height = this.root.clientHeight;
    for (const strip of this.strips) {
      // One repeat of the strip is as wide as its height times the picture's proportions. The
      // element is made one repeat wider than the view, so sliding it never shows a gap.
      strip.tile = Math.max(1, strip.element.offsetHeight * strip.ratio);
      strip.element.style.width = `${Math.ceil(this.width + strip.tile)}px`;
    }
    if (this.canvas) {
      this.scale = Math.min(1.5, window.devicePixelRatio || 1);
      this.canvas.width = Math.round(this.width * this.scale);
      this.canvas.height = Math.round(this.height * this.scale);
    }
    const count = Math.min(150, Math.round((this.width * this.height) / 9000));
    this.streaks = Array.from({ length: count }, () => ({
      x: Math.random() * (this.width + 300),
      y: Math.random() * this.height,
      length: 14 + Math.random() * 26,
      pace: 0.6 + Math.random() * 0.7,
    }));
  }

  render(frame: OutsideFrame): void {
    for (const strip of this.strips) {
      const offset = (((frame.distance * strip.depth) % strip.tile) + strip.tile) % strip.tile;
      strip.element.style.transform = `translate3d(${(-offset).toFixed(1)}px,0,0)`;
    }
    this.draw(frame);
  }

  /** Wipes the canvas, for when motion is switched off. */
  clear(): void {
    this.context?.clearRect(0, 0, this.canvas?.width ?? 0, this.canvas?.height ?? 0);
  }

  private draw(frame: OutsideFrame): void {
    const context = this.context;
    if (!context) return;
    const { width, height } = this;
    context.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    context.clearRect(0, 0, width, height);

    if (frame.wires > 0.01) {
      const top = height * this.options.poleTop;
      const foot = height * this.options.poleFoot;
      const shift = (((frame.distance * POLE_DEPTH) % POLE_GAP) + POLE_GAP) % POLE_GAP;
      context.globalAlpha = frame.wires;
      context.strokeStyle = '#050a16';
      context.fillStyle = '#050a16';
      context.lineWidth = 1.4;
      // Three wires that sag between the poles, so they dip and rise as the poles go by.
      for (let wire = 0; wire < 3; wire++) {
        const y = top + 8 + wire * 13;
        context.beginPath();
        for (let x = -shift - POLE_GAP; x < width + POLE_GAP; x += POLE_GAP) {
          context.moveTo(x, y);
          context.quadraticCurveTo(x + POLE_GAP / 2, y + 44 + wire * 5, x + POLE_GAP, y);
        }
        context.stroke();
      }
      for (let x = -shift; x < width + POLE_GAP; x += POLE_GAP) {
        context.fillRect(x - 3, top - 8, 6, foot - top + 8);
        context.fillRect(x - 20, top + 5, 40, 4);
        context.fillRect(x - 15, top + 31, 30, 4);
      }
      context.globalAlpha = 1;
    }

    if (frame.rain > 0.01) {
      // Rain falls at a slant, and leans over further the faster the train (or the reader) goes.
      const lean = 0.22 + Math.min(1.6, frame.pace) * 0.75;
      const fall = 620 + Math.min(1.6, frame.pace) * 900;
      context.lineWidth = 1;
      context.strokeStyle = `rgb(214 228 242 / ${(0.34 * frame.rain).toFixed(3)})`;
      context.beginPath();
      for (const streak of this.streaks) {
        streak.y += fall * streak.pace * frame.dt;
        streak.x -= fall * streak.pace * lean * frame.dt;
        if (streak.y > height + 40 || streak.x < -40) {
          streak.y = -40 * Math.random() - 10;
          streak.x = Math.random() * (width + height * lean);
        }
        context.moveTo(streak.x, streak.y);
        context.lineTo(streak.x + streak.length * lean, streak.y - streak.length);
      }
      context.stroke();
    }
  }
}
