// The desk's loose ends: the balloon on its wire and the paper scraps. Both react to the
// pointer and to fast scrolling; with motion off the scraps are drawn once and left alone.
import { motionAllowed, onMotionChange, select } from '../../../scripts/motion';

interface Scrap {
  /** Resting place, as a share of the viewport. */
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
  turn: number;
  /** Flutter phase: the scrap is drawn squashed by its cosine, like paper tumbling. */
  flip: number;
  size: number;
  colour: string;
  shape: 0 | 1 | 2;
}

const COLOURS = ['#e04b3a', '#4a9fd8', '#f4c13d', '#5aa469', '#faf5ea', '#faf5ea'];

export function initLife(velocity: () => number): void {
  const canvas = select('[data-pb-scraps]', HTMLCanvasElement);
  const balloon = select('[data-pb-balloon]', HTMLElement);
  const context = canvas?.getContext('2d') ?? null;
  if (!canvas || !context) return;

  let width = 0;
  let height = 0;
  let pointerX = -999;
  let pointerY = -999;
  let lastScroll = scrollY;
  let frameId = 0;
  let sway = 0;
  let swaySpeed = 0;

  // A fixed pseudo-random sequence, so the scraps lie in the same places on every visit.
  let seed = 7;
  const random = (): number => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const scraps: Scrap[] = Array.from({ length: 44 }, (_, index) => {
    // Most scraps lie toward the edges of the desk, where the book is not.
    const side = random() < 0.5 ? random() * 0.16 : 1 - random() * 0.16;
    const homeX = index % 4 === 0 ? random() : side;
    const homeY = random();
    return {
      homeX,
      homeY,
      x: homeX,
      y: homeY,
      vx: 0,
      vy: 0,
      spin: random() * 6.3,
      turn: 0,
      flip: random() * 6.3,
      size: 7 + random() * 9,
      colour: COLOURS[index % COLOURS.length] ?? '#faf5ea',
      shape: (index % 3) as 0 | 1 | 2,
    };
  });

  const resize = (): void => {
    const ratio = Math.min(2, devicePixelRatio || 1);
    width = innerWidth;
    height = innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const draw = (): void => {
    context.clearRect(0, 0, width, height);
    for (const scrap of scraps) {
      const x = scrap.x * width;
      const y = scrap.y * height;
      const squash = 0.35 + 0.65 * Math.abs(Math.cos(scrap.flip));
      context.save();
      context.translate(x, y);
      context.rotate(scrap.spin);
      context.scale(1, squash);
      // A soft shadow under each scrap, offset further the higher it has lifted.
      const lifted = Math.min(1, Math.hypot(scrap.vx, scrap.vy) * 60);
      context.fillStyle = 'rgba(15, 25, 35, 0.22)';
      shape(scrap, 2 + lifted * 6, 3 + lifted * 8);
      context.fillStyle = scrap.colour;
      shape(scrap, 0, 0);
      context.restore();
    }
  };
  const shape = (scrap: Scrap, dx: number, dy: number): void => {
    const s = scrap.size;
    context.beginPath();
    if (scrap.shape === 0) {
      context.rect(dx - s / 2, dy - s / 3, s, s / 1.5);
    } else if (scrap.shape === 1) {
      context.moveTo(dx - s / 2, dy + s / 2);
      context.lineTo(dx + s / 2, dy + s / 2);
      context.lineTo(dx, dy - s / 2);
    } else {
      context.arc(dx, dy, s / 2.4, 0, Math.PI * 2);
    }
    context.fill();
  };

  const frame = (time: number): void => {
    frameId = requestAnimationFrame(frame);
    const y = scrollY;
    const delta = y - lastScroll;
    lastScroll = y;
    const gust = Math.abs(delta) > 22 ? Math.min(1, Math.abs(delta) / 120) : 0;

    for (const scrap of scraps) {
      if (gust > 0 && Math.sin(scrap.flip * 3 + time * 0.01) > -0.2) {
        // Scrolling fast lifts the scraps against the direction of travel and scatters them.
        scrap.vy -= (Math.sign(delta) * gust * (0.004 + scrap.size * 0.0004)) / 2;
        scrap.vx += (Math.sin(scrap.spin * 5) * gust * 0.004) / 2;
        scrap.turn += (Math.cos(scrap.spin * 3) * gust) / 5;
      }
      // The pointer blows nearby scraps aside.
      const dx = scrap.x * width - pointerX;
      const dy = scrap.y * height - pointerY;
      const distance = Math.hypot(dx, dy);
      if (distance < 90 && distance > 0.5) {
        const push = (1 - distance / 90) * 0.0016;
        scrap.vx += (dx / distance) * push;
        scrap.vy += (dy / distance) * push;
        scrap.turn += push * 20;
      }
      // A weak pull home lets them settle back roughly where they were.
      scrap.vx += (scrap.homeX - scrap.x) * 0.0016;
      scrap.vy += (scrap.homeY - scrap.y) * 0.0016;
      scrap.vx *= 0.94;
      scrap.vy *= 0.94;
      scrap.turn *= 0.95;
      scrap.x += scrap.vx;
      scrap.y += scrap.vy;
      scrap.spin += scrap.turn * 0.2;
      scrap.flip += Math.hypot(scrap.vx, scrap.vy) * 40;
    }
    draw();

    if (balloon) {
      // The balloon bobs, swings on its wire with the scroll, and leans away from the pointer.
      const rect = balloon.getBoundingClientRect();
      const away = pointerX > -900 ? (rect.left + rect.width / 2 - pointerX) / width : 0;
      const near = Math.max(0, 1 - Math.abs(away) * 5);
      const target = -velocity() * 0.12 + Math.sign(away) * near * 7;
      swaySpeed += (target - sway) * 0.02;
      swaySpeed *= 0.94;
      sway += swaySpeed;
      const bob = Math.sin(time * 0.0011) * 9;
      balloon.style.setProperty('--by', `${bob.toFixed(1)}px`);
      balloon.style.setProperty('--br', `${(sway + Math.sin(time * 0.0007) * 1.6).toFixed(2)}deg`);
    }
  };

  const start = (): void => {
    cancelAnimationFrame(frameId);
    resize();
    if (motionAllowed()) {
      lastScroll = scrollY;
      frameId = requestAnimationFrame(frame);
    } else {
      balloon?.style.removeProperty('--by');
      balloon?.style.removeProperty('--br');
      draw();
    }
  };

  addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType === 'touch') return;
      pointerX = event.clientX;
      pointerY = event.clientY;
    },
    { passive: true },
  );
  addEventListener('resize', start);
  onMotionChange(start);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(frameId);
    else start();
  });
  start();
}
