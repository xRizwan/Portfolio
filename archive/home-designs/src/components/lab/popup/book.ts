// The pop-up book engine. It runs the page in one of three presentations:
//
//   book   - wide screens with motion: one pinned 3D stage. Scroll position is mapped onto a
//            timeline of spreads; each spread's pieces stand up (--o on every [data-at]
//            element), fold flat, and then the right-hand page turns over the spine.
//   fx     - small screens with motion: flat pages in normal flow. The opening is pinned and
//            plays with scroll (cover swings open, scene stands up); elsewhere each piece
//            stands up as it scrolls into view.
//   static - reduced motion: nothing is set, the CSS shows every page open and flat.
//
// Only transforms and custom properties are written per frame.
import { motionAllowed, onMotionChange, select, selectAll } from '../../../scripts/motion';

export type Mode = 'static' | 'fx' | 'book';

interface Pop {
  el: HTMLElement;
  shadow: HTMLElement | null;
  /** Start of its rise within the spread's rise (0 to 1) and how long it takes. */
  at: number;
  dur: number;
  /** A standing piece (trembles) as opposed to an unfurl or slide driven by the same value. */
  stands: boolean;
  art: boolean;
  cat: boolean;
  seed: number;
  /** Cats duck and pop up: 0 hidden, 1 up. */
  peek: number;
  peekTarget: number;
  /** fx mode: document position at which the piece starts to rise. */
  anchor: number;
  lastO: number;
  lastTw: number;
}

interface Spread {
  el: HTMLElement;
  id: string;
  left: HTMLElement | null;
  right: HTMLElement | null;
  pops: Pop[];
  /** Lengths in viewport heights, from data attributes. */
  len: number;
  rise: number;
  fold: number;
  turn: number;
  /** The same in pixels, and where the spread starts on the scroll track. */
  start: number;
  lenPx: number;
  risePx: number;
  foldPx: number;
  turnPx: number;
  on: boolean;
  lastRise: number;
}

interface Camera {
  tx: number;
  ty: number;
  tilt: number;
  scale: number;
}

const root = document.documentElement;
const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const easeInOut = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
/** Ease out with a slight overshoot, so a piece snaps up past its angle and settles. */
const easeOutBack = (t: number): number => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const c = 1.9;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
};

const CLOSED_FRONT: Camera = { tx: -300, ty: -34, tilt: 24, scale: 0.84 };
const OPEN: Camera = { tx: 0, ty: 0, tilt: 50, scale: 1 };
const CLOSED_BACK: Camera = { tx: 300, ty: -34, tilt: 24, scale: 0.84 };

export function initBook(): { mode: () => Mode; velocity: () => number } {
  const track = select('[data-pb-track]', HTMLElement);
  const cam = select('[data-pb-cam]', HTMLElement);
  const vol = select('[data-pb-vol]', HTMLElement);
  const opening = select('[data-pb-opening]', HTMLElement);
  const boardL = select('[data-pb-board="l"]', HTMLElement);
  const boardR = select('[data-pb-board="r"]', HTMLElement);
  let mode: Mode = 'static';
  let velocity = 0;
  if (!track || !cam || !vol) return { mode: () => mode, velocity: () => velocity };

  const num = (el: HTMLElement, name: string, fallback: number): number => {
    const raw = el.dataset[name];
    const value = raw === undefined ? NaN : Number(raw);
    return Number.isFinite(value) ? value : fallback;
  };

  const spreads: Spread[] = selectAll('.pb-spread', HTMLElement, vol).map((el) => ({
    el,
    id: el.id,
    left: select(':scope > .pb-page--l', HTMLElement, el),
    right: select(':scope > .pb-page--r', HTMLElement, el),
    pops: selectAll('[data-at]', HTMLElement, el).map((pop, index) => ({
      el: pop,
      shadow: null,
      at: num(pop, 'at', 0),
      dur: num(pop, 'dur', 0.3),
      stands: pop.classList.contains('pb-pop'),
      art: pop.classList.contains('pb-pop--art'),
      cat: pop.dataset.cat !== undefined,
      seed: index * 1.7 + el.id.length,
      peek: 0,
      peekTarget: 0,
      anchor: 0,
      lastO: -1,
      lastTw: 0,
    })),
    len: num(el, 'len', 190),
    rise: num(el, 'rise', 55),
    fold: num(el, 'fold', 18),
    turn: num(el, 'turn', 48),
    start: 0,
    lenPx: 0,
    risePx: 0,
    foldPx: 0,
    turnPx: 0,
    on: false,
    lastRise: -1,
  }));
  const last = spreads.length - 1;
  const navLinks = selectAll('.pb-head__nav a', HTMLAnchorElement);

  // ---------- shared state ----------
  let vh = innerHeight;
  let vw = innerWidth;
  let fit = 1;
  let smoothY = scrollY;
  let lastY = scrollY;
  let pointerX = 0;
  let pointerY = 0;
  let px = 0;
  let py = 0;
  let pointerClientX = -1;
  let current = 0;
  let catClock = 0;
  let frameId = 0;

  // ---------- shadows (book only; the CSS hides them elsewhere) ----------
  let shadowsMade = false;
  const makeShadows = (): void => {
    if (shadowsMade) return;
    shadowsMade = true;
    for (const spread of spreads) {
      for (const pop of spread.pops) {
        if (!pop.stands || pop.el.dataset.noshadow !== undefined) continue;
        const parent = pop.el.parentElement;
        if (!parent) continue;
        // Keep lists valid: a shadow inside a list is a presentational list item.
        const inList = parent.tagName === 'UL' || parent.tagName === 'OL';
        const shadow = document.createElement(inList ? 'li' : 'div');
        shadow.className = pop.art ? 'pb-shadow' : 'pb-shadow pb-shadow--card';
        shadow.setAttribute('aria-hidden', 'true');
        if (inList) shadow.setAttribute('role', 'presentation');
        for (const name of ['--x', '--y', '--w', '--h']) {
          shadow.style.setProperty(name, pop.el.style.getPropertyValue(name));
        }
        const mask = pop.el.dataset.mask;
        if (mask) shadow.style.setProperty('--mask', `url(${mask})`);
        if (pop.el.classList.contains('pb-flip')) shadow.classList.add('pb-flip');
        shadow.append(document.createElement('i'));
        parent.insertBefore(shadow, pop.el);
        pop.shadow = shadow;
      }
    }
  };

  const setPop = (pop: Pop, o: number, tw: number): void => {
    if (Math.abs(o - pop.lastO) > 0.0015) {
      pop.lastO = o;
      const value = o.toFixed(4);
      pop.el.style.setProperty('--o', value);
      pop.shadow?.style.setProperty('--o', value);
    }
    if (pop.stands && Math.abs(tw - pop.lastTw) > 0.01) {
      pop.lastTw = tw;
      pop.el.style.setProperty('--tw', tw.toFixed(3));
    }
  };

  const clearAll = (): void => {
    for (const spread of spreads) {
      spread.el.classList.remove('is-on', 'is-up');
      spread.el.style.removeProperty('--open');
      spread.el.style.removeProperty('visibility');
      spread.on = false;
      spread.lastRise = -1;
      for (const page of [spread.left, spread.right]) {
        if (!page) continue;
        page.style.removeProperty('transform');
        page.style.removeProperty('visibility');
        page.style.removeProperty('--shade');
      }
      for (const pop of spread.pops) {
        pop.el.style.removeProperty('--o');
        pop.el.style.removeProperty('--tw');
        pop.shadow?.style.removeProperty('--o');
        pop.lastO = -1;
        pop.lastTw = 0;
      }
    }
    for (const board of [boardL, boardR]) {
      board?.style.removeProperty('transform');
      board?.style.removeProperty('visibility');
    }
    cam.style.removeProperty('transform');
    vol.style.removeProperty('--px');
    track.style.removeProperty('--pb-track');
  };

  // ---------- layout ----------
  const trackTop = (): number => track.getBoundingClientRect().top + scrollY;

  const layout = (): void => {
    vh = innerHeight;
    vw = innerWidth;
    if (mode === 'book') {
      // The book is drawn at 1200 x 640 design pixels and scaled to the window.
      fit = Math.min(1.5, vw / 1528, vh / 760);
      let y = 0;
      for (const spread of spreads) {
        spread.start = y;
        spread.lenPx = (spread.len * vh) / 100;
        spread.risePx = (spread.rise * vh) / 100;
        spread.foldPx = (spread.fold * vh) / 100;
        spread.turnPx = (spread.turn * vh) / 100;
        y += spread.lenPx;
      }
      track.style.setProperty('--pb-track', `${Math.round(y + vh)}px`);
    } else if (mode === 'fx') {
      // Measure where each piece sits with its transform switched off.
      root.classList.add('pb-measure');
      const top = scrollY;
      for (const spread of spreads) {
        for (const pop of spread.pops) {
          const rect = pop.el.getBoundingClientRect();
          pop.anchor = rect.top + top + Math.min(rect.height * 0.5, vh * 0.25);
        }
      }
      root.classList.remove('pb-measure');
    }
  };

  /** Scroll position at which a spread is fully up. */
  const restOf = (index: number): number => {
    const spread = spreads[index];
    if (!spread) return 0;
    if (index === 0) return trackTop();
    return trackTop() + spread.start + spread.risePx + vh * 0.05;
  };

  const pickMode = (): Mode => {
    if (!motionAllowed()) return 'static';
    const roomy = innerWidth >= 1180 && innerHeight >= 620;
    return roomy && CSS.supports('transform-style', 'preserve-3d') ? 'book' : 'fx';
  };

  const setMode = (next: Mode): void => {
    if (next !== mode) {
      // Keep the reader on the same spread across a change of presentation.
      const keep = mode === 'book' ? spreads[current] : undefined;
      clearAll();
      mode = next;
      root.classList.toggle('pb-m-book', mode === 'book');
      root.classList.toggle('pb-m-fx', mode === 'fx');
      if (mode === 'book') makeShadows();
      layout();
      if (keep && keep.id) keep.el.scrollIntoView();
      smoothY = scrollY;
      lastY = scrollY;
    } else {
      layout();
    }
    cancelAnimationFrame(frameId);
    if (mode !== 'static') frameId = requestAnimationFrame(frame);
  };

  // ---------- cats ----------
  const updateCats = (spread: Spread, time: number, hide: boolean): void => {
    const cats = spread.pops.filter((pop) => pop.cat);
    if (cats.length === 0) return;
    if (time - catClock > 260) {
      catClock = time;
      let best: Pop | undefined;
      if (pointerClientX >= 0) {
        // The cat nearest the pointer comes up; the others stay down.
        let bestDistance = Infinity;
        for (const cat of cats) {
          const rect = cat.el.getBoundingClientRect();
          const distance = Math.abs(rect.left + rect.width / 2 - pointerClientX);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = cat;
          }
        }
      } else {
        // No pointer (touch): take turns.
        best = cats[Math.floor(time / 4200) % cats.length];
      }
      for (const cat of cats) cat.peekTarget = cat === best && !hide ? 1 : 0;
    }
    for (const cat of cats) cat.peek += (cat.peekTarget - cat.peek) * 0.1;
  };

  // ---------- book ----------
  const camFor = (index: number): Camera =>
    index <= 0 ? CLOSED_FRONT : index >= last ? CLOSED_BACK : OPEN;

  const setOn = (spread: Spread, on: boolean): void => {
    if (spread.on === on) return;
    spread.on = on;
    spread.el.classList.toggle('is-on', on);
    if (!on) {
      spread.el.classList.remove('is-up');
      for (const page of [spread.left, spread.right]) {
        if (!page) continue;
        page.style.removeProperty('transform');
        page.style.removeProperty('visibility');
        page.style.removeProperty('--shade');
      }
      for (const pop of spread.pops) setPop(pop, 0, 0);
      if (spread.lastRise !== 0) {
        spread.lastRise = 0;
        spread.el.dispatchEvent(new CustomEvent('pb-rise', { detail: 0 }));
      }
    }
  };

  const frameBook = (time: number): void => {
    const y = Math.max(0, smoothY - trackTop());
    let index = last;
    for (let i = 0; i < spreads.length; i += 1) {
      const candidate = spreads[i];
      if (candidate && y < candidate.start + candidate.lenPx) {
        index = i;
        break;
      }
    }
    const spread = spreads[index];
    if (!spread) return;
    const next = spreads[index + 1];
    const local = y - spread.start;
    const turnStart = spread.lenPx - spread.turnPx;
    const foldStart = turnStart - spread.foldPx;
    const rise = spread.risePx > 0 ? clamp01(local / spread.risePx) : 1;
    const fold = spread.foldPx > 0 ? clamp01((local - foldStart) / spread.foldPx) : 0;
    const turn = spread.turnPx > 0 && next ? clamp01((local - turnStart) / spread.turnPx) : 0;
    const turned = easeInOut(turn);
    const theta = turned * 180;
    const standing = 1 - easeInOut(fold);

    if (index !== current) {
      current = index;
      for (const link of navLinks) {
        if (link.hash === `#${spread.id}`) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
    }

    spreads.forEach((item, i) => setOn(item, i === index || (i === index + 1 && turn > 0)));

    // Pieces of the open spread.
    const shake = Math.min(3.2, Math.abs(velocity) * 0.05);
    updateCats(spread, time, Math.abs(velocity) > 26);
    for (const pop of spread.pops) {
      let o = easeOutBack(clamp01((rise - pop.at) / pop.dur)) * standing;
      if (pop.cat) o *= pop.peek;
      const amp = (pop.art ? 0.8 : 0.22) + shake * (pop.art ? 1 : 0.3);
      const tw = pop.stands ? Math.sin(time * 0.0019 + pop.seed) * amp * Math.min(1, o) : 0;
      setPop(pop, o, tw);
    }
    spread.el.classList.toggle('is-up', rise * standing > 0.97);
    const risen = Math.round(rise * standing * 100) / 100;
    if (risen !== spread.lastRise) {
      spread.lastRise = risen;
      spread.el.dispatchEvent(new CustomEvent('pb-rise', { detail: risen }));
    }

    // The turning leaf: this spread's right page going over, the next one's left page on its back.
    const lift = turn > 0 ? 4 + 8 * Math.sin((theta * Math.PI) / 180) : 0;
    const shade = Math.sin((theta * Math.PI) / 180);
    // Scrolling fast riffles the page that is about to turn: its free edge lifts a little.
    const riffle =
      next && turn === 0 ? Math.min(9, Math.max(0, Math.abs(velocity) - 16) * 0.14) : 0;
    const rightTurn =
      turn > 0
        ? `rotateY(${(-theta).toFixed(2)}deg) translateZ(${lift}px)`
        : riffle > 0.05
          ? `rotateY(${(-riffle).toFixed(2)}deg)`
          : '';
    const leftTurn =
      turn > 0 ? `rotateY(${(180 - theta).toFixed(2)}deg) translateZ(${lift}px)` : '';
    if (spread.right) {
      spread.right.style.transform = rightTurn;
      spread.right.style.visibility = theta >= 90 ? 'hidden' : '';
      spread.right.style.setProperty('--shade', (shade * 0.3).toFixed(3));
    }
    if (spread.left) {
      spread.left.style.transform = '';
      spread.left.style.visibility = '';
      spread.left.style.setProperty('--shade', (turned * (1 - turned) * 0.5).toFixed(3));
    }
    if (next && turn > 0) {
      for (const pop of next.pops) setPop(pop, 0, 0);
      if (next.left) {
        next.left.style.transform = leftTurn;
        next.left.style.visibility = theta > 90 ? '' : 'hidden';
        next.left.style.setProperty('--shade', (shade * 0.22).toFixed(3));
      }
      if (next.right) {
        next.right.style.transform = '';
        next.right.style.visibility = '';
        next.right.style.setProperty('--shade', ((1 - turned) * 0.16).toFixed(3));
      }
    }

    // Boards: the left one arrives with the cover, the right one leaves with the last page.
    if (boardL) {
      const opening0 = index === 0;
      boardL.style.visibility = index > 0 || theta > 90 ? '' : 'hidden';
      boardL.style.transform =
        opening0 && turn > 0
          ? `rotateY(${(180 - theta).toFixed(2)}deg) translateZ(${lift - 4}px)`
          : '';
    }
    if (boardR) {
      const closing = index === last - 1;
      boardR.style.visibility = index >= last || (closing && theta >= 90) ? 'hidden' : '';
      boardR.style.transform =
        closing && turn > 0 ? `rotateY(${(-theta).toFixed(2)}deg) translateZ(${lift - 4}px)` : '';
    }

    // Camera: close on the shut book, back and tilted down for the open spreads.
    const from = camFor(index);
    const to = camFor(index + 1);
    const tx = lerp(from.tx, to.tx, turned);
    const ty = lerp(from.ty, to.ty, turned);
    const tilt = lerp(from.tilt, to.tilt, turned) - py * 2.2;
    const scale = lerp(from.scale, to.scale, turned) * fit;
    cam.style.transform = `translate3d(0, ${(ty * fit).toFixed(1)}px, 0) scale(${scale.toFixed(4)}) rotateX(${tilt.toFixed(2)}deg) rotateY(${(px * 3.4).toFixed(2)}deg) translateX(${tx.toFixed(1)}px)`;
    vol.style.setProperty('--px', px.toFixed(3));
  };

  // ---------- fx ----------
  const frameFx = (time: number): void => {
    const y = scrollY;
    let q = 1;
    if (opening) {
      const rect = opening.getBoundingClientRect();
      q = clamp01(-rect.top / Math.max(1, rect.height - vh));
    }
    const cover = spreads[0];
    if (cover) {
      const open = easeInOut(clamp01(q / 0.3));
      cover.el.style.setProperty('--open', open.toFixed(3));
      cover.el.style.visibility = open >= 0.999 ? 'hidden' : '';
    }
    const hide = Math.abs(velocity) > 26;
    spreads.forEach((spread, index) => {
      const rect = spread.el.getBoundingClientRect();
      if (rect.bottom < -vh || rect.top > vh * 2) return;
      updateCats(spread, time + index * 900, hide);
      const timeline = index === 1 ? clamp01((q - 0.2) / 0.72) : -1;
      for (const pop of spread.pops) {
        let o =
          timeline >= 0
            ? easeOutBack(clamp01((timeline - pop.at) / pop.dur))
            : easeOutBack(clamp01((y + vh * 0.98 - pop.anchor - pop.at * vh * 0.1) / (vh * 0.3)));
        if (pop.cat) o *= pop.peek;
        setPop(pop, o, 0);
      }
    });
  };

  const frame = (time: number): void => {
    frameId = requestAnimationFrame(frame);
    const y = scrollY;
    velocity += (y - lastY - velocity) * 0.3;
    lastY = y;
    // A little smoothing so wheel steps do not make the pages jerk.
    smoothY += (y - smoothY) * 0.2;
    if (Math.abs(y - smoothY) < 0.3) smoothY = y;
    px += (pointerX - px) * 0.07;
    py += (pointerY - py) * 0.07;
    if (mode === 'book') frameBook(time);
    else if (mode === 'fx') frameFx(time);
  };

  // ---------- events ----------
  addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType === 'touch') return;
      pointerX = (event.clientX / vw) * 2 - 1;
      pointerY = (event.clientY / vh) * 2 - 1;
      pointerClientX = event.clientX;
    },
    { passive: true },
  );

  let resizeTimer = 0;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => setMode(pickMode()), 120);
  });
  addEventListener('load', () => layout());
  onMotionChange(() => setMode(pickMode()));

  const spreadIndexOf = (target: Element | null): number =>
    target ? spreads.findIndex((spread) => spread.el.contains(target)) : -1;

  // In the book, in-page links travel along the scroll track to the spread they name.
  const goTo = (index: number, smooth: boolean): void => {
    scrollTo({ top: restOf(index), behavior: smooth ? 'smooth' : 'auto' });
  };
  document.addEventListener('click', (event) => {
    if (mode !== 'book' || !(event.target instanceof Element)) return;
    const link = event.target.closest('a[href^="#"]');
    if (!(link instanceof HTMLAnchorElement) || link.hash.length < 2) return;
    const index = spreads.findIndex((spread) => spread.id === link.hash.slice(1));
    if (index < 0) return;
    event.preventDefault();
    history.replaceState(null, '', link.hash);
    goTo(index, true);
  });
  // Keyboard focus landing in a spread that is not open brings that spread up.
  document.addEventListener('focusin', (event) => {
    if (mode !== 'book' || !(event.target instanceof Element)) return;
    const index = spreadIndexOf(event.target);
    if (index >= 0 && index !== current) goTo(index, false);
  });

  setMode(pickMode());
  if (mode === 'book' && location.hash.length > 1) {
    const index = spreads.findIndex((spread) => spread.id === location.hash.slice(1));
    if (index > 0) goTo(index, false);
  }

  return { mode: () => mode, velocity: () => velocity };
}
