// The cats that live on the page after the opening: a kitten that trots along the bottom edge
// after the cursor, a calico that naps on whatever is being read, a grey cat that peeks over
// ledges, and the mess they make when the page is flung.
import { finePointer, motionAllowed, select, selectAll } from '../../../scripts/motion';
import { clamp, onFrame, onStartle, type Frame } from './ticker';

const setPose = (element: HTMLElement, pose: string): void => {
  if (element.dataset.pose !== pose) element.dataset.pose = pose;
};

/** Swaps to the eyes-closed drawing for a moment, at irregular intervals. */
function blinkLoop(element: HTMLElement, open: string, shut: string): void {
  const again = (): void => {
    window.setTimeout(
      () => {
        if (motionAllowed() && element.dataset.pose === open) {
          setPose(element, shut);
          window.setTimeout(() => {
            if (element.dataset.pose === shut) setPose(element, open);
          }, 190);
        }
        again();
      },
      2200 + Math.random() * 3800,
    );
  };
  again();
}

function initFollower(): void {
  const cat = select('[data-cat-follower]', HTMLElement);
  if (!cat) return;
  const quietZones = selectAll('[data-cat-nofollow]', HTMLElement);
  const switcher = select('.lab-switch', HTMLElement);

  let x = -200;
  let facing = 1;
  let pointerX: number | null = null;
  let stride = 0;
  let scaredUntil = 0;
  let fleeTo: number | null = null;

  addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType === 'mouse') pointerX = event.clientX;
    },
    { passive: true },
  );

  onStartle(() => {
    scaredUntil = performance.now() + 520;
    // Bolt to whichever side is further away.
    fleeTo = x < window.innerWidth / 2 ? window.innerWidth - 50 : 50;
  });

  blinkLoop(cat, 'sit', 'blink');

  onFrame(({ dt, now, viewW, viewH }: Frame) => {
    if (!finePointer.matches) {
      cat.classList.remove('is-out');
      return;
    }
    // Stay out of the pinned scenes, which have cats of their own on the floor.
    const hidden = quietZones.some((zone) => {
      const box = zone.getBoundingClientRect();
      return box.top < viewH * 0.7 && box.bottom > viewH * 0.8;
    });
    cat.classList.toggle('is-out', !hidden);

    let target = hidden ? (x < viewW / 2 ? -220 : viewW + 220) : (pointerX ?? viewW);
    if (!hidden) {
      // Follow at a distance, and only along the page margins: the kitten keeps to the gutter
      // on the cursor's side of the page so it never settles on top of the text column.
      const gutter = Math.max(64, (viewW - 1160) / 2 - 44);
      target =
        target < viewW / 2 ? clamp(target, 44, gutter) : clamp(target, viewW - gutter, viewW - 44);
      if (fleeTo !== null) target = fleeTo;
      // Never settle behind the preview switcher in the middle of the bottom edge.
      if (switcher) {
        const bar = switcher.getBoundingClientRect();
        if (target > bar.left - 70 && target < bar.right + 70) {
          target = x < (bar.left + bar.right) / 2 ? bar.left - 70 : bar.right + 70;
        }
      }
    }

    if (now < scaredUntil) {
      setPose(cat, 'startled');
      return;
    }

    const gap = target - x;
    if (Math.abs(gap) > 6) {
      const pace = fleeTo !== null ? 1100 : clamp(Math.abs(gap) * 3.2, 150, 640);
      const step = Math.min(Math.abs(gap), (pace * dt) / 1000);
      x += Math.sign(gap) * step;
      facing = gap > 0 ? 1 : -1;
      stride += step;
      setPose(cat, Math.floor(stride / 52) % 2 === 0 ? 'run-a' : 'run-b');
    } else {
      fleeTo = null;
      if (cat.dataset.pose !== 'blink') setPose(cat, 'sit');
      // Sit facing the cursor.
      if (pointerX !== null && Math.abs(pointerX - x) > 30) facing = pointerX > x ? 1 : -1;
    }
    cat.style.transform = `translateX(${x.toFixed(1)}px) scaleX(${facing})`;
  });
}

let napperOverride: HTMLElement | null = null;
let napperRefresh: (() => void) | null = null;

/** Sends the calico to sit on `perch` (the enlarged certificate) until called with null. */
export function setNapperPerch(perch: HTMLElement | null): void {
  napperOverride = perch;
  napperRefresh?.();
}

function initNapper(): void {
  const cat = select('[data-cat-napper]', HTMLElement);
  if (!cat) return;
  const perches = selectAll('[data-cat-perch]', HTMLElement);
  let current: HTMLElement | null = cat.parentElement;
  let hovered: HTMLElement | null = null;
  let moving = 0;
  let stillFor = 0;
  let settledAt = -1;

  const choose = (): HTMLElement | null => {
    if (napperOverride) return napperOverride;
    const viewH = window.innerHeight;
    if (hovered && finePointer.matches) {
      const box = hovered.getBoundingClientRect();
      if (box.top > 110 && box.top < viewH) return hovered;
    }
    let best: HTMLElement | null = null;
    let bestScore = Infinity;
    for (const perch of perches) {
      const box = perch.getBoundingClientRect();
      // The cat sits on the top edge, so that edge has to be on screen and clear of the header.
      if (box.width === 0 || box.top < 120 || box.top > viewH - 80) continue;
      const score = Math.abs(box.top + Math.min(box.height, 240) / 2 - viewH * 0.45);
      if (score < bestScore) {
        bestScore = score;
        best = perch;
      }
    }
    return best ?? current;
  };

  const refresh = (): void => {
    const next = choose();
    if (!next || next === current) {
      setPose(cat, napperOverride ? 'sit' : 'sleep');
      return;
    }
    current = next;
    window.clearTimeout(moving);
    cat.classList.remove('is-in');
    moving = window.setTimeout(
      () => {
        next.append(cat);
        setPose(cat, napperOverride ? 'sit' : 'sleep');
        // Restart the hop-in transition from its hidden state.
        void cat.offsetWidth;
        cat.classList.add('is-in');
      },
      motionAllowed() ? 190 : 0,
    );
  };
  napperRefresh = refresh;

  perches.forEach((perch) => {
    perch.addEventListener('pointerenter', () => {
      hovered = perch;
      if (motionAllowed()) refresh();
    });
    perch.addEventListener('focusin', () => {
      hovered = perch;
      if (motionAllowed()) refresh();
    });
  });

  onStartle(() => {
    if (napperOverride) return;
    setPose(cat, 'startled');
    cat.classList.add('is-jolted');
    window.setTimeout(() => {
      cat.classList.remove('is-jolted');
      setPose(cat, 'sleep');
    }, 1500);
  });

  blinkLoop(cat, 'sit', 'blink');

  // Move only once scrolling has settled, so she is not hopping about mid-scroll.
  onFrame(({ dt, speed, scrollY }: Frame) => {
    if (Math.abs(speed) > 0.04) {
      stillFor = 0;
      return;
    }
    stillFor += dt;
    if (stillFor > 260 && settledAt !== scrollY) {
      settledAt = scrollY;
      hovered = null;
      refresh();
    }
  });
}

function initPeekers(): void {
  const peekers = selectAll('[data-cat-peek]', HTMLElement);
  if (peekers.length === 0) return;

  const duck = (peeker: HTMLElement, ms: number): void => {
    peeker.classList.add('is-ducked');
    window.setTimeout(() => peeker.classList.remove('is-ducked'), ms);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-up', entry.isIntersecting);
      });
    },
    { rootMargin: '-12% 0px -12% 0px' },
  );
  peekers.forEach((peeker) => {
    observer.observe(peeker);
    blinkLoop(peeker, 'peek', 'blink');
  });

  // Shy: come too close with the cursor and it drops out of sight for a moment.
  addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') return;
      for (const peeker of peekers) {
        if (!peeker.classList.contains('is-up') || peeker.classList.contains('is-ducked')) continue;
        const box = peeker.getBoundingClientRect();
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        if (Math.hypot(dx, dy) < 110) duck(peeker, 1700);
      }
    },
    { passive: true },
  );

  onStartle(() => peekers.forEach((peeker) => duck(peeker, 2200)));
}

/** Fast scrolling leaves things crooked until someone straightens them. */
function initKnocks(): void {
  const things = selectAll('[data-cat-knock]', HTMLElement);
  onStartle(() => {
    const viewH = window.innerHeight;
    things.forEach((thing) => {
      const box = thing.getBoundingClientRect();
      if (box.bottom < 0 || box.top > viewH) return;
      thing.style.setProperty('--knock', `${(Math.random() * 14 - 7).toFixed(1)}deg`);
      thing.classList.add('is-knocked');
      window.setTimeout(() => thing.classList.remove('is-knocked'), 5200 + Math.random() * 1500);
    });
  });
  things.forEach((thing) => {
    thing.addEventListener('pointerenter', () => thing.classList.remove('is-knocked'));
  });
}

export function initResidents(): void {
  initFollower();
  initNapper();
  initPeekers();
  initKnocks();
}
