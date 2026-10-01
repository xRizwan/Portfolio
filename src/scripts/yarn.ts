import { motionAllowed, onMotionChange, select } from './motion';

// A ball of yarn hangs on a string from a pin at the centre of the navbar line. Visitors can
// drag and fling it (verlet rope physics); the ginger cat on RIZZY chases it via the
// "yarn-ball" event. Desktop and tablet only (hidden below 901px); purely decorative.
const hero = select('.current-hero', HTMLElement);
const context = hero ? document.createElement('canvas').getContext('2d') : null;

if (hero && context) startYarn(hero, context);

interface Point {
  x: number;
  y: number;
  px: number;
  py: number;
}

function startYarn(hero: HTMLElement, context: CanvasRenderingContext2D): void {
  const canvas = context.canvas;
  canvas.className = 'yarn-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  hero.append(canvas);
  const wide = matchMedia('(min-width: 901px)');

  const segments = 18;
  const radius = 21;
  const points: Point[] = Array.from({ length: segments + 1 }, () => ({
    x: 0,
    y: 0,
    px: 0,
    py: 0,
  }));
  const first = points[0] as Point;
  const ball = points[segments] as Point;
  let segment = 12;
  let ready = false;
  let drag: { x: number; y: number } | null = null;
  let spin = 0;
  let releasedAt = -Infinity;
  let width = 0;
  let height = 0;
  let heroBox = hero.getBoundingClientRect();

  // The pin sits on the navbar's bottom line, at the horizontal centre of the hero.
  const anchor = (): { x: number; y: number } => ({ x: hero.clientWidth / 2, y: 5 });

  function layout(): void {
    heroBox = hero.getBoundingClientRect();
    width = hero.clientWidth;
    height = hero.clientHeight;
    const ratio = Math.min(devicePixelRatio, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const pin = anchor();
    // The ball rests at the hero's vertical centre.
    const length = height * 0.5 - radius;
    segment = Math.max(length, 60) / segments;
    if (!ready) {
      // Start pulled out toward the name so it swings in on load.
      const start = { x: pin.x - length * 0.95, y: pin.y + length * 0.3 };
      points.forEach((point, index) => {
        const t = index / segments;
        point.x = point.px = pin.x + (start.x - pin.x) * t;
        point.y = point.py = pin.y + (start.y - pin.y) * t;
      });
      ready = true;
    }
  }

  function step(dt: number): void {
    const pin = anchor();
    heroBox = hero.getBoundingClientRect();
    const gravity = 2200 * dt * dt;
    points.forEach((point, index) => {
      if (index === 0) {
        point.x = point.px = pin.x;
        point.y = point.py = pin.y;
        return;
      }
      if (index === segments && drag) return;
      const vx = (point.x - point.px) * 0.99;
      const vy = (point.y - point.py) * 0.99;
      point.px = point.x;
      point.py = point.y;
      point.x += vx;
      point.y += vy + gravity;
    });
    if (drag) {
      ball.px = ball.x;
      ball.py = ball.y;
      ball.x = drag.x;
      ball.y = drag.y;
    }
    for (let pass = 0; pass < 14; pass += 1) {
      for (let index = 0; index < segments; index += 1) {
        const a = points[index] as Point;
        const b = points[index + 1] as Point;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy) || 0.001;
        const difference = (distance - segment) / distance;
        const pinnedA = index === 0;
        const pinnedB = index + 1 === segments && drag !== null;
        if (pinnedA && pinnedB) continue;
        const shareA = pinnedA ? 0 : pinnedB ? 1 : 0.5;
        const shareB = pinnedB ? 0 : pinnedA ? 1 : 0.5;
        a.x += dx * difference * shareA;
        a.y += dy * difference * shareA;
        b.x -= dx * difference * shareB;
        b.y -= dy * difference * shareB;
      }
    }
    // Keep the ball inside the hero, bouncing a little off the floor and walls.
    const floor = height - radius - 4;
    if (ball.y > floor) {
      ball.y = floor;
      ball.py = ball.y + (ball.y - ball.py) * 0.45;
      ball.px = ball.x - (ball.x - ball.px) * 0.8;
    }
    if (ball.x < radius) {
      ball.x = radius;
      ball.px = ball.x + (ball.x - ball.px) * 0.5;
    }
    if (ball.x > width - radius) {
      ball.x = width - radius;
      ball.px = ball.x + (ball.x - ball.px) * 0.5;
    }
    spin += (ball.x - ball.px) / radius;
    // Cats only react while the visitor is playing with the yarn (dragging, or just released).
    const active = drag !== null || performance.now() - releasedAt < 1500;
    dispatchEvent(
      new CustomEvent('yarn-ball', {
        detail: { x: ball.x + heroBox.left, y: ball.y + heroBox.top, active },
      }),
    );
  }

  function draw(): void {
    context.clearRect(0, 0, width, height);
    if (!ready || !wide.matches) return;
    // String: a smooth curve through the rope points.
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(first.x, first.y);
    for (let index = 1; index < segments; index += 1) {
      const point = points[index] as Point;
      const next = points[index + 1] as Point;
      context.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
    }
    context.lineTo(ball.x, ball.y);
    context.strokeStyle = '#1d1a17';
    context.lineWidth = 5;
    context.stroke();
    context.strokeStyle = '#f19bab';
    context.lineWidth = 2.6;
    context.stroke();
    // Lime pin on the navbar line.
    context.beginPath();
    context.arc(first.x, first.y, 6, 0, Math.PI * 2);
    context.fillStyle = '#d4ef69';
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = '#1d1a17';
    context.stroke();
    // Ball of yarn with rotating wraps.
    context.save();
    context.translate(ball.x, ball.y);
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.fillStyle = '#e07a8f';
    context.fill();
    context.save();
    context.clip();
    context.rotate(spin);
    context.strokeStyle = '#f7b3c0';
    context.lineWidth = 2.2;
    for (let wrap = -3; wrap <= 3; wrap += 1) {
      context.beginPath();
      context.ellipse(0, wrap * 6, radius * 1.1, radius * 0.42, 0.5, 0, Math.PI * 2);
      context.stroke();
    }
    context.restore();
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.lineWidth = 2.6;
    context.strokeStyle = '#1d1a17';
    context.stroke();
    context.beginPath();
    context.arc(-radius * 0.35, -radius * 0.4, radius * 0.18, 0, Math.PI * 2);
    context.fillStyle = '#ffd6de';
    context.fill();
    context.restore();
  }

  const local = (event: PointerEvent): { x: number; y: number } => ({
    x: event.clientX - heroBox.left,
    y: event.clientY - heroBox.top,
  });
  const overBall = (event: PointerEvent): boolean => {
    if (!ready || !wide.matches) return false;
    heroBox = hero.getBoundingClientRect();
    const point = local(event);
    return Math.hypot(point.x - ball.x, point.y - ball.y) < radius + 10;
  };
  addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !overBall(event)) return;
    event.preventDefault();
    drag = local(event);
    document.documentElement.classList.add('yarn-dragging');
    wake();
  });
  addEventListener('pointermove', (event) => {
    if (drag) {
      heroBox = hero.getBoundingClientRect();
      drag = local(event);
      wake();
      return;
    }
    hero.classList.toggle('over-yarn', overBall(event));
  });
  const release = (): void => {
    if (!drag) return;
    drag = null;
    releasedAt = performance.now();
    document.documentElement.classList.remove('yarn-dragging');
  };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);

  let frame = 0;
  let last = 0;
  let visible = true;
  function loop(timestamp: number): void {
    frame = 0;
    if (!visible || document.hidden || !wide.matches) return;
    const dt = Math.min(1 / 30, (timestamp - last) / 1000 || 1 / 60);
    last = timestamp;
    if (!ready) layout();
    if (motionAllowed() || drag) step(dt);
    draw();
    frame = requestAnimationFrame(loop);
  }
  function wake(): void {
    if (!frame && visible && !document.hidden && wide.matches) {
      last = performance.now();
      frame = requestAnimationFrame(loop);
    }
  }
  function settle(): void {
    // Reduced motion: let the string come to rest without animating, then draw it once.
    if (!ready) layout();
    for (let index = 0; index < 240; index += 1) step(1 / 60);
    draw();
  }
  new ResizeObserver(() => {
    layout();
    draw();
    wake();
  }).observe(hero);
  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    wake();
  }).observe(hero);
  document.addEventListener('visibilitychange', wake);
  wide.addEventListener('change', () => {
    layout();
    draw();
    wake();
  });
  onMotionChange(() => (motionAllowed() ? wake() : settle()));
  layout();
  if (motionAllowed()) wake();
  else settle();
}
