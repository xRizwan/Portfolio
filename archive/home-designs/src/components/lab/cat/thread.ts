// The yarn thread that leaves the opening scene and wanders down the page. It unrolls as far as
// the reader has scrolled, a ball of yarn rides its loose end, and the cursor can pluck it.
import { finePointer, motionAllowed, onMotionChange, select } from '../../../scripts/motion';
import { clamp, lerp, onFrame, type Frame } from './ticker';

interface Node {
  x: number;
  y: number;
  /** Offset from rest, pushed by the cursor and pulled back by a spring. */
  ox: number;
  oy: number;
  vx: number;
  vy: number;
}

const STEP = 70;

const smooth = (t: number): number => {
  const c = clamp(t);
  return c * c * (3 - 2 * c);
};

export function initThread(): void {
  const rest = select('[data-cat-rest]', HTMLElement);
  const svg = select('[data-cat-thread]', SVGSVGElement);
  const ball = select('[data-cat-thread-ball]', HTMLElement);
  if (!rest || !svg || !ball) return;
  const lines = [...svg.querySelectorAll<SVGPathElement>('[data-cat-thread-line]')];
  const reveal = svg.querySelector<SVGPathElement>('[data-cat-thread-reveal]');
  const first = lines[0];
  if (!first || !reveal) return;

  let nodes: Node[] = [];
  let total = 0;
  let drawn = 0;
  let restTop = 0;
  let dirty = true;
  let awake = false;

  /** Lays the thread out: down one gutter per section, crossing over in the gaps between. */
  const build = (): void => {
    const width = rest.clientWidth;
    const height = rest.offsetHeight;
    restTop = rest.getBoundingClientRect().top + window.scrollY;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const wide = width >= 1280;
    const narrow = width < 760;
    const gutter = wide ? ((width - 1160) / 2) * 0.46 : narrow ? 13 : 22;
    const wobble = wide ? 15 : narrow ? 2.5 : 6;
    const zone = narrow ? 70 : 110;
    const sideX = (side: string): number => (side === 'right' ? width - gutter : gutter);

    // Stops are "from this y on, hang at this x".
    const stops: { y: number; x: number }[] = [
      // Same spot the ball of yarn leaves the opening scene (--exit-x in Opening.astro).
      { y: 0, x: width * (width < 860 ? 0.2 : 0.14) },
    ];
    rest.querySelectorAll<HTMLElement>('[data-thread]').forEach((section) => {
      const top = section.getBoundingClientRect().top + window.scrollY - restTop;
      stops.push({ y: Math.max(zone, top), x: sideX(section.dataset.thread ?? 'left') });
    });
    const end = select('[data-thread-end]', HTMLElement, rest);
    let endY = height - 40;
    if (end) {
      const box = end.getBoundingClientRect();
      endY = box.top + window.scrollY - restTop + box.height * 0.5;
      stops.push({ y: endY - zone * 1.2, x: box.left + box.width * 0.5 });
    }

    const xAt = (y: number): number => {
      let x = stops[0]?.x ?? gutter;
      for (const stop of stops.slice(1)) {
        x = lerp(x, stop.x, smooth((y - (stop.y - zone)) / (zone * 2)));
      }
      // Settle the wobble near the very end so the thread meets its target.
      const calm = clamp((endY - y) / 200);
      return x + (Math.sin(y / 170) + Math.sin(y / 61) * 0.35) * wobble * calm;
    };

    nodes = [];
    for (let y = 0; y < endY; y += STEP) {
      nodes.push({ x: xAt(y), y, ox: 0, oy: 0, vx: 0, vy: 0 });
    }
    nodes.push({ x: xAt(endY), y: endY, ox: 0, oy: 0, vx: 0, vy: 0 });
    dirty = true;
  };

  /** Catmull-Rom through the nodes, written as cubic Béziers. */
  const path = (): string => {
    const p = nodes.map((node) => ({ x: node.x + node.ox, y: node.y + node.oy }));
    const start = p[0];
    if (!start) return '';
    let d = `M${start.x.toFixed(1)} ${start.y.toFixed(1)}`;
    for (let i = 0; i < p.length - 1; i += 1) {
      const p0 = p[Math.max(0, i - 1)];
      const p1 = p[i];
      const p2 = p[i + 1];
      const p3 = p[Math.min(p.length - 1, i + 2)];
      if (!p0 || !p1 || !p2 || !p3) continue;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const write = (): void => {
    const d = path();
    lines.forEach((line) => line.setAttribute('d', d));
    reveal?.setAttribute('d', d);
    total = first?.getTotalLength() ?? 0;
    if (reveal) reveal.style.strokeDasharray = `${total} ${total}`;
    dirty = false;
  };

  /** Length along the thread at which it reaches document height `y` (the thread only goes down). */
  const lengthAt = (y: number): number => {
    if (!first || total === 0) return 0;
    let low = 0;
    let high = total;
    for (let i = 0; i < 14; i += 1) {
      const mid = (low + high) / 2;
      if (first.getPointAtLength(mid).y < y) low = mid;
      else high = mid;
    }
    return low;
  };

  const place = (length: number): void => {
    if (!first || !reveal) return;
    reveal.style.strokeDashoffset = String(total - length);
    const point = first.getPointAtLength(length);
    const size = ball?.offsetWidth ?? 40;
    if (ball) {
      ball.style.transform = `translate(${(point.x - size / 2).toFixed(1)}px, ${(point.y - size / 2).toFixed(1)}px) rotate(${((length / (size / 2)) * 57.3).toFixed(1)}deg)`;
      ball.style.opacity = length > 8 ? '1' : '0';
    }
  };

  const drawStatic = (): void => {
    if (dirty) write();
    drawn = total;
    place(total);
  };

  const frame = ({ scrollY, viewH }: Frame): void => {
    // Springs for the nodes the cursor has plucked.
    if (awake) {
      let moving = false;
      for (const node of nodes) {
        if (node.ox === 0 && node.oy === 0 && node.vx === 0 && node.vy === 0) continue;
        node.vx = (node.vx - node.ox * 0.09) * 0.86;
        node.vy = (node.vy - node.oy * 0.09) * 0.86;
        node.ox += node.vx;
        node.oy += node.vy;
        if (Math.abs(node.ox) + Math.abs(node.oy) + Math.abs(node.vx) + Math.abs(node.vy) < 0.08) {
          node.ox = node.oy = node.vx = node.vy = 0;
        } else {
          moving = true;
        }
      }
      awake = moving;
      dirty = true;
    }
    if (dirty) write();
    const target = lengthAt(scrollY - restTop + viewH * 0.62);
    drawn = Math.abs(target - drawn) < 0.5 ? target : lerp(drawn, target, 0.2);
    place(drawn);
  };

  build();
  write();
  svg.classList.add('is-ready');

  // Section heights change when jars are tipped out or fonts arrive, so lay the thread out again.
  let queued = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(queued);
    queued = requestAnimationFrame(() => {
      build();
      if (!motionAllowed()) drawStatic();
    });
  }).observe(rest);

  // Plucking: the cursor drags nearby thread along with it for a moment.
  let lastX = 0;
  let lastY = 0;
  addEventListener(
    'pointermove',
    (event) => {
      if (!finePointer.matches || !motionAllowed()) return;
      const x = event.clientX;
      const y = event.clientY + window.scrollY - restTop;
      const dx = clamp(x - lastX, -40, 40);
      const dy = clamp(y - lastY, -40, 40);
      lastX = x;
      lastY = y;
      const index = Math.round(y / STEP);
      for (let i = index - 2; i <= index + 2; i += 1) {
        const node = nodes[i];
        if (!node) continue;
        const distance = Math.hypot(node.x + node.ox - x, node.y + node.oy - y);
        if (distance > 90) continue;
        const pull = (1 - distance / 90) * 0.5;
        node.vx += dx * pull;
        node.vy += dy * pull * 0.5;
        awake = true;
      }
    },
    { passive: true },
  );

  onFrame(frame);
  const settle = (): void => {
    if (!motionAllowed()) drawStatic();
  };
  settle();
  onMotionChange(settle);
}
