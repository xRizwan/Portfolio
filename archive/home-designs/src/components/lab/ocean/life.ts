// Everything that is always alive on the page: the school of fish and the bubbles (one canvas
// fixed behind the content), the sea turtle that drifts across now and then, and the octopus
// that takes the colour of whatever it is near.
import {
  finePointer,
  motionAllowed,
  onMotionChange,
  select,
  selectAll,
} from '../../../scripts/motion';

interface Fish {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  /** Index into `PAPERS`, or -1 for a painted sprite. */
  paper: number;
  sprite: HTMLImageElement | null;
  phase: number;
  /** Fish that have not arrived yet wait off-screen until the burst. */
  waiting: boolean;
}

interface Bubble {
  x: number;
  y: number;
  r: number;
  speed: number;
  phase: number;
}

/** Body and stripe colours for the small cut-paper fish. */
const PAPERS: readonly (readonly [string, string])[] = [
  ['#ff7a6b', '#fff7e6'],
  ['#ffc94a', '#12263a'],
  ['#fff7e6', '#ff7a6b'],
  ['#12263a', '#ffc94a'],
  ['#ff9d4a', '#fff7e6'],
];
const SPRITES = ['clownfish', 'parrotfish', 'puffer'] as const;

/** Colour filters that turn the coral-pink octopus into the paper it is sitting near. */
const TONES: Record<string, string> = {
  coral: 'hue-rotate(0deg) saturate(1) brightness(1)',
  sun: 'hue-rotate(36deg) saturate(1.25) brightness(1.12)',
  sand: 'hue-rotate(28deg) saturate(0.42) brightness(1.22)',
  teal: 'hue-rotate(172deg) saturate(0.75) brightness(0.95)',
  wood: 'hue-rotate(18deg) saturate(0.6) brightness(0.72)',
  navy: 'hue-rotate(208deg) saturate(0.7) brightness(0.6)',
};

/** Text that sits straight on the water, which swimming things keep clear of. */
const WORDS = '.oc-h2, .oc-place, .oc-note, .oc-hello, .oc-about-lead';

// The intro tells the fish where the water surface is; nothing swims above it.
let ceiling = 0;
let arrived = false;
const fishes: Fish[] = [];

export function setCeiling(y: number): void {
  ceiling = y;
}

/** Lets the waiting fish rush in from both sides. Called when the reef appears. */
export function burst(): void {
  if (arrived) return;
  arrived = true;
  const width = innerWidth;
  const height = innerHeight;
  for (const fish of fishes) {
    if (!fish.waiting) continue;
    fish.waiting = false;
    const fromLeft = Math.random() < 0.5;
    fish.x = fromLeft ? -40 - Math.random() * 260 : width + 40 + Math.random() * 260;
    fish.y = Math.max(ceiling + 40, height * (0.3 + Math.random() * 0.5));
    fish.vx = (fromLeft ? 1 : -1) * (5 + Math.random() * 5);
    fish.vy = (Math.random() - 0.5) * 3;
  }
}

/** Sends the fish that arrived in the burst back to waiting (when scrolling back to the top). */
export function gather(): void {
  if (!arrived) return;
  arrived = false;
  fishes.forEach((fish, index) => {
    if (index >= 7) fish.waiting = true;
  });
}

function drawPaperFish(context: CanvasRenderingContext2D, fish: Fish): void {
  const colours = PAPERS[fish.paper] ?? PAPERS[0];
  if (!colours) return;
  const s = fish.size;
  const wag = Math.sin(fish.phase) * 0.35;
  const shape = (): void => {
    context.beginPath();
    // Body: a leaf with a slightly lopsided belly, as if cut freehand.
    context.moveTo(s, 0);
    context.quadraticCurveTo(s * 0.3, -s * 0.62, -s * 0.55, -s * 0.08);
    context.lineTo(-s * 0.55, s * 0.1);
    context.quadraticCurveTo(s * 0.2, s * 0.56, s, 0);
    context.fill();
    // Tail: a triangle that wags.
    context.save();
    context.translate(-s * 0.5, 0);
    context.rotate(wag);
    context.beginPath();
    context.moveTo(s * 0.08, 0);
    context.lineTo(-s * 0.62, -s * 0.44);
    context.lineTo(-s * 0.5, s * 0.4);
    context.closePath();
    context.fill();
    context.restore();
  };
  // Shadow first, offset down and right like paper lifted off the page.
  context.save();
  context.translate(fish.x + 3, fish.y + 5);
  context.rotate(Math.atan2(fish.vy, fish.vx));
  if (fish.vx < 0) context.scale(1, -1);
  context.fillStyle = 'rgb(18 38 58 / 0.16)';
  shape();
  context.restore();

  context.save();
  context.translate(fish.x, fish.y);
  context.rotate(Math.atan2(fish.vy, fish.vx));
  if (fish.vx < 0) context.scale(1, -1);
  context.fillStyle = colours[0];
  shape();
  context.fillStyle = colours[1];
  context.beginPath();
  context.moveTo(s * 0.18, -s * 0.36);
  context.lineTo(s * 0.36, -s * 0.3);
  context.lineTo(s * 0.3, s * 0.3);
  context.lineTo(s * 0.1, s * 0.34);
  context.closePath();
  context.fill();
  context.fillStyle = '#12263a';
  context.beginPath();
  context.arc(s * 0.62, -s * 0.07, Math.max(1.2, s * 0.07), 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawSpriteFish(context: CanvasRenderingContext2D, fish: Fish): void {
  const image = fish.sprite;
  if (!image || !image.complete || image.naturalWidth === 0) return;
  const width = fish.size * 2.4;
  const height = (width * image.naturalHeight) / image.naturalWidth;
  // The artwork faces left. Tilt only a little so a painted fish never swims upside down.
  const tilt = Math.max(-0.4, Math.min(0.4, Math.atan2(fish.vy, Math.abs(fish.vx))));
  context.save();
  context.translate(fish.x, fish.y);
  if (fish.vx > 0) context.scale(-1, 1);
  context.rotate(-tilt + Math.sin(fish.phase * 0.5) * 0.05);
  context.drawImage(image, -width / 2, -height / 2, width, height);
  context.restore();
}

function initSchool(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext('2d');
  if (!context) return;
  let width = 0;
  let height = 0;
  const bubbles: Bubble[] = [];
  const pointer = { x: 0, y: 0, at: -1e9 };
  let scatterUntil = 0;
  let lastScroll = scrollY;
  let lastScrollAt = performance.now();
  let frame = 0;
  let previous = performance.now();

  const resize = (): void => {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    width = innerWidth;
    height = innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  resize();
  addEventListener('resize', resize);

  const sprites = SPRITES.map((name) => {
    const image = new Image();
    image.src = `/lab/ocean/${name}.webp`;
    return image;
  });
  const count = width < 760 ? 26 : 58;
  for (let index = 0; index < count; index += 1) {
    const sprite = index < sprites.length ? (sprites[index] ?? null) : null;
    fishes.push({
      x: Math.random() * width,
      y: height * (0.7 + Math.random() * 0.25),
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() - 0.5,
      size: sprite ? 22 + Math.random() * 8 : 9 + Math.random() * 9,
      paper: sprite ? -1 : index % PAPERS.length,
      sprite,
      phase: Math.random() * 6,
      // A handful are there from the start; the rest arrive with the reef.
      waiting: index >= 7,
    });
  }

  // Text that sits straight on the water (headings, hand notes). The fish swim behind the page
  // content anyway, but they also steer around these so nothing wriggles behind the words.
  const words = new Set<Element>();
  const wordWatcher = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) words.add(entry.target);
      else words.delete(entry.target);
    }
  });
  for (const element of selectAll(WORDS, HTMLElement)) wordWatcher.observe(element);
  let clear: DOMRect[] = [];
  let clearAge = 0;

  if (finePointer.matches) {
    addEventListener('pointermove', (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.at = performance.now();
    });
  }

  addEventListener(
    'scroll',
    () => {
      const now = performance.now();
      const delta = scrollY - lastScroll;
      const speed = Math.abs(delta) / Math.max(8, now - lastScrollAt);
      lastScroll = scrollY;
      lastScrollAt = now;
      // The fish live in the water, so they slide with the page a little as it scrolls.
      for (const fish of fishes) fish.y -= delta * 0.35;
      for (const bubble of bubbles) bubble.y -= delta * 0.5;
      if (speed > 2.4 && now > scatterUntil - 500) {
        scatterUntil = now + 1100;
        for (const fish of fishes) {
          const angle = Math.random() * Math.PI * 2;
          fish.vx += Math.cos(angle) * 7;
          fish.vy += Math.sin(angle) * 5 - Math.sign(delta) * 2;
        }
      }
    },
    { passive: true },
  );

  const step = (now: number): void => {
    frame = requestAnimationFrame(step);
    const dt = Math.min(2.2, (now - previous) / 16.7);
    previous = now;
    context.clearRect(0, 0, width, height);
    const top = Math.max(0, ceiling) + 26;
    const scattered = now < scatterUntil;
    const followPointer = now - pointer.at < 3500;
    // Without a recent pointer the school follows a slow figure of eight.
    const targetX = followPointer ? pointer.x : width * (0.5 + 0.34 * Math.sin(now / 5200));
    const targetY = followPointer
      ? pointer.y
      : top + (height - top) * (0.5 + 0.28 * Math.sin(now / 3700));

    // Re-measure the text boxes a few times a second rather than every frame.
    clearAge -= 1;
    if (clearAge <= 0) {
      clear = [...words].map((element) => element.getBoundingClientRect());
      clearAge = 6;
    }

    for (const fish of fishes) {
      if (fish.waiting) continue;
      for (const box of clear) {
        const pad = 34;
        if (
          fish.x > box.left - pad &&
          fish.x < box.right + pad &&
          fish.y > box.top - pad &&
          fish.y < box.bottom + pad
        ) {
          // Leave by the nearer of the top or bottom edge, and keep moving sideways.
          const up = fish.y < (box.top + box.bottom) / 2;
          fish.vy += (up ? -0.5 : 0.5) * dt;
          fish.vx += (fish.vx >= 0 ? 0.12 : -0.12) * dt;
        }
      }
      let cx = 0;
      let cy = 0;
      let ax = 0;
      let ay = 0;
      let sx = 0;
      let sy = 0;
      let near = 0;
      for (const other of fishes) {
        if (other === fish || other.waiting) continue;
        const dx = other.x - fish.x;
        const dy = other.y - fish.y;
        const distance = dx * dx + dy * dy;
        if (distance > 110 * 110) continue;
        near += 1;
        cx += other.x;
        cy += other.y;
        ax += other.vx;
        ay += other.vy;
        if (distance < 34 * 34 && distance > 0.01) {
          sx -= dx / distance;
          sy -= dy / distance;
        }
      }
      if (near > 0 && !scattered) {
        fish.vx += ((cx / near - fish.x) * 0.0016 + (ax / near - fish.vx) * 0.04) * dt;
        fish.vy += ((cy / near - fish.y) * 0.0016 + (ay / near - fish.vy) * 0.04) * dt;
      }
      fish.vx += sx * 2.2 * dt;
      fish.vy += sy * 2.2 * dt;
      if (!scattered) {
        // Loose pull toward the target: enough to follow, never enough to pile up on it.
        const tx = targetX - fish.x;
        const ty = targetY - fish.y;
        const reach = Math.hypot(tx, ty) || 1;
        if (reach > 70) {
          fish.vx += (tx / reach) * 0.05 * dt;
          fish.vy += (ty / reach) * 0.04 * dt;
        }
      }
      // Stay between the surface and the bottom edge.
      if (fish.y < top + 30) fish.vy += 0.16 * dt;
      if (fish.y > height - 40) fish.vy -= 0.12 * dt;
      if (fish.x < -80) fish.vx += 0.12 * dt;
      if (fish.x > width + 80) fish.vx -= 0.12 * dt;
      if (fish.y < top) fish.y = top;
      if (fish.y > height + 120) fish.y = height + 120;

      const cruise = fish.sprite ? 1.25 : 1.9;
      const speed = Math.hypot(fish.vx, fish.vy) || 0.01;
      // Ease back to cruising speed after a burst or a scatter.
      const wanted = speed > cruise ? speed - (speed - cruise) * 0.04 * dt : cruise;
      fish.vx = (fish.vx / speed) * wanted;
      fish.vy = (fish.vy / speed) * wanted * (Math.abs(fish.vy / speed) > 0.75 ? 0.96 : 1);
      fish.x += fish.vx * dt;
      fish.y += fish.vy * dt;
      fish.phase += (0.16 + speed * 0.07) * dt;
      if (fish.sprite) drawSpriteFish(context, fish);
      else drawPaperFish(context, fish);
    }

    // Bubbles rise from the bottom and pop at the surface.
    if (bubbles.length < (width < 760 ? 14 : 30) && Math.random() < 0.06 * dt) {
      bubbles.push({
        x: Math.random() * width,
        y: height + 20,
        r: 2.5 + Math.random() * 8,
        speed: 0.5 + Math.random() * 0.9,
        phase: Math.random() * 6,
      });
    }
    context.lineWidth = 1.6;
    for (let index = bubbles.length - 1; index >= 0; index -= 1) {
      const bubble = bubbles[index];
      if (!bubble) continue;
      bubble.y -= bubble.speed * dt;
      bubble.phase += 0.03 * dt;
      const x = bubble.x + Math.sin(bubble.phase) * 9;
      if (bubble.y < top - 12 || bubble.y < -20) {
        bubbles.splice(index, 1);
        continue;
      }
      context.beginPath();
      context.arc(x, bubble.y, bubble.r, 0, Math.PI * 2);
      context.fillStyle = 'rgb(255 247 230 / 0.16)';
      context.fill();
      context.strokeStyle = 'rgb(255 247 230 / 0.8)';
      context.stroke();
      context.beginPath();
      context.arc(x - bubble.r * 0.3, bubble.y - bubble.r * 0.3, bubble.r * 0.28, 0, Math.PI * 2);
      context.fillStyle = 'rgb(255 247 230 / 0.75)';
      context.fill();
    }
  };

  const sync = (): void => {
    cancelAnimationFrame(frame);
    if (motionAllowed() && !document.hidden) {
      previous = performance.now();
      frame = requestAnimationFrame(step);
    } else {
      context.clearRect(0, 0, width, height);
    }
  };
  onMotionChange(sync);
  document.addEventListener('visibilitychange', sync);
  sync();
}

function initTurtle(turtle: HTMLElement): void {
  let timer = 0;
  const swim = (): void => {
    if (!motionAllowed()) return;
    // Wait for open water: nothing to swim through while the page is still above the surface.
    if (ceiling > innerHeight * 0.3 || document.hidden) {
      timer = window.setTimeout(swim, 4000);
      return;
    }
    const leftward = Math.random() < 0.5;
    // Pick a lane that does not run behind a heading (a few tries, then take what there is).
    const boxes = selectAll(WORDS, HTMLElement).map((element) => element.getBoundingClientRect());
    let y = innerHeight * 0.5;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      y = innerHeight * (0.24 + Math.random() * 0.5);
      const lane = y;
      if (!boxes.some((box) => lane + 190 > box.top && lane - 90 < box.bottom)) break;
    }
    const span = innerWidth + 520;
    turtle.style.top = `${y}px`;
    // The artwork faces left, so it is flipped when the turtle travels right.
    turtle.style.setProperty('--flip', leftward ? '1' : '-1');
    const animation = turtle.animate(
      [
        { transform: `translate3d(${leftward ? span - 260 : -260}px, 0, 0)` },
        {
          transform: `translate3d(${leftward ? -260 : span - 260}px, ${-60 - Math.random() * 80}px, 0)`,
        },
      ],
      { duration: 26000 + Math.random() * 8000, easing: 'linear' },
    );
    turtle.classList.add('is-swimming');
    animation.onfinish = () => {
      turtle.classList.remove('is-swimming');
      timer = window.setTimeout(swim, 14000 + Math.random() * 14000);
    };
  };
  const sync = (): void => {
    clearTimeout(timer);
    if (motionAllowed()) {
      timer = window.setTimeout(swim, 5000);
    } else {
      for (const animation of turtle.getAnimations()) animation.cancel();
      turtle.classList.remove('is-swimming');
    }
  };
  onMotionChange(sync);
  sync();
}

function initOctopus(octopus: HTMLElement): void {
  const zones = selectAll('[data-tone]', HTMLElement).filter((zone) => zone.tagName === 'SECTION');
  let zoneTone = 'sand';
  let touchTone: string | null = null;
  let queued = false;

  const paint = (): void => {
    const tone = touchTone ?? zoneTone;
    octopus.style.setProperty('--tone', TONES[tone] ?? TONES.coral ?? 'none');
  };
  const locate = (): void => {
    queued = false;
    const middle = innerHeight * 0.6;
    let hidden = ceiling > innerHeight * 0.3;
    for (const zone of zones) {
      const rect = zone.getBoundingClientRect();
      if (rect.top <= middle && rect.bottom > middle) {
        zoneTone = zone.dataset.tone ?? 'sand';
        if (zone.hasAttribute('data-octopus-away')) hidden = true;
      }
    }
    octopus.classList.toggle('is-out', !hidden);
    paint();
  };
  addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(locate);
    },
    { passive: true },
  );
  addEventListener('resize', locate);
  locate();

  // Things with their own colour win over the section while they are hovered or focused.
  const toneOf = (target: EventTarget | null): string | null =>
    target instanceof Element
      ? (target.closest<HTMLElement>('[data-touch-tone]')?.dataset.touchTone ?? null)
      : null;
  const touch = (event: Event): void => {
    touchTone = toneOf(event.target);
    paint();
  };
  document.addEventListener('pointerover', touch);
  document.addEventListener('focusin', touch);

  // It ducks when the pointer comes close.
  if (finePointer.matches) {
    addEventListener('pointermove', (event) => {
      const rect = octopus.getBoundingClientRect();
      const distance = Math.hypot(
        event.clientX - (rect.left + rect.width / 2),
        event.clientY - (rect.top + rect.height / 2),
      );
      octopus.classList.toggle('is-shy', distance < 150);
    });
  }
}

export function initLife(): void {
  const canvas = select('[data-oc-school]', HTMLCanvasElement);
  if (canvas) initSchool(canvas);
  const turtle = select('[data-oc-turtle]', HTMLElement);
  if (turtle) initTurtle(turtle);
  const octopus = select('[data-oc-octopus]', HTMLElement);
  if (octopus) initOctopus(octopus);
}
