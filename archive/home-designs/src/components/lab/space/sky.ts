// The star field behind the whole page: three depths that slide at different speeds as the page
// scrolls, lean away from the cursor, and stretch into streaks when the scroll is fast. A painted
// comet crosses now and then.
import { select } from '../../../scripts/motion';
import { onFrame, type FrameState } from './frame';

interface Star {
  x: number;
  y: number;
  depth: 0 | 1 | 2;
  size: number;
  phase: number;
  speed: number;
  colour: string;
}

interface Comet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  /** -1 mirrors the sprite so the comet flies toward the lower right instead. */
  flip: 1 | -1;
}

const COLOURS = ['#f6ecd7', '#f6ecd7', '#f6ecd7', '#f2b134', '#76c7b0', '#f6ecd7', '#e4572e'];
/** Share of the scroll distance each depth moves, back to front. */
const SLIDE = [0.035, 0.09, 0.2] as const;
/** How far the cursor shifts each depth, in pixels. */
const PUSH = [6, 14, 30] as const;
/** Streak length per pixel-per-second of scroll speed. */
const STREAK = [0.008, 0.02, 0.045] as const;

// Small deterministic generator, so the sky is the same on every visit.
function seeded(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

export function initSky(): void {
  const found = select('[data-sp-stars]', HTMLCanvasElement);
  const pen = found?.getContext('2d');
  if (!found || !pen) return;
  // Re-bound so the narrowed types hold inside the functions below.
  const canvas: HTMLCanvasElement = found;
  const context: CanvasRenderingContext2D = pen;

  const random = seeded(4207);
  let stars: Star[] = [];
  let width = 0;
  let height = 0;
  let ratio = 1;
  const comets: Comet[] = [];
  let nextComet = 3;
  const sprite = new Image();
  sprite.src = '/lab/space/comet.webp';

  function resize(): void {
    width = innerWidth;
    height = innerHeight;
    // Capped: the sky is soft shapes, and a full-density canvas costs memory for nothing.
    ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const count = Math.round(Math.min(340, (width * height) / 5200));
    stars = Array.from({ length: count }, (_, index): Star => {
      const depth = index % 6 === 0 ? 2 : index % 3 === 0 ? 1 : 0;
      return {
        x: random(),
        y: random(),
        depth,
        size: 0.7 + depth * 0.7 + random() * 1.1,
        phase: random() * Math.PI * 2,
        speed: 0.6 + random() * 1.8,
        colour: COLOURS[Math.floor(random() * COLOURS.length)] ?? '#f6ecd7',
      };
    });
  }

  function draw(state: FrameState, still: boolean): void {
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.lineCap = 'round';
    for (const star of stars) {
      const push = PUSH[star.depth];
      let x = star.x * width - state.pointerX * push;
      // The field is one screen tall and wraps, so it never runs out however long the page is.
      let y = (((star.y * height - state.scrollY * SLIDE[star.depth]) % height) + height) % height;
      y -= state.pointerY * push * 0.6;
      // Stars close to the cursor step aside a little, as if nudged.
      const dx = x - state.pointerPxX;
      const dy = y - state.pointerPxY;
      const distance = Math.hypot(dx, dy);
      if (distance < 150 && distance > 0.01) {
        const force = (1 - distance / 150) ** 2 * (10 + star.depth * 12);
        x += (dx / distance) * force;
        y += (dy / distance) * force;
      }
      const twinkle = still ? 0.85 : 0.6 + 0.4 * Math.sin(state.time * star.speed + star.phase);
      const streak = Math.max(-140, Math.min(140, state.velocity * STREAK[star.depth]));
      context.globalAlpha = twinkle;
      context.fillStyle = star.colour;
      if (Math.abs(streak) > 3) {
        context.strokeStyle = star.colour;
        context.lineWidth = star.size;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x, y + streak);
        context.stroke();
      } else if (star.size > 2.3) {
        // The biggest stars are little hand-cut four-point sparkles.
        const arm = star.size * 2.1;
        const waist = star.size * 0.5;
        context.beginPath();
        context.moveTo(x, y - arm);
        context.lineTo(x + waist, y - waist);
        context.lineTo(x + arm, y);
        context.lineTo(x + waist, y + waist);
        context.lineTo(x, y + arm);
        context.lineTo(x - waist, y + waist);
        context.lineTo(x - arm, y);
        context.lineTo(x - waist, y - waist);
        context.closePath();
        context.fill();
      } else {
        context.beginPath();
        context.arc(x, y, star.size * 0.62, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.globalAlpha = 1;
  }

  function spawnComet(): void {
    const flip: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    const speed = 420 + Math.random() * 260;
    comets.push({
      x: flip === 1 ? width * (0.35 + Math.random() * 0.7) : width * (Math.random() * 0.6 - 0.05),
      y: -80,
      vx: -flip * speed * 0.78,
      vy: speed * 0.62,
      age: 0,
      life: 2.6,
      size: 110 + Math.random() * 90,
      flip,
    });
  }

  function drawComets(state: FrameState): void {
    nextComet -= state.dt;
    // Fast scrolling shakes a few more loose.
    if (Math.abs(state.velocity) > 2600) nextComet -= state.dt * 3;
    if (nextComet <= 0 && comets.length < 2) {
      spawnComet();
      nextComet = 7 + Math.random() * 8;
    }
    for (let index = comets.length - 1; index >= 0; index--) {
      const comet = comets[index];
      if (!comet) continue;
      comet.age += state.dt;
      comet.x += comet.vx * state.dt;
      comet.y += comet.vy * state.dt;
      if (comet.age > comet.life || comet.y > height + 120) {
        comets.splice(index, 1);
        continue;
      }
      if (!sprite.complete || sprite.naturalWidth === 0) continue;
      const fade = Math.min(1, comet.age * 3) * Math.min(1, (comet.life - comet.age) * 2);
      const tall = (comet.size * sprite.naturalHeight) / sprite.naturalWidth;
      context.save();
      context.globalAlpha = fade * 0.9;
      context.translate(comet.x, comet.y);
      context.scale(comet.flip, 1);
      // The head sits in the lower-left corner of the sprite.
      context.drawImage(sprite, -comet.size * 0.13, -tall * 0.83, comet.size, tall);
      context.restore();
    }
  }

  const still: FrameState = {
    time: 0,
    dt: 0,
    scrollY: 0,
    velocity: 0,
    width: 0,
    height: 0,
    pointerX: 0,
    pointerY: 0,
    pointerPxX: -9999,
    pointerPxY: -9999,
  };

  resize();
  addEventListener('resize', () => {
    resize();
    draw(still, true);
  });
  onFrame(
    (state) => {
      draw(state, false);
      drawComets(state);
    },
    () => {
      comets.length = 0;
      draw(still, true);
    },
  );
  draw(still, true);
}
