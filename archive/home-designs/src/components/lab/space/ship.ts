// The travelling rocket. Once the opening launch is over it rides the lane in the right-hand
// gutter: its height in the lane is how far down the page you are, its nose points the way you
// are scrolling, it leans and burns harder the faster you go, and it leaves a trail of sparks.
import { select, selectAll } from '../../../scripts/motion';
import { clamp01, mix, onFrame } from './frame';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  colour: string;
}

export interface Ship {
  /** Where the ship is on screen, so the launch rocket can fly to it and hand over. */
  spot(): { x: number; y: number; tall: number } | null;
  /** The ship stays hidden until the launch rocket has arrived in the lane. */
  show(on: boolean): void;
}

const SPARKS = ['#f2b134', '#e4572e', '#f6ecd7', '#76c7b0', '#f2b134'];

export function initShip(): Ship {
  const lane = select('[data-sp-lane]', HTMLElement);
  const ship = select('[data-sp-ship]', HTMLElement);
  const flame = select('[data-sp-ship-flame]', HTMLElement);
  const stops = select('[data-sp-lane-stops]', HTMLElement);
  const found = select('[data-sp-trail]', HTMLCanvasElement);
  const pen = found?.getContext('2d');
  const launch = select('[data-sp-launch]', HTMLElement);
  if (!lane || !ship || !flame || !found || !pen) {
    return { spot: () => null, show: () => undefined };
  }
  const canvas: HTMLCanvasElement = found;
  const context: CanvasRenderingContext2D = pen;

  const sparks: Spark[] = [];
  const dots: { element: HTMLElement; at: number }[] = [];
  let shown = false;
  let start = 0;
  let end = 1;
  let top = 100;
  let bottom = 600;
  let angle = 180;
  let heading = 180;
  let lean = 0;
  let debt = 0;
  let ratio = 1;

  function measure(): void {
    const viewport = innerHeight;
    start = launch ? launch.offsetTop + launch.offsetHeight - viewport : 0;
    end = Math.max(start + 1, document.documentElement.scrollHeight - viewport);
    top = 104;
    bottom = viewport - 96;
    ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(canvas.clientWidth * ratio);
    canvas.height = Math.round(canvas.clientHeight * ratio);
    for (const dot of dots) {
      const section = dot.element.dataset.for
        ? document.getElementById(dot.element.dataset.for)
        : null;
      if (!section) continue;
      // The ship reaches a dot when that section's top is in the middle of the screen.
      const at = clamp01((section.offsetTop - viewport * 0.5 - start) / (end - start));
      dot.at = at;
      dot.element.style.top = `${mix(top, bottom, at)}px`;
    }
  }

  // One marker in the lane for every stop on the trip.
  if (stops) {
    for (const section of selectAll('[data-sp-stop]', HTMLElement)) {
      if (!section.id) continue;
      const element = document.createElement('span');
      element.className = 'sp-lane-stop';
      element.dataset.for = section.id;
      stops.append(element);
      dots.push({ element, at: 0 });
    }
  }

  measure();
  addEventListener('resize', measure);
  // Opening a mission log or loading an image changes the page height, and with it the route.
  new ResizeObserver(measure).observe(document.body);

  onFrame(
    (state) => {
      const progress = clamp01((state.scrollY - start) / (end - start));
      const y = mix(top, bottom, progress);
      if (state.velocity > 40) heading = 180;
      else if (state.velocity < -40) heading = 0;
      angle += (heading - angle) * Math.min(1, state.dt * 7);
      const speed = Math.abs(state.velocity);
      const wantLean = Math.max(-24, Math.min(24, state.velocity * 0.011));
      lean += (wantLean - lean) * Math.min(1, state.dt * 6);
      const sway = Math.sin(state.time * 1.3) * 3;
      const bob = Math.sin(state.time * 2.1) * 2.5;
      ship.style.transform = `translate3d(${sway + lean * 0.35}px, ${y + bob}px, 0) translate(-50%, -50%) rotate(${angle + lean}deg)`;
      const thrust = 0.5 + Math.min(1.9, speed / 900) + Math.sin(state.time * 31) * 0.07;
      flame.style.transform = `translateX(-50%) scale(${0.8 + Math.min(0.5, speed / 4000)}, ${thrust})`;
      for (const dot of dots) dot.element.classList.toggle('is-passed', progress >= dot.at);

      // Sparks: they leave from the tail and fall behind, more of them the faster the scroll.
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      if (!shown) {
        sparks.length = 0;
        return;
      }
      const centreX = canvas.clientWidth - lane.clientWidth / 2 + sway + lean * 0.35;
      const radians = ((angle + lean) * Math.PI) / 180;
      // Unit vector from the nose toward the tail.
      const tailX = -Math.sin(radians);
      const tailY = Math.cos(radians);
      const reach = ship.offsetHeight * 0.55;
      debt += state.dt * (5 + Math.min(70, speed / 28));
      while (debt >= 1 && sparks.length < 90) {
        debt -= 1;
        const spread = (Math.random() - 0.5) * 0.9;
        const push = 50 + Math.random() * 60 + speed * 0.16;
        sparks.push({
          x: centreX + tailX * reach + (Math.random() - 0.5) * 6,
          y: y + bob + tailY * reach,
          vx: (tailX + spread * tailY) * push,
          vy: (tailY - spread * tailX) * push,
          age: 0,
          life: 0.5 + Math.random() * 0.7,
          size: 1.6 + Math.random() * 3.2,
          colour: SPARKS[Math.floor(Math.random() * SPARKS.length)] ?? '#f2b134',
        });
      }
      debt = Math.min(debt, 2);
      for (let index = sparks.length - 1; index >= 0; index--) {
        const spark = sparks[index];
        if (!spark) continue;
        spark.age += state.dt;
        if (spark.age >= spark.life) {
          sparks.splice(index, 1);
          continue;
        }
        spark.x += spark.vx * state.dt;
        spark.y += spark.vy * state.dt;
        const left = 1 - spark.age / spark.life;
        context.globalAlpha = left;
        context.fillStyle = spark.colour;
        context.beginPath();
        context.arc(spark.x, spark.y, spark.size * (0.5 + left * 0.5), 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    },
    () => {
      sparks.length = 0;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
    },
  );

  return {
    spot() {
      // The bounding box of a rotated element is still centred on the element.
      const box = ship.getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2, tall: ship.offsetHeight };
    },
    show(on: boolean): void {
      if (on === shown) return;
      shown = on;
      lane.classList.toggle('is-flying', on);
    },
  };
}
